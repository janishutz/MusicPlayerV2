import db from './storage/db';


const createUser = ( uid: string, username: string, email: string ): Promise<boolean> => {
    return new Promise( ( resolve, reject ) => {
        db.writeDataSimple( 'users', 'uid', uid, { 'uid': uid, 'username': username, 'email': email } ).then( () => {
            resolve( true );
        } ).catch( err => {
            reject( err );
        } );
    } );
}

const saveUserData = ( uid: string, data: object ): Promise<boolean> => {
    return new Promise( ( resolve, reject ) => {
        db.writeDataSimple( 'users', 'uid', uid, { 'data': data } ).then( () => {
            resolve( true );
        } ).catch( err => {
            reject( err );
        } );
    } );
}

const checkUser = ( uid: string ): Promise<boolean> => {
    return new Promise( ( resolve, reject ) => {
        db.checkDataAvailability( 'users', 'uid', uid ).then( res => {
            resolve( res );
        } ).catch( err => {
            reject( err );
        } )
    } );
}


const getUserData = ( uid: string ): Promise<object> => {
    return new Promise( ( resolve, reject ) => {
        db.getDataSimple( 'users', 'uid', uid ).then( data => {
            resolve( data );
        } ).catch( err => {
            reject( err );
        } );
    } );
}

export default {
    createUser,
    saveUserData,
    checkUser,
    getUserData
}