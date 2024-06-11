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
        const config = JSON.parse( '' + fs.readFileSync( path.join( __dirname + '/config/apple-music-api.config.json' ) ) );
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