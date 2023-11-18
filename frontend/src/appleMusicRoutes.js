/*
*				MusicPlayerV2 - appleMusicRoutes.js
*
*	Created by Janis Hutz 11/14/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const path = require( 'path' );
const fs = require( 'fs' );
const csv = require( 'csv-parser' );
const dialog = require( 'electron' ).dialog;

const analyzeFile = ( filepath ) => {
    return new Promise( ( resolve, reject ) => {
        if ( filepath.includes( '.csv' ) ) {
            // This will assume that line #1 will be song #1 in the file list
            // (when sorted by name)
            let results = {};
            let pos = 0;
            fs.createReadStream( filepath )
            .pipe( csv() )
            .on( 'data', ( data ) => {
                results[ pos ] = data;
                pos += 1;
            } ).on( 'end', () => {
                resolve( results );
            } );
        } else if ( filepath.includes( '.json' ) ) {
            resolve( JSON.parse( fs.readFileSync( filepath ) ) );
        } else {
            reject( 'NO_CSV_OR_JSON_FILE' );
        }
    } );
}

module.exports = ( app ) => {
    app.get( '/apple-music', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/appleMusic/index.html' ) );
    } );

    app.get( '/apple-music/helpers/:file', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/appleMusic/' + req.params.file ) );
    } );

    app.get( '/icon-font.css', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/icon-font.css' ) );
    } );

    app.get( '/iconFont.woff2', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/iconFont.woff2' ) );
    } );

    app.get( '/logo.png', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/logo.png' ) );
    } );

    app.get( '/apple-music/getAdditionalData', ( req, res ) => {
        const filepath = dialog.showOpenDialogSync( { 
            properties: [ 'openFile' ],
            title: 'Open file with additional data on the songs',
            filters: [
                { 
                    name: 'All supported files (.csv, .json)', 
                    extensions: [ 'csv', 'json' ],
                },
                { 
                    name: 'JSON', 
                    extensions: [ 'json' ],
                },
                { 
                    name: 'CSV', 
                    extensions: [ 'csv' ],
                }
            ],
        } )[ 0 ];
        analyzeFile( filepath ).then( analyzedFile => {
            res.send( analyzedFile );
        } ).catch( () => {
            res.status( 500 ).send( 'no csv / json file' );
        } )
    } );
}