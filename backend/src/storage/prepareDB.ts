import db from './db.js';
// import hash from '../security/hash.js';

db.initDB();
// setTimeout( () => {
//     console.log( 'Setting up admin account' );
//     hash.hashPassword( 'test' ).then( hash => {
//         db.writeDataSimple( 'admin', 'email', 'info@janishutz.com', { email: 'info@janishutz.com', pass: hash, two_fa: 'enhanced' } );
//         console.log( 'Complete!' );
//     } );
// }, 5000 );

