const express = require( 'express' );
let app = express();
const path = require( 'path' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );
const dialog = require( 'electron' ).dialog;

app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );


app.get( '/', ( request, response ) => {
    response.send( 'Hello world' );
} );


app.get( '/openSongs', ( req, res ) => {
    res.send( { 'data': dialog.showOpenDialogSync( { properties: [ 'openDirectory' ], title: 'Open music library folder' } ) } );
} );


app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );

app.listen( 8081 );