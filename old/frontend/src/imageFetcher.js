/*
*				MusicPlayerV2 - imageFetcher.js
*
*	Created by Janis Hutz 10/23/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const MusicKit = require( 'node-musickit-api' );
const fs = require( 'fs' );
const path = require( 'path' );

// TODO: deploy non-secret version
const settings = JSON.parse( fs.readFileSync( path.join( __dirname + '/config/apple-music-api.config.secret.json' ) ) );

const music = new MusicKit( {
    key: fs.readFileSync( path.join( __dirname + '/config/apple_private_key.p8' ) ).toString(),
    teamId: settings.teamID,
    keyId: settings.keyID
} );

module.exports.fetch = ( type, searchQuery, callback ) => {
    music.search( settings.storefront, type, searchQuery, ( err, data ) => {
        if ( err ) { 
            callback( err, null ); 
            return; 
        }
        callback( null, data );
    } );
}