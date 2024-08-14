/*
*				MusicPlayerV2 - notificationHandler.ts
*
*	Created by Janis Hutz 06/26/2024, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

// These functions handle connections to the backend with socket.io

import { io, type Socket } from "socket.io-client";
import type { SSEMap } from "./song";

class SocketConnection {
    socket: Socket;
    roomName: string;
    isConnected: boolean;
    useSocket: boolean;
    eventSource?: EventSource;
    toBeListenedForItems: SSEMap;

    constructor () {
        this.socket = io( localStorage.getItem( 'url' ) ?? '', {
            autoConnect: false,
        } );
        this.roomName = location.pathname.split( '/' )[ 2 ];
        this.isConnected = false;
        this.useSocket = localStorage.getItem( 'music-player-config' ) === 'ws';
        this.toBeListenedForItems = {};
    }

    /**
     * Create a room token and connect to 
     * @returns {Promise<string>}
     */
    connect (): Promise<any> {
        return new Promise( ( resolve, reject ) => {
            if ( this.useSocket ) {
                this.socket.connect();
                this.socket.emit( 'join-room', this.roomName, ( res: { status: boolean, msg: string, data: any } ) => {
                    if ( res.status === true ) {
                        this.isConnected = true;
                        resolve( res.data );
                    } else {
                        console.debug( res.msg );
                        reject( 'ERR_ROOM_CONNECTING' );
                    }
                } );
            } else {
                fetch( localStorage.getItem( 'url' ) + '/socket/joinRoom?room=' + this.roomName, { credentials: 'include' } ).then( res => {
                    if ( res.status === 200 ) {
                        this.eventSource = new EventSource( localStorage.getItem( 'url' ) + '/socket/connection?room=' + this.roomName, { withCredentials: true } );

                        this.eventSource.onmessage = ( e ) => {
                            const d = JSON.parse( e.data );
                            if ( this.toBeListenedForItems[ d.type ] ) {
                                this.toBeListenedForItems[ d.type ]( d.data );
                            } else if ( d.type === 'basics' ) {
                                resolve( d.data );
                            }
                        }

                        this.eventSource.onerror = ( e ) => {
                            if ( this.isConnected ) {
                                this.isConnected = false;
                                console.log( '[ SSE Connection ] - ' + new Date().toISOString() +  ': Reconnecting due to connection error!' );
                                console.debug( e );
                                
                                this.eventSource = undefined;
                                
                                setTimeout( () => {
                                    this.connect();
                                }, 500 );
                            }
                        };
                    } else {
                        reject( 'ERR_ROOM_CONNECTING' );
                    }
                } ).catch( () => {
                    reject( 'ERR_ROOM_CONNECTING' );
                } );
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
                this.socket.emit( event, { 'roomName': this.roomName, 'data': data } );
            } else {
                fetch( localStorage.getItem( 'url' ) + '/socket/update', {
                    method: 'post',
                    body: JSON.stringify( { 'event': event, 'roomName': this.roomName, 'data': data } ),
                    credentials: 'include',
                    headers: {
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
    disconnect (): void {
        if ( this.isConnected ) {
            if ( this.useSocket ) {
                this.socket.disconnect();
            } else {
                this.eventSource!.close();
            }
        }
    }
}

export default SocketConnection;