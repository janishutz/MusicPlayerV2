/*
*				MusicPlayerV2 - appleMusicRoutes.js
*
*	Created by Janis Hutz 11/14/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const path = require( 'path' );

module.exports = ( app ) => {
    app.get( '/apple-music', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/appleMusic/index.html' ) );
    } );

    app.get( '/apple-music/helpers/:file', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/appleMusic/' + req.params.file ) );
    } );

    app.get( '/icon-font.css', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/icon-font.css' ) );
    } );

    app.get( '/iconFont.woff2', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/iconFont.woff2' ) );
    } );

    app.get( '/logo.png', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/client/logo.png' ) );
    } );
}