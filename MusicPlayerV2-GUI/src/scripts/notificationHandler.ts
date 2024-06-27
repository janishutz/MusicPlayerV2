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

    constructor () {
        this.socket = io( localStorage.getItem( 'url' ) ?? '', {
            autoConnect: false,
        } );
    }

    /**
     * Create a room token and connect to 
     * @param {string} roomName 
     * @returns {Promise<string>}
     */
    connect ( roomName: string ): Promise<string> {
        fetch( localStorage.getItem( 'url' ) + '/createRoomToken', { credentials: 'include' } ).then( res => {
            if ( res.status === 200 ) {
                res.json().then( json => {
                    
                } );
            }
        } );
        
    }

    /**
     * Description
     * @param {string} event The event to emit
     * @param {any} data
     * @returns {void}
     */
    emit ( event: string, data: any ): void {
        this.socket.emit( event, data );
    }

    registerListener ( event: string, cb: ( data: any ) => void ): void {
        this.socket.on( event, cb );
    }

    disconnect (): void {
        this.socket.disconnect();
    }
}

export default NotificationHandler;