const fs = require( 'fs' );
const imageFetcher = require( './imageFetcher.js' );
const musicMetadata = require( 'music-metadata' );
const allowedFileTypes = [ '.mp3', '.wav', '.flac' ];

let indexedData = {};
let coverArtIndex = {};

module.exports.index = ( req ) => {
    return new Promise( ( reject, resolve ) => {
        fs.readdir( req.query.dir, { encoding: 'utf-8' }, ( err, dat ) => {
            if ( err ) { 
                res.status( 404 ).send( 'ERR_DIR_NOT_FOUND' );
                return;
            };
            ( async() => {
                // TODO: Check for songlist.csv or songlist.json file and use the data provided there for each song to override 
                // what was found automatically. If no song title was found in songlist or metadata, use filename
                // TODO: Also save found information to those files and don't rerun checks if data is present
                if ( dat.includes( 'songlist.csv' ) || dat.includes( 'songlist.json' ) ) {

                } else {
                    
                }
            } )();
        } );
    } );
}

const parseExistingData = () => {
    
}

const parseDir = async ( dat, req ) => {
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
                    if ( req.query.coverart == 'true' ) {
                        imageFetcher.fetch( 'songs', metadata[ 'common' ][ 'artist' ] + ' ' + metadata[ 'common' ][ 'title' ], ( err, data ) => {
                            if ( err ) {
                                indexedData[ req.query.dir ][ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                                files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                                return;
                            }
                            if ( data.results.songs ) {
                                if ( data.results.songs.data ) {
                                    let url = data.results.songs.data[ 0 ].attributes.artwork.url;
                                    url = url.replace( '{w}', data.results.songs.data[ 0 ].attributes.artwork.width );
                                    url = url.replace( '{h}', data.results.songs.data[ 0 ].attributes.artwork.height );
                                    console.log( url );
                                } else {
                                    indexedData[ req.query.dir ][ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                                    files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                                }
                            } else {
                                indexedData[ req.query.dir ][ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                                files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                            }
                        } );
                        files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = true;
                    } else {
                        files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                    }
                }
            } catch ( err ) {
                console.error( err );
                files[ req.query.dir + '/' + dat[ file ] ] = 'ERROR';
            }
        } else if ( dat[ file ].slice( dat[ file ].indexOf( '.' ), dat[ file ].length ) === '.csv' ) {

        } else if ( dat[ file ].slice( dat[ file ].indexOf( '.' ), dat[ file ].length ) === '.json' ) {
            
        }
    }
    indexedData[ req.query.dir ] = files;
    return files;
}