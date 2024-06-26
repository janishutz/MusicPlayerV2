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
        this.socket = io();
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

    joinRoom ( roomName: string ): void {
        // this.socket.
    }
}

export default NotificationHandler;