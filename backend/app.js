const express = require( 'express' );
let app = express();
const path = require( 'path' );
const expressSession = require( 'express-session' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );
const cookieParser = require( 'cookie-parser' )
const favicon = require( 'serve-favicon' );

app.use( expressSession ( {
    secret: 'akgfsdkgfösdolfgslöodfvolwseifvoiwefö',
    resave: true,
    saveUninitialized: true
} ) );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );
app.use( cookieParser() );
app.use( favicon( path.join( __dirname + '' ) ) );

app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );


app.get( '/', ( request, response ) => {

} );


const PORT = process.env.PORT || 8080;
http.createServer( app ).listen( PORT );