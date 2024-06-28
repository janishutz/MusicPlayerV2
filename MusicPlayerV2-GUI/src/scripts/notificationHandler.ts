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

class NotificationHandler {
    socket: Socket;
    roomName: string;
    roomToken: string;

    constructor () {
        this.socket = io( localStorage.getItem( 'url' ) ?? '', {
            autoConnect: false,
        } );
        this.roomName = '';
        this.roomToken = '';
    }

    /**
     * Create a room token and connect to 
     * @param {string} roomName 
     * @returns {Promise<string>}
     */
    connect ( roomName: string ): Promise<void> {
        return new Promise( ( resolve, reject ) => {
            fetch( localStorage.getItem( 'url' ) + '/createRoomToken?roomName=' + roomName, { credentials: 'include' } ).then( res => {
                if ( res.status === 200 ) {
                    res.text().then( text => {
                        this.roomToken = text;
                        this.roomName = roomName;
                        this.socket.connect();
                        this.socket.emit( 'create-room', {
                            name: this.roomName,
                            token: this.roomToken
                        }, ( res: { status: boolean, msg: string } ) => {
                            if ( res.status === true) {
                                resolve();
                            } else {
                                reject( 'ERR_ROOM_CONNECTING' );
                            }
                        } );
                    } );
                } else if ( res.status === 409 ) {
                    reject( 'ERR_CONFLICT' );
                } else {
                    reject( 'ERR_ROOM_CREATING' );
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
        this.socket.emit( event, data );
    }

    /**
     * Register a listener function for an event
     * @param {string} event The event to listen for
     * @param {( data: any ) => void} cb The callback function / listener function
     * @returns {void}
     */
    registerListener ( event: string, cb: ( data: any ) => void ): void {
        this.socket.on( event, cb );
    }

    /**
     * Disconnect from the server
     * @returns {any}
     */
    disconnect (): void {
        this.socket.disconnect();
        this.socket.emit( 'delete-room', {
            name: this.roomName,
            token: this.roomToken
        }, ( res: { status: boolean, msg: string } ) => {
            if ( !res.status ) {
                alert( 'Unable to delete the room you were just in. The name will be blocked until the next server restart!' );
            }
        } );
    }
}

export default NotificationHandler;