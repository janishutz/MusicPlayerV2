/*
*				MusicPlayerV2 - notificationHandler.ts
*
*	Created by Janis Hutz 06/26/2024, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

// These functions handle connections to the backend with socket.io

import { io, type Socket } from "socket.io-client"

class SocketConnection {
    socket: Socket;
    roomName: string;
    isConnected: boolean;

    constructor () {
        this.socket = io( localStorage.getItem( 'url' ) ?? '', {
            autoConnect: false,
        } );
        this.roomName = location.pathname.split( '/' )[ 2 ];
        this.isConnected = false;
    }

    /**
     * Create a room token and connect to 
     * @returns {Promise<string>}
     */
    connect (): Promise<any> {
        return new Promise( ( resolve, reject ) => {
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
            this.socket.emit( event, { 'roomName': this.roomName, 'data': data } );
        }
    }

    /**
     * Register a listener function for an event
     * @param {string} event The event to listen for
     * @param {( data: any ) => void} cb The callback function / listener function
     * @returns {void}
     */
    registerListener ( event: string, cb: ( data: any ) => void ): void {
        if ( this.isConnected ) {
            this.socket.on( event, cb );
        }
    }

    /**
     * Disconnect from the server
     * @returns {any}
     */
    disconnect (): void {
        if ( this.isConnected ) {
            this.socket.disconnect();
        }
    }
}

export default SocketConnection;