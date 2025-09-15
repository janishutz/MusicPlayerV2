import {
    defineStore
} from 'pinia';


// FOSS-VERSION: To enable the UI to be used with the FOSS version, change "isUserAuth" to true, you will be "logged in"
export const useUserStore = defineStore( 'user', {
    'state': () => ( {
        'isUserAuth': true,
        'hasSubscribed': false,
        'isUsingKeyboard': false,
        'username': '',
        'isFOSSVersion': false
    } ),
    'getters': {
        'getUserAuthenticated': state => state.isUserAuth,
        'getSubscriptionStatus': state => state.hasSubscribed,
    },
    'actions': {
        setUserAuth ( auth: boolean ) {
            this.isUserAuth = auth;
        },
        setSubscriptionStatus ( status: boolean ) {
            this.hasSubscribed = status;
        },
        setUsername ( username: string ) {
            this.username = username;
        },
        setKeyboardUsageStatus ( status: boolean ) {
            this.isUsingKeyboard = status;
        }
    }
} );
