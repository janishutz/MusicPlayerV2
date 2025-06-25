import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import account from './account';
import sdk from 'oauth-janishutz-client-server';
import {
    createServer
} from 'node:http';
import {
    Server
} from 'socket.io';
import crypto from 'node:crypto';
import type {
    Room, Song
} from './definitions';
import storeSDK from 'store.janishutz.com-sdk';
import bodyParser from 'body-parser';

const isFossVersion = true;

declare let __dirname: string | undefined;

if ( typeof __dirname === 'undefined' ) {
    __dirname = path.resolve( path.dirname( '' ) );
}

// TODO: Change config file, as well as in main.ts, index.html, oauth, if deploying there
// const sdkConfig = JSON.parse( fs.readFileSync( path.join(
//     __dirname,
//     '/config/sdk.config.testing.json'
// ) ).toString() );
const sdkConfig = JSON.parse( fs.readFileSync( path.join(
    __dirname,
    '/config/sdk.config.secret.json'
) ).toString() );

const run = () => {
    const app = express();

    app.use( cors( {
        'credentials': true,
        'origin': true
    } ) );

    if ( !isFossVersion ) {
        // storeSDK.configure( JSON.parse( fs.readFileSync( path.join(
        //     __dirname,
        //     '/config/store-sdk.config.testing.json'
        // ) ).toString() ) );
        storeSDK.configure( JSON.parse( fs.readFileSync( path.join(
            __dirname,
            '/config/store-sdk.config.secret.json'
        ) ).toString() ) );
    }

    const httpServer = createServer( app );

    if ( !isFossVersion ) {
        // Load id.janishutz.com SDK and allow signing in
        sdk.routes( app, ( uid: string ) => {
            return new Promise( ( resolve, reject ) => {
                account.checkUser( uid ).then( stat => {
                    resolve( stat );
                } )
                    .catch( e => {
                        reject( e );
                    } );
            } );
        }, ( uid: string, email: string, username: string ) => {
            return new Promise( ( resolve, reject ) => {
                account.createUser( uid, username, email ).then( stat => {
                    resolve( stat );
                } )
                    .catch( e => {
                        reject( e );
                    } );
            } );
        }, sdkConfig );
    }

    // Websocket for events
    interface SocketData {
        [key: string]: Room;
    }
    const socketData: SocketData = {};
    const io = new Server( httpServer, {
        'cors': {
            'origin': true,
            'credentials': true,
        }
    } );

    io.on( 'connection', socket => {
        socket.on( 'create-room', ( room: {
            'name': string,
            'token': string
        }, cb: ( res: {
            'status': boolean,
            'msg': string
        } ) => void ) => {
            if ( socketData[ room.name ] ) {
                if ( room.token === socketData[ room.name ].roomToken ) {
                    socket.join( room.name );
                    cb( {
                        'status': true,
                        'msg': 'ADDED_TO_ROOM'
                    } );
                } else {
                    cb( {
                        'status': false,
                        'msg': 'ERR_TOKEN_INVALID'
                    } );
                }
            } else {
                cb( {
                    'status': false,
                    'msg': 'ERR_NAME_INVALID'
                } );
            }
        } );

        socket.on( 'delete-room', ( room: {
            'name': string,
            'token': string
        }, cb: ( res: {
            'status': boolean,
            'msg': string
        } ) => void ) => {
            if ( socketData[ room.name ] ) {
                if ( room.token === socketData[ room.name ].roomToken ) {
                    socket.leave( room.name );
                    socket.to( room.name ).emit( 'delete-share', room.name );
                    socketData[ room.name ] = undefined;
                    cb( {
                        'status': true,
                        'msg': 'ROOM_DELETED'
                    } );
                } else {
                    cb( {
                        'status': false,
                        'msg': 'ERR_TOKEN_INVALID'
                    } );
                }
            } else {
                cb( {
                    'status': false,
                    'msg': 'ERR_NAME_INVALID'
                } );
            }
        } );

        socket.on( 'join-room', ( room: string, cb: ( res: {
            'status': boolean,
            'msg': string,
            'data'?: {
                'playbackStatus': boolean,
                'playbackStart': number,
                'playlist': Song[],
                'playlistIndex': number,
                'useAntiTamper': boolean
            }
        } ) => void ) => {
            if ( socketData[ room ] ) {
                socket.join( room );
                cb( {
                    'data': {
                        'playbackStart': socketData[ room ].playbackStart,
                        'playbackStatus': socketData[ room ].playbackStatus,
                        'playlist': socketData[ room ].playlist,
                        'playlistIndex': socketData[ room ].playlistIndex,
                        'useAntiTamper': socketData[ room ].useAntiTamper,
                    },
                    'msg': 'STATUS_OK',
                    'status': true,
                } );
            } else {
                cb( {
                    'msg': 'ERR_NO_ROOM_WITH_THIS_ID',
                    'status': false,
                } );
                socket.disconnect();
            }
        } );

        socket.on( 'tampering', ( data: {
            'msg': string,
            'roomName': string
        } ) => {
            if ( data.roomName ) {
                socket.to( data.roomName ).emit( 'tampering-msg', data.msg );
            }
        } );

        socket.on( 'playlist-update', ( data: {
            'roomName': string,
            'roomToken': string,
            'data': Song[]
        } ) => {
            if ( socketData[ data.roomName ] ) {
                if ( socketData[ data.roomName ].roomToken === data.roomToken ) {
                    if ( socketData[ data.roomName ].playlist !== data.data ) {
                        socketData[ data.roomName ].playlist = data.data;
                        io.to( data.roomName ).emit( 'playlist', data.data );
                    }
                }
            }
        } );

        socket.on( 'playback-update', ( data: {
            'roomName': string,
            'roomToken': string,
            'data': boolean
        } ) => {
            if ( socketData[ data.roomName ] ) {
                if ( socketData[ data.roomName ].roomToken === data.roomToken ) {
                    socketData[ data.roomName ].playbackStatus = data.data;
                    io.to( data.roomName ).emit( 'playback', data.data );
                }
            }
        } );

        socket.on( 'playlist-index-update', ( data: {
            'roomName': string,
            'roomToken': string,
            'data': number
        } ) => {
            if ( socketData[ data.roomName ] ) {
                if ( socketData[ data.roomName ].roomToken === data.roomToken ) {
                    socketData[ data.roomName ].playlistIndex = data.data;
                    io.to( data.roomName ).emit( 'playlist-index', data.data );
                }
            }
        } );

        socket.on( 'playback-start-update', ( data: {
            'roomName': string,
            'roomToken': string,
            'data': number
        } ) => {
            if ( socketData[ data.roomName ] ) {
                if ( socketData[ data.roomName ].roomToken === data.roomToken ) {
                    socketData[ data.roomName ].playbackStart = data.data;
                    io.to( data.roomName ).emit( 'playback-start', data.data );
                }
            }
        } );
    } );


    /*
        ROUTES FOR SERVER SENT EVENTS VERSION
    */
    // Connected clients have their session ID as key
    interface SocketClientList {
        [key: string]: SocketClient;
    }

    interface SocketClient {
        'response': express.Response;
        'room': string;
    }

    interface ClientReferenceList {
        /**
         * Find all clients connected to one room
         */
        [key: string]: string[];
    }

    const importantClients: SocketClientList = {};
    const connectedClients: SocketClientList = {};
    const clientReference: ClientReferenceList = {};

    app.get(
        '/socket/connection',
        ( request: express.Request, response: express.Response ) => {
            if ( request.query.room ) {
                if ( socketData[ String( request.query.room ) ] ) {
                    response.writeHead( 200, {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    } );
                    response.status( 200 );
                    response.flushHeaders();
                    response.write( `data: ${ JSON.stringify( {
                        'type': 'basics',
                        'data': socketData[ String( request.query.room ) ]
                    } ) }\n\n` );
                    const sid = sdk.getSessionID( request );

                    if ( sdk.checkAuth( request ) ) {
                        importantClients[ sid ] = {
                            'response': response,
                            'room': String( request.query.room )
                        };
                    }

                    connectedClients[ sid ] = {
                        'response': response,
                        'room': String( request.query.room )
                    };

                    if ( !clientReference[ String( request.query.room ) ] ) {
                        clientReference[ String( request.query.room ) ] = [];
                    }

                    if ( !clientReference[ String( request.query.room ) ]
                        .includes( sid ) ) {
                        clientReference[ String( request.query.room ) ].push( sid );
                    }

                    request.on( 'close', () => {
                        try {
                            importantClients[ sid ] = undefined;
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch ( e ) { /* empty */ }

                        const cl = clientReference[ String( request.query.room ) ];

                        for ( const c in cl ) {
                            if ( cl[ c ] === sid ) {
                                cl.splice( parseInt( c ), 1 );
                                break;
                            }
                        }

                        connectedClients[ sid ] = undefined;
                    } );
                } else {
                    response.status( 404 ).send( 'ERR_ROOM_NOT_FOUND' );
                }
            } else {
                response.status( 404 ).send( 'ERR_NO_ROOM_SPECIFIED' );
            }
        }
    );

    app.get(
        '/socket/getData',
        ( request: express.Request, response: express.Response ) => {
            if ( request.query.room ) {
                response.send( socketData[ String( request.query.room ) ] );
            } else {
                response.status( 400 ).send( 'ERR_NO_ROOM_SPECIFIED' );
            }
        }
    );

    app.get(
        '/socket/joinRoom',
        ( request: express.Request, response: express.Response ) => {
            if ( request.query.room ) {
                if ( socketData[ String( request.query.room ) ] ) {
                    response.send( 'ok' );
                } else {
                    response.status( 404 ).send( 'ERR_ROOM_NOT_FOUND' );
                }
            } else {
                response.status( 404 ).send( 'ERR_NO_ROOM_SPECIFIED' );
            }
        }
    );

    app.post(
        '/socket/update',
        bodyParser.json(),
        ( request: express.Request, response: express.Response ) => {
            if ( socketData[ request.body.roomName ] ) {
                if ( request.body.event === 'tampering' ) {
                    const clients = clientReference[ request.body.roomName ];

                    for ( const client in clients ) {
                        if ( importantClients[ clients[ client ] ] ) {
                            importantClients[ clients[ client ] ]
                                .response.write( 'data: ' + JSON.stringify( {
                                    'type': 'tampering-msg',
                                    'data': true
                                } ) + '\n\n' );
                        }
                    }

                    response.send( 'ok' );
                } else {
                    if (
                        socketData[ request.body.roomName ].roomToken
                    === request.body.roomToken
                    ) {
                        let send = false;
                        let update = '';

                        if ( request.body.event === 'playback-start-update' ) {
                            send = true;
                            update = 'playback-start';
                            socketData[ request.body.roomName ]
                                .playbackStart = request.body.data;
                        } else if ( request.body.event === 'playback-update' ) {
                            send = true;
                            update = 'playback';
                            socketData[ request.body.roomName ]
                                .playbackStatus = request.body.data;
                        } else if ( request.body.event === 'playlist-update' ) {
                            send = true;
                            update = 'playlist';
                            socketData[ request.body.roomName ]
                                .playlist = request.body.data;
                        } else if ( request.body.event === 'playlist-index-update' ) {
                            send = true;
                            update = 'playlist-index';
                            socketData[ request.body.roomName ]
                                .playlistIndex = request.body.data;
                        }

                        if ( send ) {
                            const clients = clientReference[ request.body.roomName ];

                            for ( const client in clients ) {
                                if ( connectedClients[ clients[ client ] ] ) {
                                    connectedClients[ clients[ client ] ]
                                        .response.write( 'data: ' + JSON.stringify( {
                                            'type': update,
                                            'data': request.body.data
                                        } ) + '\n\n' );
                                }
                            }

                            response.send( 'ok' );
                        } else {
                            response.status( 404 ).send( 'ERR_CANNOT_SEND' );
                        }
                    } else {
                        response.status( 403 ).send( 'ERR_UNAUTHORIZED' );
                    }
                }
            } else {
                response.status( 400 ).send( 'ERR_WRONG_REQUEST' );
            }
        }
    );



    app.post(
        '/socket/deleteRoom',
        bodyParser.json(),
        ( request: express.Request, response: express.Response ) => {
            if ( request.body.roomName ) {
                if ( socketData[ request.body.roomName ] ) {
                    if (
                        socketData[ request.body.roomName ].roomToken
                        === request.body.roomToken
                    ) {
                        socketData[ request.body.roomName ] = undefined;
                        const clients = clientReference[ request.body.roomName ];

                        for ( const client in clients ) {
                            if ( connectedClients[ clients[ client ] ] ) {
                                connectedClients[ clients[ client ] ]
                                    .response.write( 'data: ' + JSON.stringify( {
                                        'type': 'delete-share',
                                        'data': true
                                    } ) + '\n\n' );
                            }
                        }
                    } else {
                        response.send( 403 ).send( 'ERR_UNAUTHORIZED' );
                    }
                } else {
                    response.status( 404 ).send( 'ERR_ROOM_NOT_FOUND' );
                }
            } else {
                response.status( 400 ).send( 'ERR_NO_ROOM_NAME' );
            }
        }
    );



    /*
        GENERAL ROUTES
    */
    app.get( '/', ( _request: express.Request, response: express.Response ) => {
        response.send( 'Please visit <a href="https://music.janishutz.com">https://music.janishutz.com</a> to use this service' );
    } );


    app.get(
        '/createRoomToken',
        ( request: express.Request, response: express.Response ) => {
            if ( sdk.checkAuth( request ) ) {
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
                        'ownerUID': sdk.getUserData( request ).uid,
                        'useAntiTamper': request.query.useAntiTamper === 'true'
                            ? true : false,
                    };
                    response.send( roomToken );
                } else {
                    if (
                        socketData[ roomName ].ownerUID
                        === sdk.getUserData( request ).uid
                    ) {
                        response.send( socketData[ roomName ].roomToken );
                    } else {
                        response.status( 409 ).send( 'ERR_CONFLICT' );
                    }
                }
            } else {
                response.status( 403 ).send( 'ERR_FORBIDDEN' );
            }
        }
    );


    app.get( '/getAppleMusicDevToken', ( req, res ) => {
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
    } );


    const ownedCache = {};

    const checkIfOwned = ( request: express.Request ): Promise<boolean> => {
        return new Promise( ( resolve, reject ) => {
            if ( sdk.checkAuth( request ) ) {
                const userData = sdk.getUserData( request );

                if ( ownedCache[ userData.uid ] ) {
                    resolve( ownedCache[ userData.uid ] );
                } else {
                    storeSDK.getSubscriptions( userData.uid )
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
                                    ownedCache[ userData.uid ] = true;
                                    resolve( true );
                                }
                            }

                            ownedCache[ userData.uid ] = false;
                            resolve( false );
                        } )
                        .catch( e => {
                            console.error( e );
                            reject( 'ERR_NOT_OWNED' );
                        } );
                }
            } else {
                reject( 'ERR_AUTH_REQUIRED' );
            }
        } );
    };

    app.get(
        '/checkUserStatus',
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
