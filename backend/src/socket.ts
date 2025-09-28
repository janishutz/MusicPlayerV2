import http from 'node:http';
import {
    Server
} from 'socket.io';
import type {
    SocketData,
    Song
} from './definitions';

const useWebSocket = ( httpServer: http.Server, socketData: SocketData ) => {
    // Websocket for events
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
};

export default {
    useWebSocket
};
