const express = require( 'express' );
let app = express();
const path = require( 'path' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );

app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );


app.get( '/', ( request, response ) => {
    response.send( 'Hello world' );
} );


app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );

app.listen( 8080 );