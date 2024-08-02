/*
*				LanguageSchoolHossegorBookingSystem - userStore.js
*
*	Created by Janis Hutz 10/27/2023, Licensed under a proprietary License
*			https://janishutz.com, development@janishutz.com
*
*
*/

import { defineStore } from 'pinia';

export const useUserStore = defineStore( 'user', {
    state: () => ( { 'isUserAuth': false, 'hasSubscribed': false, 'isUsingKeyboard': false, 'username': '', 'isFOSSVersion': false } ),
    getters: {
        getUserAuthenticated: ( state ) => state.isUserAuth,
        getSubscriptionStatus: ( state ) => state.hasSubscribed,
    },
    actions: { 
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