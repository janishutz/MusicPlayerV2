import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import {
    createServer
} from 'node:http';
import crypto from 'node:crypto';
import {
    SocketData
} from './definitions';


// ┌                                               ┐
// │          Handle FOSS vs paid version          │
// └                                               ┘
const isFossVersion = false;

import storeSDK from '@janishutz/store-sdk';
import sdk from '@janishutz/login-sdk-server';

// const isFossVersion = true;
//
// import storeSDK from './sdk/store-sdk-stub';
// import sdk from '@janishutz/login-sdk-server-stubs';


const corsOpts: cors.CorsOptions = {
    'credentials': true,
    'origin': ( origin, cb ) => {
        if ( isFossVersion ) cb( null, true );
        else cb( null, origin === 'https://music.janishutz.com' );
    }
};


const run = () => {
    const app = express();
    const httpServer = createServer( app );

    if ( !isFossVersion ) {
        console.error( '[ APP ] Starting in non-FOSS version' );

        storeSDK.configure( JSON.parse( fs.readFileSync( path.join(
            __dirname,
            '/config/store-sdk.config.secret.json'
        ) ).toString() ) );

        // ───────────────────────────────────────────────────────────────────
        const sdkConfig = JSON.parse( fs.readFileSync( path.join(
            __dirname,
            '/config/sdk.config.secret.json'
        ) ).toString() );

        // Load id.janishutz.com SDK and allow signing in
        sdk.setUp(
            {
                'prod': false,
                'service': {
                    'serviceID': 'jh-music',
                    'serviceToken': sdkConfig[ 'token' ]
                },
                'user-agent': sdkConfig[ 'ua' ],
                'sessionType': 'memory',
                'frontendURL': 'https://music.janishutz.com',
                'corsWhitelist': [ 'https://music.janishutz.com' ],
                'recheckTimeout': 300 * 1000,
                'advancedVerification': 'sdk',
            },
            app,
            () => {
                return new Promise( resolve => {
                    resolve( true );
                } );
            },
            () => {
                return new Promise( resolve => {
                    resolve( true );
                } );
            },
            () => {
                return new Promise( resolve => {
                    resolve( true );
                } );
            },
            () => {
                return new Promise( resolve => {
                    resolve( true );
                } );
            },
        );
    }


    /*
        Configuration of SSE or WebSocket
    */
    const socketData: SocketData = {};


    /*
        GENERAL ROUTES
    */
    app.get( '/', ( _request: express.Request, response: express.Response ) => {
        response.send( 'Please visit <a href="https://music.janishutz.com">https://music.janishutz.com</a> to use this service' );
    } );



    app.get(
        '/createRoomToken',
        cors( corsOpts ),
        sdk.loginCheck(),
        ( request: express.Request, response: express.Response ) => {
            // eslint-disable-next-line no-constant-binary-expression
            const roomName = String( request.query.roomName ) ?? '';

            if ( !socketData[ roomName ] ) {
                const roomToken = crypto.randomUUID();

                socketData[ roomName ] = {
                    'playbackStart': 0,
                    'playbackStatus': false,
                    'playlist': [],
                    'playlistIndex': 0,
                    'roomName': roomName,
                    'roomToken': roomToken,
                    'ownerUID': sdk.getUID( request ),
                    'useAntiTamper': request.query.useAntiTamper === 'true'
                        ? true : false,
                };
                response.send( roomToken );
            } else {
                if (
                    socketData[ roomName ].ownerUID
                        === sdk.getUID( request )
                ) {
                    response.send( socketData[ roomName ].roomToken );
                } else {
                    response.status( 409 ).send( 'ERR_CONFLICT' );
                }
            }
        }
    );


    app.get(
        '/getAppleMusicDevToken',
        cors( corsOpts ),
        sdk.loginCheck(),
        ( req, res ) => {
            checkIfOwned( req ).then( owned => {
                if ( owned ) {
                // sign dev token
                    const privateKey = fs.readFileSync( path.join(
                        __dirname,
                        '/config/apple_private_key.p8'
                    ) ).toString();
                    const config = JSON.parse( fs.readFileSync( path.join(
                        __dirname,
                        '/config/apple-music-api.config.secret.json'
                    ) ).toString() );
                    const now = new Date().getTime();
                    const tomorrow = now + ( 24 * 3600 * 1000 );
                    const jwtToken = jwt.sign( {
                        'iss': config.teamID,
                        'iat': Math.floor( now / 1000 ),
                        'exp': Math.floor( tomorrow / 1000 ),
                    }, privateKey, {
                        'algorithm': 'ES256',
                        'keyid': config.keyID
                    } );

                    res.send( jwtToken );
                } else {
                    res.status( 402 ).send( 'ERR_NOT_OWNED' );
                }
            } )
                .catch( e => {
                    if ( e === 'ERR_NOT_OWNED' ) {
                        res.status( 402 ).send( e );
                    } else if ( e === 'ERR_AUTH_REQUIRED' ) {
                        res.status( 401 ).send( e );
                    } else {
                        res.send( 500 ).send( e );
                    }
                } );
        }
    );


    const ownedCache = {};

    const checkIfOwned = ( request: express.Request ): Promise<boolean> => {
        return new Promise( ( resolve, reject ) => {
            const uid = sdk.getUID( request );

            if ( ownedCache[ uid ] ) {
                resolve( ownedCache[ uid ] );
            } else {
                storeSDK.getSubscriptions( uid )
                    .then( stat => {
                        const now = new Date().getTime();

                        for ( const sub in stat ) {
                            if ( stat[ sub ].expires - now > 0
                                    && (
                                        stat[ sub ].id
                                        === 'com.janishutz.MusicPlayer.subscription'
                                    || stat[ sub ].id
                                        === 'com.janishutz.MusicPlayer.subscription-month'
                                    )
                            ) {
                                ownedCache[ uid ] = true;
                                resolve( true );
                            }
                        }

                        ownedCache[ uid ] = false;
                        resolve( false );
                    } )
                    .catch( e => {
                        console.error( e );
                        reject( 'ERR_NOT_OWNED' );
                    } );
            }
        } );
    };

    app.get(
        '/checkUserStatus',
        cors( corsOpts ),
        sdk.loginCheck(),
        ( request: express.Request, response: express.Response ) => {
            checkIfOwned( request )
                .then( owned => {
                    if ( owned ) {
                        response.send( 'ok' );
                    } else {
                        response.status( 402 ).send( 'ERR_NOT_OWNED' );
                    }
                } )
                .catch( e => {
                    if ( e === 'ERR_NOT_OWNED' ) {
                        response.status( 402 ).send( e );
                    } else if ( e === 'ERR_AUTH_REQUIRED' ) {
                        response.status( 401 ).send( e );
                    } else {
                        response.send( 500 ).send( e );
                    }
                } );
        }
    );

    app.use( ( request: express.Request, response: express.Response ) => {
        response.status( 404 ).send( 'ERR_NOT_FOUND: ' + request.path );
    } );


    const PORT = process.env.PORT || 8082;

    httpServer.listen( PORT );
};

export default {
    run
};
