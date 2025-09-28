/*
*				libreevent - db.js
*
*	Created by Janis Hutz 03/26/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

import path from 'path';
import fs from 'fs';
import * as sqlDB from './mysqldb.js';

declare let __dirname: string | undefined;

if ( typeof __dirname === 'undefined' ) {
    __dirname = path.resolve( path.dirname( '' ) );
} else {
    __dirname = __dirname + '/../';
}

const dbRef = {
    'user': 'music_users',
    'users': 'music_users',
};
const dbh = new sqlDB.SQLDB();

dbh.connect();

/**
 * Initialize database (create tables, etc)
 * @returns {undefined}
 */
const initDB = (): undefined => {
    ( async () => {
        console.log( '[ DB ] Setting up...' );
        dbh.setupDB();
        console.log( '[ DB ] Setting up complete!' );
    } )();
};

/**
 * Retrieve data from the database
 * @param {string} db The name of the database
 * @param {string} column The name of the column of the data-table in which to search for the searchQuery
 * @param {string} searchQuery The query for the selected column
 * @returns {Promise<object>} Returns a promise that resolves to an object containing the results.
 */
const getDataSimple = ( db: string, column: string, searchQuery: string ): Promise<object> => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( {
            'command': 'getFilteredData',
            'property': column,
            'searchQuery': searchQuery
        }, dbRef[ db ] ).then( data => {
            resolve( data );
        } )
            .catch( error => {
                reject( error );
            } );
    } );
};

/**
 * Use the SQL LeftJoin function to obtain data from DB.
 * @param {string} db DB name to get data from
 * @param {string} column The column in the DB in which to search for the searchQuery
 * @param {string} searchQuery The data to look for in the selected column
 * @param {string} secondTable The second table on which to perform the left join function
 * @param {object} columns The columns to return, list of objects: { 'db': TABLE NAME, 'column': COLUMN NAME })
 * @param {string} nameOfMatchingParam Which properties should be matched to get the data, e.g. order.user_id=users.id
 * @returns {Promise<Object | Error>} Returns all records from the db and all matching data specified with the matchingParam from the secondTable.
 */
const getDataWithLeftJoinFunction = ( db: string, column: string, searchQuery: string, secondTable: string, columns: object, nameOfMatchingParam: string ): Promise<object> => {
    /*
    LeftJoin (Select values in first table and return all corresponding values of second table):
        - operation.property (the column to search for the value),
        - operation.searchQuery (the value to search for [will be sanitised by method])
        - operation.columns (The columns of both tables to be selected, list of objects: { 'db': TABLE NAME, 'column': COLUMN NAME })
        - operation.secondTable (The second table to perform Join operation with)
        - operation.matchingParam (Which properties should be matched to get the data, e.g. order.user_id=users.id)
    */
    return new Promise( ( resolve, reject ) => {
        const settings = {
            'command': 'LeftJoin',
            'property': column,
            'searchQuery': searchQuery,
            'selection': '',
            'secondTable': dbRef[ secondTable ],
            'matchingParam': dbRef[ db ] + '.' + nameOfMatchingParam + '=' + dbRef[ secondTable ] + '.' + nameOfMatchingParam,
        };

        for ( const el in columns ) {
            settings.selection += dbRef[ columns[ el ].db ] + '.' + columns[ el ].column + ',';
        }

        settings.selection = settings.selection.slice( 0, settings.selection.length - 1 );
        dbh.query( settings, dbRef[ db ] ).then( data => {
            resolve( data );
        } )
            .catch( error => {
                reject( error );
            } );
    } );
};

/**
 * Get all data from the selected database
 * @param {string} db The database of which all data should be retrieved
 * @returns {Promise<object>} Returns an object containing all data
 */
const getData = ( db: string ): Promise<object> => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( {
            'command': 'getAllData'
        }, dbRef[ db ] ).then( data => {
            resolve( data );
        } )
            .catch( error => {
                reject( error );
            } );
    } );
};

/**
 * Write data to the database
 * @param {string} db The database in which the data should be written
 * @param {string} column The column in which to search for the data
 * @param {string} searchQuery The query with which to search
 * @param {string} data The data to write. Also include the column & searchQuery parameters, if they also need to be added
 * @returns {Promise<object>} Returns a promise that resolves to the interaction module return.
 */
const writeDataSimple = ( db: string, column: string, searchQuery: string, data: any ): Promise<object> => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( {
            'command': 'checkDataAvailability',
            'property': column,
            'searchQuery': searchQuery
        }, dbRef[ db ] ).then( res => {
            if ( res.length > 0 ) {
                dbh.query( {
                    'command': 'updateData',
                    'property': column,
                    'searchQuery': searchQuery,
                    'newValues': data
                }, dbRef[ db ] ).then( dat => {
                    resolve( dat );
                } )
                    .catch( error => {
                        reject( error );
                    } );
            } else {
                dbh.query( {
                    'command': 'addData',
                    'data': data
                }, dbRef[ db ] ).then( dat => {
                    resolve( dat );
                } )
                    .catch( error => {
                        reject( error );
                    } );
            }
        } )
            .catch( error => {
                reject( error );
            } );
    } );
};

/**
 * Delete data from the database
 * @param {string} db The database from which the data should be deleted
 * @param {string} column The column in which to search for the data
 * @param {string} searchQuery The query with which to search
 * @returns {Promise<object>} Returns a promise that resolves to the interaction module return.
 */
const deleteDataSimple = ( db: string, column: string, searchQuery: string ): Promise<object> => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( {
            'command': 'deleteData',
            'property': column,
            'searchQuery': searchQuery
        }, dbRef[ db ] ).then( dat => {
            resolve( dat );
        } )
            .catch( error => {
                reject( error );
            } );
    } );
};

/**
 * Check if the data is available in the database.
 * @param {string} db The database in which to check
 * @param {string} column The column in which to search for the data
 * @param {string} searchQuery The query with which to search
 * @returns {Promise<boolean>} Returns a promise that resolves to a boolean (true = is available)
 */
const checkDataAvailability = ( db: string, column: string, searchQuery: string ): Promise<boolean> => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( {
            'command': 'checkDataAvailability',
            'property': column,
            'searchQuery': searchQuery
        }, dbRef[ db ] ).then( res => {
            if ( res.length > 0 ) {
                resolve( true );
            } else {
                resolve( false );
            }
        } )
            .catch( error => {
                reject( error );
            } );
    } );
};

/**
 * Load multiple JSON files at once
 * @param {Array<string>} files The files which to load
 * @returns {Promise<object>} Returns the data from all files
 */
const getJSONDataBatch = async ( files: Array<string> ): Promise<object> => {
    const allFiles = {};

    for ( const file in files ) {
        try {
            allFiles[ files[ file ] ] = await getJSONData( files[ file ] );
        } catch ( err ) {
            allFiles[ files[ file ] ] = 'ERROR: ' + err;
        }
    }

    return allFiles;
};

/**
 * Load all data from a JSON file
 * @param {string} file The file to load (just file name, file must be in "/data/" folder, no file extension)
 * @returns {Promise<object>} The data that was loaded
 */
const getJSONData = ( file: string ): Promise<object> => {
    return new Promise( ( resolve, reject ) => {
        fs.readFile( path.join( __dirname + '/' + file + '.json' ), ( error, data ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                if ( data.byteLength > 0 ) {
                    resolve( JSON.parse( data.toString() ) ?? {} );
                } else {
                    resolve( { } );
                }
            }
        } );
    } );
};

/**
 * Load some data from a JSON file
 * @param {string} file The file to load (just file name, file must be in "/data/" folder, no file extension)
 * @param {string} identifier The identifier of the element which should be loaded
 * @returns {Promise<object>} The data that was loaded
 */
const getJSONDataSimple = ( file: string, identifier: string ): Promise<object> => {
    return new Promise( ( resolve, reject ) => {
        fs.readFile( path.join( __dirname + '/' + file + '.json' ), ( error, data ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                if ( data.byteLength > 0 ) {
                    resolve( JSON.parse( data.toString() )[ identifier ] ?? {} );
                } else {
                    resolve( { } );
                }
            }
        } );
    } );
};

/**
 * Get JSON data, but synchronous (blocking)
 * @param {string} file The file to be loaded (path relative to root)
 * @returns {object} Returns the JSON file
 */
const getJSONDataSync = ( file: string ): object => {
    return JSON.parse( fs.readFileSync( path.join( __dirname + '/' + file ) ).toString() );
};

/**
 * Description
 * @param {any} db:string
 * @param {any} identifier:string
 * @param {any} values:any
 * @returns {any}
 */
const writeJSONDataSimple = ( db: string, identifier: string, values: any ) => {
    return new Promise( ( resolve, reject ) => {
        fs.readFile( path.join( __dirname + '/../../data/' + db + '.json' ), ( error, data ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                let dat = {};

                if ( data.byteLength > 0 ) {
                    dat = JSON.parse( data.toString() ) ?? {};
                }

                dat[ identifier ] = values;
                fs.writeFile( path.join( __dirname + '/../../data/' + db + '.json' ), JSON.stringify( dat ), error => {
                    if ( error ) {
                        reject( 'Error occurred: Error trace: ' + error );
                    }

                    resolve( true );
                } );
            }
        } );
    } );
};

/**
 * Write data to a JSON file
 * @param {string} db The database to write into
 * @param {object} data The data to write
 * @returns {Promise<boolean>}
 */
const writeJSONData = ( db: string, data: object ): Promise<boolean> => {
    return new Promise( ( resolve, reject ) => {
        fs.writeFile( path.join( __dirname + '/../../data/' + db + '.json' ), JSON.stringify( data ), error => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                resolve( true );
            }
        } );
    } );
};

/**
 * Delete data from a JSON file
 * @param {string} db The file to delete from (just filename, has to be in "/data/" folder, no file extension)
 * @param {string} identifier The identifier of the element to delete
 * @returns {Promise<boolean>} Returns a promise that resolves to a boolean
 */
const deleteJSONDataSimple = ( db: string, identifier: string ): Promise<boolean> => {
    return new Promise( ( resolve, reject ) => {
        fs.readFile( path.join( __dirname + '/../../data/' + db + '.json' ), ( error, data ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                let dat = {};

                if ( data.byteLength > 0 ) {
                    dat = JSON.parse( data.toString() ) ?? {};
                }

                delete dat[ identifier ];
                fs.writeFile( path.join( __dirname + '/../../data/' + db + '.json' ), JSON.stringify( dat ), error => {
                    if ( error ) {
                        reject( 'Error occurred: Error trace: ' + error );
                    }

                    resolve( true );
                } );
            }
        } );
    } );
};

export default {
    initDB,
    checkDataAvailability,
    deleteDataSimple,
    deleteJSONDataSimple,
    getData,
    getDataSimple,
    getDataWithLeftJoinFunction,
    getJSONData,
    getJSONDataBatch,
    getJSONDataSimple,
    getJSONDataSync,
    writeDataSimple,
    writeJSONData,
    writeJSONDataSimple
};
