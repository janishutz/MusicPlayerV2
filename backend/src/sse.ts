import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import {
    SocketData
} from './definitions';

const useSSE = (
    app: express.Application,
    socketData: SocketData,
    corsOpts: cors.CorsOptions,
    getSessionID: ( request: express.Request ) => string,
    getSignedIn: ( request: express.Request ) => boolean
) => {
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
        cors( corsOpts ),
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
                    const sid = getSessionID( request );

                    if ( getSignedIn( request ) ) {
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
        cors( corsOpts ),
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
        cors( corsOpts ),
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
        cors( corsOpts ),
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
        cors( corsOpts ),
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
};

export default {
    useSSE
};
