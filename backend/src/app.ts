import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import account from './account';
import sdk from 'oauth-janishutz-client-server';

declare let __dirname: string | undefined
if ( typeof( __dirname ) === 'undefined' ) {
    __dirname = path.resolve( path.dirname( '' ) );
}

// TODO: Change config file, as well as in main.ts, index.html, oauth, if deploying there
const sdkConfig = JSON.parse( '' + fs.readFileSync( path.join( __dirname + '/config/sdk.config.testing.json' ) ) );
// const sdkConfig: AuthSDKConfig = JSON.parse( '' + fs.readFileSync( path.join( __dirname + '/config/sdk.config.secret.json' ) ) );

const run = () => {
    let app = express();
    app.use( cors( { 
        credentials: true,
        origin: true 
    } ) );

    // Load id.janishutz.com SDK and allow signing in
    sdk.routes( app, ( uid: string ) => { 
        return new Promise( ( resolve, reject ) => {
            account.checkUser( uid ).then( stat => {
                resolve( stat );
            } ).catch( e => {
                reject( e );
            } );
        } );
    }, 
    ( uid: string, email: string, username: string ) => {
        return new Promise( ( resolve, reject ) => {
            account.createUser( uid, username, email ).then( stat => {
                resolve( stat );
            } ).catch( e => {
                reject( e );
            } );
        } );
    }, sdkConfig );


    app.get( '/', ( request, response ) => {
        response.send( 'Please visit <a href="https://music.janishutz.com">https://music.janishutz.com</a> to use this service' );
    } );


    app.get( '/getAppleMusicDevToken', ( req, res ) => {
        // sign dev token
        const privateKey = fs.readFileSync( path.join( __dirname + '/config/apple_private_key.p8' ) ).toString();
        // TODO: Remove secret
        const config = JSON.parse( '' + fs.readFileSync( path.join( __dirname + '/config/apple-music-api.config.secret.json' ) ) );
        const now = new Date().getTime();
        const tomorrow = now + 24 * 3600 * 1000;
        const jwtToken = jwt.sign( {
            'iss': config.teamID,
            'iat': Math.floor( now / 1000 ),
            'exp': Math.floor( tomorrow / 1000 ),
        }, privateKey, {
            algorithm: "ES256",
            keyid: config.keyID
        } );
        res.send( jwtToken );
    } );

    app.use( ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
        response.status( 404 ).send( 'ERR_NOT_FOUND' );
        // response.sendFile( path.join( __dirname + '' ) ) 
    } );


    const PORT = process.env.PORT || 8081;
    app.listen( PORT );
}

export default {
    run
}