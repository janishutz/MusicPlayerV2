const express = require( 'express' );
let app = express();
const path = require( 'path' );
const expressSession = require( 'express-session' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );
// const favicon = require( 'serve-favicon' );

const authKey = '' + fs.readFileSync( path.join( __dirname + '/authorizationKey.txt' ) );

app.use( expressSession ( {
    secret: 'akgfsdkgfösdolfgslöodfvolwseifvoiwefö',
    resave: true,
    saveUninitialized: true
} ) );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );
// app.use( favicon( path.join( __dirname + '' ) ) );

let connectedClients = {};
let currentDetails = {
    'songQueue': [],
    'playingSong': {},
    'pos': 0,
    'isPlaying': false,
    'queuePos': 0,
};

app.get( '/', ( request, response ) => {
    response.sendFile( path.join( __dirname + '/ui/index.html' ) );
} );

app.get( '/showcase.js', ( request, response ) => {
    response.sendFile( path.join( __dirname + '/ui/showcase.js' ) );
} );

app.get( '/showcase.css', ( request, response ) => {
    response.sendFile( path.join( __dirname + '/ui/showcase.css' ) );
} );

app.post( '/authSSE', ( req, res ) => {
    if ( req.body.authKey === authKey ) {
        req.session.isAuth = true;
        res.send( 'ok' );
    } else {
        res.send( 'hello' );
    }
} );

app.post( '/fancy/auth', ( req, res ) => {
    if ( req.body.key === authKey ) {
        req.session.isAuth = true;
        res.redirect( '/fancy' );
    } else {
        res.send( 'wrong' );
    }
} );

app.get( '/fancy', ( req, res ) => {
    if ( req.session.isAuth ) {
        res.sendFile( path.join( __dirname + '/ui/fancy/showcase.html' ) );
    } else {
        res.sendFile( path.join( __dirname + '/ui/fancy/auth.html' ) );
    }
} );

app.get( '/fancy/showcase.js', ( req, res ) => {
    if ( req.session.isAuth ) {
        res.sendFile( path.join( __dirname + '/ui/fancy/showcase.js' ) );
    } else {
        res.redirect( '/' );
    }
} );

app.get( '/fancy/showcase.css', ( req, res ) => {
    if ( req.session.isAuth ) {
        res.sendFile( path.join( __dirname + '/ui/fancy/showcase.css' ) );
    } else {
        res.redirect( '/' );
    }
} );

app.get( '/fancy/backgroundAnim.css', ( req, res ) => {
    if ( req.session.isAuth ) {
        res.sendFile( path.join( __dirname + '/ui/fancy/backgroundAnim.css' ) );
    } else {
        res.redirect( '/' );
    }
} );

let connectedMain = {};

app.get( '/mainNotifier', ( req, res ) => {
    const ipRetrieved = req.headers[ 'x-forwarded-for' ];
    const ip = ipRetrieved ? ipRetrieved.split( /, / )[ 0 ] : req.connection.remoteAddress;
    if ( req.session.isAuth ) {
        res.writeHead( 200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        } );
        res.status( 200 );
        res.flushHeaders();
        let det = { 'type': 'basics' };
        res.write( `data: ${ JSON.stringify( det ) }\n\n` );
        connectedMain = res;
    } else {
        res.send( 'wrong' );
    }
} );

// STATUS UPDATE from the client display to send to main ui
// Send update if page is closed
const allowedMainUpdates = [ 'blur', 'visibility' ];
app.post( '/clientStatusUpdate', ( req, res ) => {
    if ( allowedMainUpdates.includes( req.body.type ) ) {
        const ipRetrieved = req.headers[ 'x-forwarded-for' ];
        const ip = ipRetrieved ? ipRetrieved.split( /, / )[ 0 ] : req.connection.remoteAddress;
        sendClientUpdate( req.body.type, ip );
        res.send( 'ok' );
    } else {
        res.status( 400 ).send( 'ERR_UNKNOWN_TYPE' );
    }
} );

const sendClientUpdate = ( update, ip ) => {
    try {
        connectedMain.write( 'data: ' + JSON.stringify( { 'type': update, 'ip': ip } ) + '\n\n' );
    } catch ( err ) {}
}


app.post( '/connect', ( request, response ) => {
    if ( request.body.authKey === authKey ) {
        request.session.authorized = true;
        response.send( 'Handshake OK' );   
    } else {
        response.status( 403 ).send( 'AuthKey wrong' );
    }
} );

app.get( '/clientDisplayNotifier', ( req, res ) => {
    res.writeHead( 200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    } );
    res.status( 200 );
    res.flushHeaders();
    let det = { 'type': 'basics', 'data': currentDetails };
    res.write( `data: ${ JSON.stringify( det ) }\n\n` );
    connectedClients[ req.session.id ] = res;
} );

const sendUpdate = ( update ) => {
    for ( let client in connectedClients ) {
        connectedClients[ client ].write( 'data: ' + JSON.stringify( { 'type': update, 'data': currentDetails[ update ] } ) + '\n\n' );
    }
};

const allowedTypes = [ 'playingSong', 'isPlaying', 'songQueue', 'pos', 'queuePos' ];
app.post( '/statusUpdate', ( req, res ) => {
    if ( req.body.authKey === authKey ) {
        if ( allowedTypes.includes( req.body.type ) ) {
            currentDetails[ req.body.type ] = req.body.data
            res.send( 'thanks' );
            sendUpdate( req.body.type );
        } else {
            res.status( 400 ).send( 'incorrect request' );
        }
    } else {
        res.status( 403 ).send( 'Unauthorized' );
    }
} );

app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );

const PORT = process.env.PORT || 3000;
app.listen( PORT );