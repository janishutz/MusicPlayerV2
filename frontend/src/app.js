const express = require( 'express' );
let app = express();
const path = require( 'path' );
const cors = require( 'cors' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );
const dialog = require( 'electron' ).dialog;
const session = require( 'express-session' );
const indexer = require( './indexer.js' );
const axios = require( 'axios' );
const ip = require( 'ip' );
const jwt = require( 'jsonwebtoken' );
const shell = require( 'electron' ).shell;


app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );
app.use( cors() );
app.use( session( {
    secret: 'aeogetwöfaöow0ofö034eö8ptqw39eöavfui786uqew9t0ez9eauigwöfqewoöaiq938w0c8p9awöäf9¨äüöe',
    saveUninitialized: true,
    resave: false,
} ) );

const conf = JSON.parse( fs.readFileSync( path.join( __dirname + '/config/config.json' ) ) );

// TODO: Import from config
const remoteURL = conf.connectionURL ?? 'http://localhost:3000';
let hasConnected = false;

const connect = () => {
    if ( authKey !== '' && conf.doConnect ) {
        axios.post( remoteURL + '/connect', { 'authKey': authKey } ).then( res => {
            if ( res.status === 200 ) {
                console.log( '[ BACKEND INTEGRATION ] Connection successful' );
                hasConnected = true;
            } else {
                console.error( '[ BACKEND INTEGRATION ] Connection error occurred' );
            }
        } ).catch( err => {
            console.error( err );
        } );
        return 'connecting';
    } else {
        return 'noAuthKey';
    }
};

let authKey = conf.authKey ?? '';

connect();


let connectedClients = {};
let changedStatus = [];

let currentDetails = {
    'songQueue': [],
    'playingSong': {},
    'pos': 0,
    'isPlaying': false,
    'queuePos': 0,
};

let connectedMain = {};
// TODO: Add backend integration

require( './appleMusicRoutes.js' )( app );

app.get( '/', ( request, response ) => {
    response.sendFile( path.join( __dirname + '/client/showcase.html' ) );
} );

app.get( '/getLocalIP', ( req, res ) => {
    res.send( ip.address() );
} );

app.get( '/useAppleMusic', ( req, res ) => {
    shell.openExternal( 'http://localhost:8081/apple-music' );
    res.send( 'ok' );
} );

app.get( '/openSongs', ( req, res ) => {
    // res.send( '{ "data": [ "/home/janis/Music/KB2022" ] }' );
    // res.send( '{ "data": [ "/mnt/storage/SORTED/Music/audio/KB2022" ] }' );
    res.send( { 'data': dialog.showOpenDialogSync( { properties: [ 'openDirectory' ], title: 'Open music library folder' } ) } );
} );

app.get( '/showcase.js', ( req, res ) => {
    res.sendFile( path.join( __dirname + '/client/showcase.js' ) );
} );

app.get( '/showcase.css', ( req, res ) => {
    res.sendFile( path.join( __dirname + '/client/showcase.css' ) );
} );

app.get( '/backgroundAnim.css', ( req, res ) => {
    res.sendFile( path.join( __dirname + '/client/backgroundAnim.css' ) );
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

app.get( '/mainNotifier', ( req, res ) => {
    const ipRetrieved = req.headers[ 'x-forwarded-for' ];
    const ip = ipRetrieved ? ipRetrieved.split( /, / )[ 0 ] : req.connection.remoteAddress;
    if ( ip === '::ffff:127.0.0.1' ) {
        res.writeHead( 200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        } );
        res.status( 200 );
        res.flushHeaders();
        let det = { 'type': 'basics', 'data': currentDetails };
        res.write( `data: ${ JSON.stringify( det ) }\n\n` );
        connectedMain = res;
    } else {
        res.send( 'wrong' );
    }
} );

const sendUpdate = ( update ) => {
    if ( update === 'pos' ) {
        currentDetails[ 'playingSong' ][ 'startTime' ] = new Date().getTime();
        for ( let client in connectedClients ) {
            connectedClients[ client ].write( 'data: ' + JSON.stringify( { 'type': 'playingSong', 'data': currentDetails[ 'playingSong' ] } ) + '\n\n' );
            connectedClients[ client ].write( 'data: ' + JSON.stringify( { 'type': 'pos', 'data': currentDetails[ 'pos' ] } ) + '\n\n' );
        }
    } else if ( update === 'playingSong' ) {
        if ( !currentDetails[ 'playingSong' ] ) {
            currentDetails[ 'playingSong' ] = {};
        }
        currentDetails[ 'playingSong' ][ 'startTime' ] = new Date().getTime();
        for ( let client in connectedClients ) {
            connectedClients[ client ].write( 'data: ' + JSON.stringify( { 'type': 'pos', 'data': currentDetails[ 'pos' ] } ) + '\n\n' );
        }
    } else if ( update === 'isPlaying' ) {
        currentDetails[ 'playingSong' ][ 'startTime' ] = new Date().getTime();
        for ( let client in connectedClients ) {
            connectedClients[ client ].write( 'data: ' + JSON.stringify( { 'type': 'playingSong', 'data': currentDetails[ 'playingSong' ] } ) + '\n\n' );
            connectedClients[ client ].write( 'data: ' + JSON.stringify( { 'type': 'pos', 'data': currentDetails[ 'pos' ] } ) + '\n\n' );
        }
    }

    for ( let client in connectedClients ) {
        connectedClients[ client ].write( 'data: ' + JSON.stringify( { 'type': update, 'data': currentDetails[ update ] } ) + '\n\n' );
    }
    
    // Check if connected and if not, try to authenticate with data from authKey file

    if ( hasConnected ) {
        if ( update === 'isPlaying' ) {
            axios.post( remoteURL + '/statusUpdate', { 'type': 'playingSong', 'data': currentDetails[ 'playingSong' ], 'authKey': authKey } ).catch( err => {
                console.error( err );
            } );

            axios.post( remoteURL + '/statusUpdate', { 'type': 'pos', 'data': currentDetails[ 'pos' ], 'authKey': authKey } ).catch( err => {
                console.error( err );
            } );
        } else if ( update === 'pos' ) {
            axios.post( remoteURL + '/statusUpdate', { 'type': 'playingSong', 'data': currentDetails[ 'playingSong' ], 'authKey': authKey } ).catch( err => {
                console.error( err );
            } );

            axios.post( remoteURL + '/statusUpdate', { 'type': 'pos', 'data': currentDetails[ 'pos' ], 'authKey': authKey } ).catch( err => {
                console.error( err );
            } );
        }
        axios.post( remoteURL + '/statusUpdate', { 'type': update, 'data': currentDetails[ update ], 'authKey': authKey } ).catch( err => {
            console.error( err );
        } );
    } else {
        connect();
    }
}

const allowedTypes = [ 'playingSong', 'isPlaying', 'songQueue', 'pos', 'queuePos' ];
app.post( '/statusUpdate', ( req, res ) => {
    if ( allowedTypes.includes( req.body.type ) ) {
        currentDetails[ req.body.type ] = req.body.data;
        changedStatus.push( req.body.type );
        sendUpdate( req.body.type );
        res.send( 'ok' );
    } else {
        res.status( 400 ).send( 'ERR_UNKNOWN_TYPE' );
    }
} );


app.get( '/clientStatusUpdate/:status', ( req, res ) => {
    if ( req.params.status === 'disconnect' ) {

    } else if ( req.params.status === 'fullScreenExit' ) {

    } else if ( req.params.status === 'inactive' ) {

    } else if ( req.params.status === 'reactivated' ) {

    }
} );

app.get( '/indexDirs', ( req, res ) => {
    if ( req.query.dir ) {
        indexer.index( req ).then( dirIndex => {
            res.send( dirIndex );
        } ).catch( err => {
            if ( err === 'ERR_DIR_NOT_FOUND' ) {
                res.status( 404 ).send( 'ERR_DIR_NOT_FOUND' );
            } else {
                res.status( 500 ).send( 'unable to process' );
            }
        } );
    } else {
        res.status( 400 ).send( 'ERR_REQ_INCOMPLETE' );
    }
} );

app.get( '/getSongCover', ( req, res ) => {
    if ( req.query.filename ) {
        if ( indexer.getImages( req.query.filename ) ) {
            res.send( indexer.getImages( req.query.filename ) );
        } else {
            res.status( 404 ).send( 'No cover image for this file' );
        }
    } else {
        res.status( 400 ).send( 'ERR_REQ_INCOMPLETE' );
    }
} );

app.get( '/getSongFile', ( req, res ) => {
    if ( req.query.filename ) {
        res.sendFile( req.query.filename );
    } else {
        res.status( 400 ).send( 'ERR_REQ_INCOMPLETE' );
    }
} );


app.get( '/getAppleMusicDevToken', ( req, res ) => {
    // sign dev token
    const privateKey = fs.readFileSync( path.join( __dirname + '/config/apple_private_key.p8' ) ).toString();
    // TODO: Remove secret
    const config = JSON.parse( fs.readFileSync( path.join( __dirname + '/config/apple-music-api.config.secret.json' ) ) );
    const jwtToken = jwt.sign( {}, privateKey, {
        algorithm: "ES256",
        expiresIn: "180d",
        issuer: config.teamID,
        header: {
            alg: "ES256",
            kid: config.keyID
        }
    } );
    res.send( jwtToken );
} );


app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );

app.listen( 8081 );