/*
*				MusicPlayerV2 - indexer.js
*
*	Created by Janis Hutz 11/05/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const fs = require( 'fs' );
const imageFetcher = require( './imageFetcher.js' );
const musicMetadata = require( 'music-metadata' );
const allowedFileTypes = [ '.mp3', '.wav', '.flac' ];
const csv = require( 'csv-parser' );
const path = require( 'path' );

let coverArtIndex = {};

module.exports.index = ( req ) => {
    return new Promise( ( resolve, reject ) => {
        fs.readdir( req.query.dir, { encoding: 'utf-8' }, ( err, dat ) => {
            if ( err ) { 
                reject( 'ERR_DIR_NOT_FOUND' );
                return;
            };
            ( async() => {
                // Check for songlist.csv or songlist.json file and use the data provided there for each song to override 
                // what was found automatically. If no song title was found in songlist or metadata, use filename
                // additionally check if dir has been indexed (songs.json file)
                if ( dat.includes( 'songs.json' ) ) {
                    parseExistingData( dat, req.query.dir ).then( data => {
                        resolve( data );
                    } ).catch( err => {
                        reject( err );
                    } );
                } else if ( dat.includes( 'songlist.csv' ) || dat.includes( 'songlist.json' ) ) {
                    parseExistingData( dat, req.query.dir ).then( data => {
                        parseDir( dat, req, data ).then( indexedDir => {
                            resolve( indexedDir );
                        } );
                    } );
                } else {
                    resolve( await parseDir( dat, req ) );
                }
            } )();
        } );
    } );
}

module.exports.getImages = ( filename ) => {
    return coverArtIndex[ filename ];
};

const parseExistingData = ( dat, dir ) => {
    return new Promise( ( resolve, reject ) => {
        if ( dat.includes( 'songs.json' ) ) {
            resolve( JSON.parse( fs.readFileSync( path.join( dir + '/songs.json' ) ) ) );
        } else if ( dat.includes( 'songlist.csv' ) ) {
            // This will assume that line #1 will be song #1 in the file list
            // (when sorted by name)
            let results = {};
            let pos = 0;
            fs.createReadStream( path.join( dir + '/songlist.csv' ) )
            .pipe( csv() )
            .on( 'data', ( data ) => {
                results[ dir + '/' + dat[ pos ] ] = data;
                pos += 1;
            } ).on( 'end', () => {
                resolve( results );
            } );
        } else if ( dat.includes( 'songlist.json' ) ) {
            resolve( JSON.parse( fs.readFileSync( path.join( dir + '/songlist.json' ) ) ) );
        }
    } );
}

module.exports.analyzeFile = async ( filepath ) => {
    let metadata = await musicMetadata.parseFile( filepath );
    return {
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
        'filename': filepath,
    }
}

hasCompletedFetching = {};
let files = {};
const parseDir = ( dat, req, existingData ) => {
    return new Promise( ( resolve, reject ) => {
        ( async() => {
            files = {};
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
                            'coverArtOrigin': req.query.coverart ?? 'none',
                        }
                        runReplace( existingData, req.query.dir + '/' + dat[ file ], req.query.doOverride ?? false );
                        if ( req.query.coverart == 'meta' ) {
                            if ( metadata[ 'common' ][ 'picture' ] ) {
                                files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = true;
                                coverArtIndex[ req.query.dir + '/' + dat[ file ] ] = metadata[ 'common' ][ 'picture' ] ? metadata[ 'common' ][ 'picture' ][ 0 ][ 'data' ] : undefined;
                            } else {
                                files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                            }
                            hasCompletedFetching[ req.query.dir + '/' + dat[ file ] ] = true;
                        } else if ( req.query.coverart == 'api' ) {
                            hasCompletedFetching[ req.query.dir + '/' + dat[ file ] ] = false;
                            fetchImages( metadata[ 'common' ][ 'title' ], metadata[ 'common' ][ 'artist' ], metadata[ 'common' ][ 'year' ], req.query.dir, dat[ file ] );
                        } else {
                            files[ req.query.dir + '/' + dat[ file ] ][ 'hasCoverArt' ] = false;
                        }
                    } catch ( err ) {
                        console.error( err );
                        files[ req.query.dir + '/' + dat[ file ] ] = 'ERROR';
                    }
                }
            }
            let ok = false;
            let waiter = setInterval( () => {
                for ( let song in hasCompletedFetching ) {
                    if ( !hasCompletedFetching[ song ] ) {
                        ok = false;
                    }
                }
                if ( ok ) {
                    saveToDisk( req.query.dir );
                    clearInterval( waiter );
                    resolve( files );
                }
                ok = true;
            }, 250 );
        } )();
    } )
};

const runReplace = ( existingData, currentFile, doOverride ) => {
    for ( let param in existingData[ currentFile ] ) {
        if ( !files[ currentFile ][ param ] || doOverride ) {
            files[ currentFile ][ param ] = existingData[ currentFile ][ param ];
        }
    }
};

let imageQueue = [];
let runInterval = null;
const fetchImages = ( title, artist, year, dir, filename ) => {
    imageQueue.push( { 'title': title, 'artist': artist, 'year': year, 'dir': dir, 'filename': filename } );
    if ( runInterval === null ) {
        runInterval = setInterval( () => {
            if ( imageQueue.length > 0 ) {
                const cur = imageQueue.reverse().pop();
                imageQueue.reverse();
                runFetch( cur.title, cur.artist, cur.year, cur.dir, cur.filename );
            } else {
                clearInterval( runInterval );
                runInterval = null;
            }
        }, 100 );
    }
};

const runFetch = ( title, artist, year, dir, filename ) => {
    imageFetcher.fetch( 'songs', ( artist ?? '' ) + ' ' + ( title ?? '' ) + ' ' + ( year ?? '' ), ( err, data ) => {
        if ( err ) {
            files[ dir + '/' + filename ][ 'hasCoverArt' ] = false;
            console.error( dir + '/' + filename );
            console.error( err );
            hasCompletedFetching[ dir + '/' + filename ] = true;
            return;
        }
        if ( data.results.songs ) {
            if ( data.results.songs.data ) {
                let url = data.results.songs.data[ 0 ].attributes.artwork.url;
                url = url.replace( '{w}', data.results.songs.data[ 0 ].attributes.artwork.width );
                url = url.replace( '{h}', data.results.songs.data[ 0 ].attributes.artwork.height );
                files[ dir + '/' + filename ][ 'coverArtURL' ] = url;
                files[ dir + '/' + filename ][ 'hasCoverArt' ] = true;
            } else {
                files[ dir + '/' + filename ][ 'hasCoverArt' ] = false;
            }
        } else {
            files[ dir + '/' + filename ][ 'hasCoverArt' ] = false;
        }
        hasCompletedFetching[ dir + '/' + filename ] = true;
    } );
}


const saveToDisk = ( dir ) => {
    fs.writeFileSync( path.join( dir + '/songs.json' ), JSON.stringify( files ) );
};