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
    state: () => ( { 'isUserAuth': false, 'isAdminAuth': false, 'isUsingKeyboard': false, 'username': '' } ),
    getters: {
        getUserAuthenticated: ( state ) => state.isUserAuth,
        getAdminAuthenticated: ( state ) => state.isAdminAuth,
    },
    actions: { 
        setUserAuth ( auth: boolean ) {
            this.isUserAuth = auth;
        },
        setAdminAuth ( auth: boolean ) {
            this.isAdminAuth = auth;
        },
        setUsername ( username: string ) {
            this.username = username;
        },
        setKeyboardUsageStatus ( status: boolean ) {
            this.isUsingKeyboard = status;
        }
    }
} );