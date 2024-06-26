/*
*				libreevent - mysqldb.js
*
*	Created by Janis Hutz 07/12/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

import mysql from 'mysql';
import fs from 'fs';
import path from 'path';

declare let __dirname: string | undefined
if ( typeof( __dirname ) === 'undefined' ) {
    __dirname = path.resolve( path.dirname( '' ) );
} else {
    __dirname = __dirname + '/../';
}

// If the connection does not work for you, you will need to add your ip
// to the whitelist of the database

class SQLConfig {
    command: string;
    property?: string;
    searchQuery?: string;
    selection?: string;
    query?: string;
    newValues?: object;
    secondTable?: string;
    matchingParam?: string;
    data?: object;
}

class SQLDB {
    sqlConnection: mysql.Connection;
    isRecovering: boolean;
    config: object;
    constructor () {
        this.config = JSON.parse( '' + fs.readFileSync( path.join( __dirname + '/config/db.config.secret.json' ) ) );
        this.sqlConnection = mysql.createConnection( this.config );
        this.isRecovering = false;
    }

    connect () {
        return new Promise( ( resolve, reject ) => {
            const self = this;
            if ( this.isRecovering ) {
                console.log( '[ SQL ] Attempting to recover from critical error' );
                this.sqlConnection = mysql.createConnection( this.config );
                this.isRecovering = false;
            }
            this.sqlConnection.connect( ( err ) => {
                if ( err ) {
                    console.error( '[ SQL ]: An error ocurred whilst connecting: ' + err.stack );
                    reject( err );
                    return;
                }
                console.log( '[ SQL ] Connected to database successfully' );
                self.sqlConnection.on( 'error', ( err ) => {
                    if ( err.code === 'ECONNRESET' ) {
                        console.error( '[ SQL ] Reconnecting to database, because connection was reset!' );
                        self.isRecovering = true;
                        setTimeout( () => {
                            self.disconnect();
                            self.connect();
                        }, 1000 );
                    } else {
                        console.error( err );
                    }
                } );
                resolve( 'connection' );
            } );
        } );
    }

    disconnect ( ) {
        this.sqlConnection.end();
    }

    async setupDB () {
        this.sqlConnection.query( 'SELECT @@default_storage_engine;', ( error, results ) => {
            if ( error ) throw error;
            if ( results[ 0 ][ '@@default_storage_engine' ] !== 'InnoDB' ) throw 'DB HAS TO USE InnoDB!';
        } );
        this.sqlConnection.query( 'CREATE TABLE jh_store_users ( account_id INT ( 10 ) NOT NULL AUTO_INCREMENT, email TINYTEXT NOT NULL, data VARCHAR( 55000 ), uid TINYTEXT, lang TINYTEXT, username TINYTEXT, stripe_user_id TINYTEXT, settings VARCHAR( 5000 ), PRIMARY KEY ( account_id ) ) ENGINE=INNODB;', ( error ) => {
            if ( error ) if ( error.code !== 'ER_TABLE_EXISTS_ERROR' ) throw error;
            return 'DONE';
        } );
    }

    query ( operation: SQLConfig, table: string ): Promise<Array<Object>> {
        return new Promise( ( resolve, reject ) => {
            /* 
                Possible operation.command values (all need the table argument of the method call):
                    - getAllData: no additional instructions needed

                    - getFilteredData: 
                        - operation.property (the column to search for the value), 
                        - operation.searchQuery (the value to search for [will be sanitised by method])

                    - InnerJoin (Select values that match in both tables):
                        - operation.property (the column to search for the value),
                        - operation.searchQuery (the value to search for [will be sanitised by method])
                        - operation.selection (The columns of both tables to be selected, e.g. users.name, orders.id)
                        - operation.secondTable (The second table to perform Join operation with)
                        - operation.matchingParam (Which properties should be matched to get the data, e.g. order.user_id=users.id)

                    - LeftJoin (Select values in first table and return all corresponding values of second table): 
                        - operation.property (the column to search for the value), 
                        - operation.searchQuery (the value to search for [will be sanitised by method])
                        - operation.selection (The columns of both tables to be selected, e.g. users.name, orders.id)
                        - operation.secondTable (The second table to perform Join operation with)
                        - operation.matchingParam (Which properties should be matched to get the data, e.g. order.user_id=users.id)

                    - RightJoin (Select values in second table and return all corresponding values of first table): 
                        - operation.property (the column to search for the value), 
                        - operation.searchQuery (the value to search for [will be sanitised by method])
                        - operation.selection (The columns of both tables to be selected, e.g. users.name, orders.id)
                        - operation.secondTable (The second table to perform Join operation with)
                        - operation.matchingParam (Which properties should be matched to get the data, e.g. order.user_id=users.id)

                    - addData:
                        - operation.data (key-value pair with all data as values and column to insert into as key)
                    
                    - deleteData:
                        - operation.property (the column to search for the value)
                        - operation.searchQuery (the value to search for [will be sanitised by method])
                    
                    - updateData:
                        - operation.newValues (a object with keys being the column and value being the value to be inserted into that column, values are being
                            sanitised by the function)
                        - operation.property (the column to search for the value), 
                        - operation.searchQuery (the value to search for [will be sanitised by method])

                    - checkDataAvailability:
                        - operation.property (the column to search for the value), 
                        - operation.searchQuery (the value to search for [will be sanitised by method])

                    - fullCustomCommand:
                        - operation.query (the SQL instruction to be executed) --> NOTE: This command will not be sanitised, so use only with proper sanitisation!
            */
            let command = '';
            if ( operation.command === 'getAllData' ) {
                command = 'SELECT * FROM ' + table;
            } else if ( operation.command === 'getFilteredData' || operation.command === 'checkDataAvailability' ) {
                command = 'SELECT * FROM ' + table + ' WHERE ' + operation.property + ' = ' + this.sqlConnection.escape( operation.searchQuery );
            } else if ( operation.command === 'fullCustomCommand' ) {
                command = operation.query;
            } else if ( operation.command === 'addData' ) {
                let keys = '';
                let values = '';
                for ( let key in operation.data ) {
                    keys += String( key ) + ', ';
                    values += this.sqlConnection.escape( String( operation.data[ key ] ) ) + ', ' ;
                }
                command = 'INSERT INTO ' + table + ' (' + keys.slice( 0, keys.length - 2 ) + ') VALUES (' +  values.slice( 0, values.length - 2 ) + ');';
            } else if ( operation.command === 'updateData' ) {
                if ( !operation.property || !operation.searchQuery ) reject( 'Refusing to run destructive command: Missing Constraints' );
                else {
                    command = 'UPDATE ' + table + ' SET ';
                    let updatedValues = '';
                    for ( let value in operation.newValues ) {
                        updatedValues += value + ' = ' + this.sqlConnection.escape( String( operation.newValues[ value ] ) ) + ', ';
                    }
                    command += updatedValues.slice( 0, updatedValues.length - 2 );
                    command += ' WHERE ' + operation.property + ' = ' + this.sqlConnection.escape( operation.searchQuery );
                }
            } else if ( operation.command === 'deleteData' ) {
                if ( !operation.property || !operation.searchQuery ) reject( 'Refusing to run destructive command: Missing Constraints' );
                else {
                    command = 'DELETE FROM ' + table + ' WHERE ' + operation.property + ' = ' + this.sqlConnection.escape( operation.searchQuery );
                }
            } else if ( operation.command === 'InnerJoin' ) {
                command = 'SELECT ' + operation.selection + ' FROM ' + table + ' INNER JOIN ' + operation.secondTable + ' ON ' + operation.matchingParam + ' WHERE ' + operation.property + ' = ' + this.sqlConnection.escape( operation.searchQuery );
            } else if ( operation.command === 'LeftJoin' ) {
                command = 'SELECT ' + operation.selection + ' FROM ' + table + ' LEFT JOIN ' + operation.secondTable + ' ON ' + operation.matchingParam + ' WHERE ' + operation.property + ' = ' + this.sqlConnection.escape( operation.searchQuery );
            } else if ( operation.command === 'RightJoin' ) {
                command = 'SELECT ' + operation.selection + ' FROM ' + table + ' RIGHT JOIN ' + operation.secondTable + ' ON ' + operation.matchingParam + ' WHERE ' + operation.property + ' = ' + this.sqlConnection.escape( operation.searchQuery );
            }
            this.sqlConnection.query( command, ( error, results ) => {
                if ( error ) reject( error );
                resolve( results );
            } );
        } );
    }
}

export { SQLConfig, SQLDB };