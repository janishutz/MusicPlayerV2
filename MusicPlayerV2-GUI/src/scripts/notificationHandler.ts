// These functions handle connections to the backend with socket.io

import {
    io, type Socket
} from 'socket.io-client';
import type {
    SSEMap
} from './song';

class NotificationHandler {

    socket: Socket;

    roomName: string;

    roomToken: string;

    isConnected: boolean;

    useSocket: boolean;

    eventSource?: EventSource;

    toBeListenedForItems: SSEMap;

    reconnectRetryCount: number;

    lastEmitTimestamp: number;

    openConnectionsCount: number;

    pendingRequestCount: number;

    connectionWasSuccessful: boolean;

    constructor () {
        this.socket = io( localStorage.getItem( 'url' ) ?? '', {
            'autoConnect': false,
        } );
        this.roomName = '';
        this.roomToken = '';
        this.isConnected = false;
        this.useSocket = localStorage.getItem( 'music-player-config' ) === 'ws';
        this.toBeListenedForItems = {};
        this.reconnectRetryCount = 0;
        this.lastEmitTimestamp = 0;
        this.pendingRequestCount = 0;
        this.openConnectionsCount = 0;
        this.connectionWasSuccessful = false;
    }

    /**
     * Create a room token and connect to
     * @param {string} roomName
     * @param {boolean} useAntiTamper
     * @returns {Promise<string>}
     */
    connect ( roomName: string, useAntiTamper: boolean ): Promise<void> {
        return new Promise( ( resolve, reject ) => {
            fetch( localStorage.getItem( 'url' ) + '/createRoomToken?roomName=' + roomName + '&useAntiTamper=' + useAntiTamper, {
                'credentials': 'include'
            } ).then( res => {
                if ( res.status === 200 ) {
                    res.text().then( text => {
                        this.roomToken = text;
                        this.roomName = roomName;

                        if ( this.useSocket ) {
                            this.socket.connect();
                            this.socket.emit(
                                'create-room', {
                                    'name': this.roomName,
                                    'token': this.roomToken
                                }, ( res: {
                                    'status': boolean,
                                    'msg': string
                                } ) => {
                                    if ( res.status === true ) {
                                        this.isConnected = true;
                                        resolve();
                                    } else {
                                        reject( 'ERR_ROOM_CONNECTING' );
                                    }
                                }
                            );
                        } else {
                            this.sseConnect().then( () => {
                                resolve();
                            } )
                                .catch( );
                        }
                    } );
                } else if ( res.status === 409 ) {
                    reject( 'ERR_CONFLICT' );
                } else if ( res.status === 403 || res.status === 401 ) {
                    reject( 'ERR_UNAUTHORIZED' );
                } else {
                    reject( 'ERR_ROOM_CREATING' );
                }
            } );
        } );
    }

    sseConnect (): Promise<void> {
        return new Promise( ( resolve, reject ) => {
            if ( this.reconnectRetryCount < 5 ) {
                if ( this.openConnectionsCount < 1 && !this.isConnected ) {
                    this.openConnectionsCount += 1;
                    fetch( localStorage.getItem( 'url' ) + '/socket/joinRoom?room=' + this.roomName, {
                        'credentials': 'include'
                    } ).then( res => {
                        if ( res.status === 200 ) {
                            this.eventSource = new EventSource( localStorage.getItem( 'url' ) + '/socket/connection?room=' + this.roomName, {
                                'withCredentials': true
                            } );

                            this.eventSource.onopen = () => {
                                this.isConnected = true;
                                this.connectionWasSuccessful = true;
                                this.reconnectRetryCount = 0;
                                console.log( '[ SSE Connection ] - ' + new Date().toISOString() + ': Connection successfully established!' );
                                resolve();
                            };

                            this.eventSource.onmessage = e => {
                                const d = JSON.parse( e.data );

                                if ( this.toBeListenedForItems[ d.type ] ) {
                                    this.toBeListenedForItems[ d.type ]( d.data );
                                }
                            };

                            this.eventSource.onerror = e => {
                                if ( this.isConnected ) {
                                    this.isConnected = false;
                                    this.eventSource?.close();
                                    this.openConnectionsCount -= 1;
                                    console.debug( e );
                                    console.log( '[ SSE Connection ] - ' + new Date().toISOString() + ': Reconnecting due to connection error!' );

                                    this.eventSource = undefined;

                                    this.reconnectRetryCount += 1;
                                    setTimeout( () => {
                                        this.sseConnect();
                                    }, 1000 * this.reconnectRetryCount );
                                }
                            };
                        } else if ( res.status === 403 || res.status === 401 || res.status === 404 || res.status === 402 ) {
                            document.dispatchEvent( new Event( 'musicplayer:autherror' ) );
                            reject( 'ERR_UNAUTHORIZED' );
                        } else {
                            reject( 'ERR_ROOM_CONNECTING_STATUS_CODE' );
                        }
                    } )
                        .catch( () => {
                            if ( !this.connectionWasSuccessful ) {
                                reject( 'ERR_ROOM_CONNECTING' );
                            } else {
                                this.openConnectionsCount -= 1;
                                console.log( '[ SSE Connection ] - ' + new Date().toISOString() + ': Reconnecting due to severe connection error!' );

                                this.eventSource = undefined;

                                this.reconnectRetryCount += 1;
                                setTimeout( () => {
                                    this.sseConnect();
                                }, 1000 * this.reconnectRetryCount );
                            }
                        } );
                } else {
                    resolve();
                }
            } else {
                if ( confirm( 'Connection lost and it could not be reestablished. Please click ok to retry or press cancel to stop retrying. Your share will be deleted as a result thereof.' ) ) {
                    this.reconnectRetryCount = 0;
                    this.sseConnect();
                } else {
                    this.disconnect();
                }
            }
        } );
    }

    /**
     * Emit an event
     * @param {string} event The event to emit
     * @param {any} data
     * @returns {void}
     */
    emit ( event: string, data: any ): void {
        if ( this.isConnected ) {
            if ( this.useSocket ) {
                this.socket.emit( event, {
                    'roomToken': this.roomToken,
                    'roomName': this.roomName,
                    'data': data
                } );
            } else {
                const now = new Date().getTime();

                if ( this.lastEmitTimestamp < now - 250 ) {
                    this.lastEmitTimestamp = now;
                    this.sendEmitConventionally( event, data );
                } else {
                    this.pendingRequestCount += 1;
                    setTimeout( () => {
                        this.pendingRequestCount = 0;
                        this.lastEmitTimestamp = now;
                        this.sendEmitConventionally( event, data );
                    }, 250 * this.pendingRequestCount );
                }
            }
        }
    }

    sendEmitConventionally ( event: string, data: any ): void {
        fetch( localStorage.getItem( 'url' ) + '/socket/update', {
            'method': 'post',
            'body': JSON.stringify( {
                'event': event,
                'roomName': this.roomName,
                'roomToken': this.roomToken,
                'data': data
            } ),
            'credentials': 'include',
            'headers': {
                'Content-Type': 'application/json',
                'charset': 'utf-8'
            }
        } ).catch( () => {} );
    }

    /**
     * Register a listener function for an event
     * @param {string} event The event to listen for
     * @param {( data: any ) => void} cb The callback function / listener function
     * @returns {void}
     */
    registerListener ( event: string, cb: ( data: any ) => void ): void {
        if ( this.useSocket ) {
            if ( this.isConnected ) {
                this.socket.on( event, cb );
            }
        } else {
            this.toBeListenedForItems[ event ] = cb;
        }
    }

    /**
     * Disconnect from the server
     * @returns {any}
     */
    async disconnect (): Promise<void> {
        if ( this.isConnected ) {
            if ( this.useSocket ) {
                this.socket.emit(
                    'delete-room', {
                        'name': this.roomName,
                        'token': this.roomToken
                    }, ( res: {
                        'status': boolean,
                        'msg': string
                    } ) => {
                        this.socket.disconnect();

                        if ( !res.status ) {
                            alert( 'Unable to delete the room you were just in. The name will be blocked until the next server restart!' );
                        }

                        return;
                    }
                );
            } else {
                fetch( localStorage.getItem( 'url' ) + '/socket/deleteRoom', {
                    'method': 'post',
                    'body': JSON.stringify( {
                        'roomName': this.roomName,
                        'roomToken': this.roomToken
                    } ),
                    'credentials': 'include',
                    'headers': {
                        'Content-Type': 'application/json',
                        'charset': 'utf-8'
                    }
                } ).then( res => {
                    if ( res.status === 200 ) {
                        this.eventSource!.close();
                    } else {
                        alert( 'Unable to delete the room you were just in. The name will be blocked until the next server restart!' );
                    }

                    return;
                } )
                    .catch( () => {
                        return;
                    } );
            }
        }
    }

    getRoomName (): string {
        return this.roomName;
    }

}

export default NotificationHandler;
