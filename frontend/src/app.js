const express = require( 'express' );
let app = express();
const path = require( 'path' );
const cors = require( 'cors' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );
const dialog = require( 'electron' ).dialog;

app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );
app.use( cors() );

app.get( '/', ( request, response ) => {
    response.send( 'Hello world' );
} );


app.get( '/openSongs', ( req, res ) => {
    res.send( '{ "data": [ "/home/janis/Music/KB2022" ] }' )
    // res.send( { 'data': dialog.showOpenDialogSync( { properties: [ 'openDirectory' ], title: 'Open music library folder' } ) } );
} );

app.get( '/indexDirs', ( req, res ) => {
    if ( req.query.dir ) {
        fs.readdir( req.query.dir, { encoding: 'utf-8' }, ( err, dat ) => {
            if ( err ) res.status( 500 ).send( 'err' );
            res.send( dat );
        } );
    } else {
        res.status( 400 ).send( 'ERR_REQ_INCOMPLETE' );
    }
} );

app.get( '/getSongDetails', ( req, res ) => {
    if ( req.query.filename ) {
        fs.readFile( req.query.filename, ( err, data ) => {
            res.send( '' + data );
        } );
    } else {
        res.status( 400 ).send( 'ERR_REQ_INCOMPLETE' );
    }
} );


app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );

app.listen( 8081 );