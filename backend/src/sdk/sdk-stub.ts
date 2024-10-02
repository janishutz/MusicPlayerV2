import express from 'express';
import expressSession from 'express-session';
import crypto from 'node:crypto';

// TODO: Use also express-session to make it work with getSessionID and session referencing
const checkAuth = ( request: express.Request ) => {
    return true;
}

export interface AuthSDKConfig {
    token: string;
    name: string;
    client: string;
    backendURL: string;
    failReturnURL: string;
    useSecureCookie?: boolean;
}

declare module 'express-session' {
    interface SessionData {
        isAuth: boolean;
        uid: string;
        username: string;
        email: string;
        additionalData: object;
    }
}

const routes = ( app: express.Application, 
    check_user: ( uid: string ) => Promise<boolean>, 
    save_user: ( uid: string, email: string, username: string ) => Promise<boolean>,
    conf?: AuthSDKConfig
): undefined => {
    
}

const getUserData = ( request: express.Request ) => {
    if ( !request.session.uid ) {
        request.session.uid = crypto.randomUUID();
        request.session.username = 'FOSS-Version';
        request.session.email = 'example@example.com';
    }
    return { 'email': request.session.email, 'username': request.session.username, 'uid': request.session.uid, 'id': request.session.id };
}

export default {
    checkAuth,
    routes,
    getUserData
}