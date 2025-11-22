// These functions handle connections to the backend with socket.io

import {
    type Socket, io
} from 'socket.io-client';
import type {
    SSEMap
} from './song';

class SocketConnection {

    socket: Socket;

    roomName: string;

    isConnected: boolean;

    useSocket: boolean;

    eventSource?: EventSource;

    toBeListenedForItems: SSEMap;

    reconnectRetryCount: number;

    openConnectionsCount: number;

    constructor () {
        this.socket = io( localStorage.getItem( 'url' ) ?? '', {
            'autoConnect': false,
        } );
        this.roomName = location.pathname.split( '/' )[ 2 ];
        this.isConnected = false;
        this.useSocket = localStorage.getItem( 'music-player-config' ) === 'ws';
        this.toBeListenedForItems = {};
        this.reconnectRetryCount = 0;
        this.openConnectionsCount = 0;
    }

    /**
     * Create a room token and connect to
     * @returns {Promise<string>}
     */
    connect (): Promise<unknown> {
        return new Promise( ( resolve, reject ) => {
            if ( this.reconnectRetryCount < 5 ) {
                if ( this.useSocket ) {
                    this.socket.connect();
                    this.socket.emit(
                        'join-room', this.roomName, ( res: {
                            'status': boolean,
                            'msg': string,
                            'data': unknown
                        } ) => {
                            if ( res.status === true ) {
                                this.isConnected = true;
                                resolve( res.data );
                            } else {
                                console.debug( res.msg );
                                reject( 'ERR_ROOM_CONNECTING' );
                            }
                        }
                    );
                } else {
                    if ( this.openConnectionsCount < 1 && !this.isConnected ) {
                        this.openConnectionsCount += 1;
                        fetch( localStorage.getItem( 'url' ) + '/socket/joinRoom?room=' + this.roomName, {
                            'credentials': 'include'
                        } ).then( res => {
                            if ( res.status === 200 ) {
                                this.eventSource
                                    = new EventSource( localStorage.getItem( 'url' )
                                                      + '/socket/connection?room=' + this.roomName, {
                                        'withCredentials': true
                                    } );

                                this.eventSource.onopen = () => {
                                    this.isConnected = true;
                                    this.reconnectRetryCount = 0;
                                    console.log( '[ SSE Connection ] - '
                                                + new Date().toISOString() + ': Connection successfully established!' );
                                };

                                this.eventSource.onmessage = e => {
                                    const d = JSON.parse( e.data );

                                    if ( this.toBeListenedForItems[ d.type ] ) {
                                        this.toBeListenedForItems[ d.type ]( d.data );
                                    } else if ( d.type === 'basics' ) {
                                        resolve( d.data );
                                    }
                                };

                                this.eventSource.onerror = () => {
                                    if ( this.isConnected ) {
                                        this.isConnected = false;
                                        this.openConnectionsCount -= 1;
                                        this.eventSource?.close();
                                        console.log( '[ SSE Connection ] - '
                                                    + new Date().toISOString()
                                                    + ': Reconnecting due to connection error!' );
                                        // console.debug( e );

                                        this.eventSource = undefined;

                                        this.reconnectRetryCount += 1;
                                        setTimeout( () => {
                                            this.connect();
                                        }, 1000 * this.reconnectRetryCount );
                                    }
                                };
                            } else {
                                console.log( '[ SSE Connection ] - '
                                            + new Date().toISOString()
                                            + ': Could not connect due to error ' + res.status );
                                reject( 'ERR_ROOM_CONNECTING' );
                            }
                        } )
                            .catch( () => {
                                console.log( '[ SSE Connection ] - '
                                            + new Date().toISOString()
                                            + ': Could not connect due to error.' );
                                reject( 'ERR_ROOM_CONNECTING' );
                            } );
                    } else {
                        console.log( '[ SSE Connection ]: Trimmed connections' );
                        reject( 'ERR_TOO_MANY_CONNECTIONS' );
                    }
                }
            } else {
                alert( 'Could not reconnect to the share. Please reload the page to retry!' );
                reject( 'ERR_ROOM_CONNECTING' );
            }
        } );
    }

    /**
     * Emit an event
     * @param {string} event The event to emit
     * @param {any} data
     * @returns {void}
     */
    emit ( event: string, data: unknown ): void {
        if ( this.isConnected ) {
            if ( this.useSocket ) {
                this.socket.emit( event, {
                    'roomName': this.roomName,
                    'data': data
                } );
            } else {
                fetch( localStorage.getItem( 'url' ) + '/socket/update', {
                    'method': 'post',
                    'body': JSON.stringify( {
                        'event': event,
                        'roomName': this.roomName,
                        'data': data
                    } ),
                    'credentials': 'include',
                    'headers': {
                        'Content-Type': 'application/json',
                        'charset': 'utf-8'
                    }
                } ).catch( () => {} );
            }
        }
    }

    /**
     * Register a listener function for an event
     * @param {string} event The event to listen for
     * @param {( data: any ) => void} cb The callback function / listener function
     * @returns {void}
     */
    registerListener ( event: string, cb: ( data: unknown ) => void ): void {
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
    disconnect (): void {
        if ( this.isConnected ) {
            if ( this.useSocket ) {
                this.socket.disconnect();
            } else {
                this.eventSource!.close();
            }
        }
    }

    getStatus (): boolean {
        if ( this.useSocket ) {
            return true;
        } else {
            if ( this.eventSource ) {
                return this.eventSource!.OPEN && this.isConnected;
            }

            return false;
        }
    }

}

export default SocketConnection;
