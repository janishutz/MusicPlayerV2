import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import account from './account';
import sdk from 'oauth-janishutz-client-server';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import crypto from 'node:crypto';
import type { Room, Song } from './definitions';
import storeSDK from 'store.janishutz.com-sdk';

declare let __dirname: string | undefined
if ( typeof( __dirname ) === 'undefined' ) {
    __dirname = path.resolve( path.dirname( '' ) );
}

// TODO: Change config file, as well as in main.ts, index.html, oauth, if deploying there
const sdkConfig = JSON.parse( '' + fs.readFileSync( path.join( __dirname + '/config/sdk.config.testing.json' ) ) );
// const sdkConfig: AuthSDKConfig = JSON.parse( '' + fs.readFileSync( path.join( __dirname + '/config/sdk.config.secret.json' ) ) );

const run = () => {
    let app = express();
    app.use( cors( { 
        credentials: true,
        origin: true 
    } ) );
    storeSDK.configure( {
        backendURL: 'http://localhost:8083',
        name: 'testing',
        signingSecret: 'test',
    } );

    const httpServer = createServer( app );

    // Load id.janishutz.com SDK and allow signing in
    sdk.routes( app, ( uid: string ) => { 
        return new Promise( ( resolve, reject ) => {
            account.checkUser( uid ).then( stat => {
                resolve( stat );
            } ).catch( e => {
                reject( e );
            } );
        } );
    }, 
    ( uid: string, email: string, username: string ) => {
        return new Promise( ( resolve, reject ) => {
            account.createUser( uid, username, email ).then( stat => {
                resolve( stat );
            } ).catch( e => {
                reject( e );
            } );
        } );
    }, sdkConfig );

    // Websocket for events
    interface SocketData {
        [key: string]: Room;
    }
    const socketData: SocketData = {};
    const io = new Server( httpServer, {
        cors: {
            origin: true,
            credentials: true,
        }
    } );

    io.on( 'connection', ( socket ) => {
        socket.on( 'create-room', ( room: { name: string, token: string }, cb: ( res: { status: boolean, msg: string } ) => void ) => {
            if ( socketData[ room.name ] ) {
                if ( room.token === socketData[ room.name ].roomToken ) {
                    socket.join( room.name );
                    cb( {
                        status: true,
                        msg: 'ADDED_TO_ROOM'
                    } );
                } else {
                    cb( {
                        status: false,
                        msg: 'ERR_TOKEN_INVALID'
                    } );
                }
            } else {
                cb( {
                    status: false,
                    msg: 'ERR_NAME_INVALID'
                } );
            }
        } );

        socket.on( 'delete-room', ( room: { name: string, token: string }, cb: ( res: { status: boolean, msg: string } ) => void ) => {
            if ( socketData[ room.name ] ) {
                if ( room.token === socketData[ room.name ].roomToken ) {
                    socket.leave( room.name );
                    socket.to( room.name ).emit( 'delete-share', room.name );
                    socketData[ room.name ] = undefined;
                    cb( {
                        status: true,
                        msg: 'ROOM_DELETED'
                    } );
                } else {
                    cb( {
                        status: false,
                        msg: 'ERR_TOKEN_INVALID'
                    } );
                }
            } else {
                cb( {
                    status: false,
                    msg: 'ERR_NAME_INVALID'
                } );
            }
        } );

        socket.on( 'join-room', ( room: string, cb: ( res: { status: boolean, msg: string, data?: { playbackStatus: boolean, playbackStart: number, playlist: Song[], playlistIndex: number, useAntiTamper: boolean } } ) => void ) => {
            if ( socketData[ room ] ) {
                socket.join( room );
                cb( {
                    data: {
                        playbackStart: socketData[ room ].playbackStart,
                        playbackStatus: socketData[ room ].playbackStatus,
                        playlist: socketData[ room ].playlist,
                        playlistIndex: socketData[ room ].playlistIndex,
                        useAntiTamper: socketData[ room ].useAntiTamper,
                    },
                    msg: 'STATUS_OK',
                    status: true,
                } )
            } else {
                cb( {
                    msg: 'ERR_NO_ROOM_WITH_THIS_ID',
                    status: false,
                } );
                socket.disconnect();
            }
        } );

        socket.on( 'tampering', ( data: { msg: string, roomName: string } ) => {
            if ( data.roomName ) {
                socket.to( data.roomName ).emit( 'tampering-msg', data.msg );
            }
        } )

        socket.on( 'playlist-update', ( data: { roomName: string, roomToken: string, data: Song[] } ) => {
            if ( socketData[ data.roomName ] ) {
                if ( socketData[ data.roomName ].roomToken === data.roomToken ) {
                    if ( socketData[ data.roomName ].playlist !== data.data ) {
                        socketData[ data.roomName ].playlist = data.data;
                        io.to( data.roomName ).emit( 'playlist', data.data );
                    }
                }
            }
        } );

        socket.on( 'playback-update', ( data: { roomName: string, roomToken: string, data: boolean } ) => {
            if ( socketData[ data.roomName ] ) {
                if ( socketData[ data.roomName ].roomToken === data.roomToken ) {
                    socketData[ data.roomName ].playbackStatus = data.data;
                    io.to( data.roomName ).emit( 'playback', data.data );
                }
            }
        } );

        socket.on( 'playlist-index-update', ( data: { roomName: string, roomToken: string, data: number } ) => {
            if ( socketData[ data.roomName ] ) {
                if ( socketData[ data.roomName ].roomToken === data.roomToken ) {
                    socketData[ data.roomName ].playlistIndex = data.data;
                    io.to( data.roomName ).emit( 'playlist-index', data.data );
                }
            }
        } );

        socket.on( 'playback-start-update', ( data: { roomName: string, roomToken: string, data: number } ) => {
            if ( socketData[ data.roomName ] ) {
                if ( socketData[ data.roomName ].roomToken === data.roomToken ) {
                    socketData[ data.roomName ].playbackStart = data.data;
                    io.to( data.roomName ).emit( 'playback-start', data.data );
                }
            }
        } );
    } );


    app.get( '/', ( request: express.Request, response: express.Response ) => {
        response.send( 'Please visit <a href="https://music.janishutz.com">https://music.janishutz.com</a> to use this service' );
    } );

    
    app.get( '/createRoomToken', ( request: express.Request, response: express.Response ) => {
        if ( sdk.checkAuth( request ) ) {
            const roomName = String( request.query.roomName ) ?? '';
            if ( !socketData[ roomName ] ) {
                const roomToken = crypto.randomUUID();
                socketData[ roomName ] = {
                    playbackStart: 0,
                    playbackStatus: false,
                    playlist: [],
                    playlistIndex: 0,
                    roomName: roomName,
                    roomToken: roomToken,
                    ownerUID: sdk.getUserData( request ).uid,
                    useAntiTamper: request.query.useAntiTamper === 'true' ? true : false,
                };
                response.send( roomToken );
            } else {
                if ( socketData[ roomName ].ownerUID === sdk.getUserData( request ).uid ) {
                    response.send( socketData[ roomName ].roomToken );
                } else {
                    response.status( 409 ).send( 'ERR_CONFLICT' );
                }
            }
        } else {
            response.status( 403 ).send( 'ERR_FORBIDDEN' );
        }
    } );


    app.get( '/getAppleMusicDevToken', ( req, res ) => {
        // sign dev token
        const privateKey = fs.readFileSync( path.join( __dirname + '/config/apple_private_key.p8' ) ).toString();
        // TODO: Remove secret
        const config = JSON.parse( '' + fs.readFileSync( path.join( __dirname + '/config/apple-music-api.config.secret.json' ) ) );
        const now = new Date().getTime();
        const tomorrow = now + 24 * 3600 * 1000;
        const jwtToken = jwt.sign( {
            'iss': config.teamID,
            'iat': Math.floor( now / 1000 ),
            'exp': Math.floor( tomorrow / 1000 ),
        }, privateKey, {
            algorithm: "ES256",
            keyid: config.keyID
        } );
        res.send( jwtToken );
    } );

    // TODO: Get user's subscriptions using store sdk

    app.get( '/checkUserStatus', ( request: express.Request, response: express.Response ) => {
        if ( sdk.checkAuth( request ) ) {
            storeSDK.getSubscriptions( sdk.getUserData( request ).uid ).then( stat => {
                let owned = false;
                const now = new Date().getTime();
                for ( let sub in stat ) {
                    if ( stat[ sub ].expires - now > 0 
                        && ( stat[ sub ].id === 'com.janishutz.MusicPlayer.subscription' || stat[ sub ].id === 'com.janishutz.MusicPlayer.subscription-month' ) ) {
                            owned = true;
                    }
                }
                if ( owned ) {
                    response.send( 'ok' );
                } else {
                    response.send( 'ERR_NOT_OWNED' );
                }
            } ).catch( e => {
                console.error( e );
                response.status( 404 ).send( 'ERR_NOT_OWNED' );
            } );
        } else {
            response.status( 401 ).send( 'ERR_AUTH_REQUIRED' );
        }
    } );

    app.use( ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
        response.status( 404 ).send( 'ERR_NOT_FOUND' );
        // response.sendFile( path.join( __dirname + '' ) ) 
    } );


    const PORT = process.env.PORT || 8082;
    httpServer.listen( PORT );
}

export default {
    run
}