import express from 'express';

// TODO: Use also express-session to make it work with getSessionID and session referencing
const checkAuth = ( request: express.Request ) => {
    return true;
}


export default {
    checkAuth
}