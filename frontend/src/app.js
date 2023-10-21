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
const allowedFileTypes = [ '.mp3', '.wav', '.flac' ]

app.get( '/', ( request, response ) => {
    response.send( 'Hello world' );
} );


app.get( '/openSongs', ( req, res ) => {
    // res.send( '{ "data": [ "/home/janis/Music/KB2022" ] }' );
    res.send( '{ "data": [ "/mnt/storage/SORTED/Music/audio/KB2022" ] }' );
    // res.send( { 'data': dialog.showOpenDialogSync( { properties: [ 'openDirectory' ], title: 'Open music library folder' } ) } );
} );

app.get( '/indexDirs', ( req, res ) => {
    if ( req.query.dir ) {
        if ( indexedData[ req.query.dir ] ) {
            console.log( 'using cache' );
            res.send( indexedData[ req.query.dir ] );
        } else {
            fs.readdir( req.query.dir, { encoding: 'utf-8' }, ( err, dat ) => {
                if ( err ) res.status( 500 ).send( err );
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
                                    'duration': metadata[ 'format' ][ 'duration' ],
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