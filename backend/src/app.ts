import express from 'express';
import path from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import cors from 'cors';

declare let __dirname: string | undefined
if ( typeof( __dirname ) === 'undefined' ) {
    __dirname = path.resolve( path.dirname( '' ) );
}

const run = () => {
    let app = express();
    app.use( cors( { 
        credentials: true,
        origin: true 
    } ) );

    app.get( '/', ( request, response ) => {
        response.send( 'HELLO WORLD' );
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