const express = require( 'express' );
let app = express();
const path = require( 'path' );
const cors = require( 'cors' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );
const musicMetadata = require( 'music-metadata' );
const dialog = require( 'electron' ).dialog;

app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );
app.use( cors() );

let indexedData = {};
let coverArtIndex = {};
const allowedFileTypes = [ '.mp3', '.wav', '.flac' ];

let connectedClients = [];
let changedStatus = [];

let currentDetails = {
    'songQueue': [],
    'currentlyPlaying': '',
    'pos': 0,
    'isPlaying': false
};

let connectedMain = {};


app.get( '/', ( request, response ) => {
    response.sendFile( path.join( __dirname + '/client/showcase.html' ) );
} );

app.get( '/showcase.js', ( req, res ) => {
    res.sendFile( path.join( __dirname + '/client/showcase.js' ) );
} );

app.get( '/showcase.css', ( req, res ) => {
    res.sendFile( path.join( __dirname + '/client/showcase.css' ) );
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
    connectedClients.push( res );
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

const sendUpdate = () => {
    console.log( currentDetails );
}

const allowedTypes = [ 'playingSong', 'isPlaying', 'songQueue', 'pos' ];
app.post( '/statusUpdate', ( req, res ) => {
    if ( allowedTypes.includes( req.body.type ) ) {
        currentDetails[ req.body.type ] = req.body.data;
        changedStatus.push( req.body.type );
        sendUpdate();
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

app.get( '/openSongs', ( req, res ) => {
    // res.send( '{ "data": [ "/home/janis/Music/KB2022" ] }' );
    res.send( '{ "data": [ "/mnt/storage/SORTED/Music/audio/KB2022" ] }' );
    // res.send( { 'data': dialog.showOpenDialogSync( { properties: [ 'openDirectory' ], title: 'Open music library folder' } ) } );
} );

app.get( '/indexDirs', ( req, res ) => {
    if ( req.query.dir ) {
        if ( indexedData[ req.query.dir ] ) {
            res.send( indexedData[ req.query.dir ] );
        } else {
            fs.readdir( req.query.dir, { encoding: 'utf-8' }, ( err, dat ) => {
                if ( err ) { 
                    res.status( 404 ).send( 'ERR_DIR_NOT_FOUND' );
                    return;
                };
                ( async() => {
                    // TODO: Check for songlist.csv or songlist.json file and use the data provided there for each song to override 
                    // what was found automatically. If no song title was found in songlist or metadata, use filename
                    let files = {};
                    for ( let file in dat ) {
                        if ( allowedFileTypes.includes( dat[ file ].slice( dat[ file ].indexOf( '.' ), dat[ file ].length ) ) ) {
                            try {
                                let metadata = await musicMetadata.parseFile( req.query.dir + '/' + dat[ file ] );
                                files[ req.query.dir + '/' + dat[ file ] ] = {
                                    'artist': metadata[ 'common' ][ 'artist' ],
                                    'title': metadata[ 'common' ][ 'title' ],
                                    'year': metadata[ 'common' ][ 'year' ],
                                    'bpm': metadata[ 'common' ][ 'bpm' ],
                                    'genre': metadata[ 'common' ][ 'genre' ],
                                    'duration': Math.round( metadata[ 'format' ][ 'duration' ] ),
                                    'isLossless': metadata[ 'format' ][ 'lossless' ],
                                    'sampleRate': metadata[ 'format' ][ 'sampleRate' ],
                                    'bitrate': metadata[ 'format' ][ 'bitrate' ],
                                    'numberOfChannels': metadata[ 'format' ][ 'numberOfChannels' ],
                                    'container': metadata[ 'format' ][ 'container' ],
                                    'filename': req.query.dir + '/' + dat[ file ],
                                }
                                if ( metadata[ 'common' ][ 'picture' ] ) {
                                    files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = true;
                                    if ( req.query.coverart == 'true' ) {
                                        coverArtIndex[ req.query.dir + '/' + dat[ file ] ] = metadata[ 'common' ][ 'picture' ] ? metadata[ 'common' ][ 'picture' ][ 0 ][ 'data' ] : undefined;
                                    }
                                } else {
                                    files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                                }
                            } catch ( err ) {
                                files[ req.query.dir + '/' + dat[ file ] ] = 'ERROR';
                            }
                        } else if ( dat[ file ].slice( dat[ file ].indexOf( '.' ), dat[ file ].length ) === '.csv' ) {

                        } else if ( dat[ file ].slice( dat[ file ].indexOf( '.' ), dat[ file ].length ) === '.json' ) {
                            
                        }
                    }
                    indexedData[ req.query.dir ] = files;
                    res.send( files );
                } )();
            } );
        }
    } else {
        res.status( 400 ).send( 'ERR_REQ_INCOMPLETE' );
    }
} );

app.get( '/getSongCover', ( req, res ) => {
    if ( req.query.filename ) {
        if ( coverArtIndex[ req.query.filename ] ) {
            res.send( coverArtIndex[ req.query.filename ] );
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

// TODO: Add get lyrics route later
// 'lyrics': metadata[ 'common' ][ 'lyrics' ],


app.use( ( request, response, next ) => {
    response.sendFile( path.join( __dirname + '' ) ) 
} );

app.listen( 8081 );