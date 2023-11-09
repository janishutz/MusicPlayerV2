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


app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );
app.use( cors() );
app.use( session( {
    secret: 'aeogetwöfaöow0ofö034eö8ptqw39eöavfui786uqew9t0ez9eauigwöfqewoöaiq938w0c8p9awöäf9¨äüöe',
    saveUninitialized: true,
    resave: false,
} ) );


// TODO: Import from config
const remoteURL = 'https://music.janishutz.com';
const hasConnected = false;

const connect = () => {
    if ( authKey !== '' ) {
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

let authKey = '';
try {
    authKey = '' + fs.readFileSync( path.join( __dirname + '/config/authKey.txt' ) );
} catch( err ) {};

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

app.get( '/', ( request, response ) => {
    response.sendFile( path.join( __dirname + '/client/showcase.html' ) );
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
    for ( let client in connectedClients ) {
        connectedClients[ client ].write( 'data: ' + JSON.stringify( { 'type': update, 'data': currentDetails[ update ] } ) + '\n\n' );
    }
    // TODO: Check if connected and if not, try to authenticate with data from authKey file
    // TODO: reduce request count by bundling and sending more in one go to reduce load

    if ( hasConnected ) {
        axios.post( remoteURL + '/statusUpdate', { 'data': 'hello' } ).then( res => {
            console.log( res );
        } ).catch( err => {
            console.error( err );
        } );
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


app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );

app.listen( 8081 );