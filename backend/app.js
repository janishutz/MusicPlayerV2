const express = require( 'express' );
let app = express();
const path = require( 'path' );
const expressSession = require( 'express-session' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );
const cookieParser = require( 'cookie-parser' )
const favicon = require( 'serve-favicon' );
const static = require( 'express-static' );

const authKey = '' + fs.readFileSync( path.join( __dirname + '/authorizationKey.txt' ) );

app.use( expressSession ( {
    secret: 'akgfsdkgfösdolfgslöodfvolwseifvoiwefö',
    resave: true,
    saveUninitialized: true
} ) );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );
app.use( cookieParser() );
app.use( favicon( path.join( __dirname + '' ) ) );
app.use( static() );


app.post( '/connect', ( request, response ) => {
    if ( request.session.authorized ) {
        response.send( 'Already authenticated' );
    } else {
        if ( request.body.authKey === authKey ) {
            request.session.authorized = true;
            response.send( 'Handshake OK' );   
        } else {
            response.status( 403 ).send( 'AuthKey wrong' );
        }
    }
} );

app.post( '/statusUpdate/:update', ( req, res ) => {
    if ( req.session.authorized ) {
        res.send( 'thanks' );
    } else {
        res.status( 403 ).send( 'Unauthorized' );
    }
} );

app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );

const PORT = process.env.PORT || 8080;
http.createServer( app ).listen( PORT );