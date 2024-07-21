<template>
    <div class="home-view">
        <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="logo">
        <button :class="'fancy-button' + ( isTryingToSignIn ? ' fancy-button-inactive' : '' )" @click="login()" 
            style="margin-top: 5vh;" title="Sign in or sign up with janishutz.com ID" v-if="status"
            >{{ isTryingToSignIn ? 'Signing you in...' : 'Login / Sign up' }}</button>
        <p v-else>We are sorry, but we were unable to initialize the login services. Please reload the page if you wish to retry!</p>
        <p style="width: 80%;">MusicPlayer is a browser based Music Player, that allows you to connect other devices, simply with another web-browser, where you can see the current playlist with sleek animations. You can log in using your Apple Music account or load a playlist from your local disk, simply by selecting the songs using a file picker.</p>
        <router-link to="/get" class="fancy-button">More information</router-link>
        <notificationsModule ref="notifications" location="bottomleft" size="bigger"></notificationsModule>
    </div>
</template>

<script setup lang="ts">
// TODO: Make possible to install and use without account, if using FOSS version
    import router from '@/router';
    import { RouterLink } from 'vue-router';
    import { useUserStore } from '@/stores/userStore';
    import notificationsModule from '@/components/notificationsModule.vue';
    import { ref } from 'vue';

    const notifications = ref( notificationsModule );
    const isTryingToSignIn = ref( true );

    interface JanishutzIDSDK {
        setLoginSDKURL: ( url: string ) => undefined;
        createSession: () => undefined;
        verifySession: () => Promise<JHIDSessionStatus>
    }

    interface JHIDSessionStatus {
        status: boolean;
        username: string;
    }

    let sdk: JanishutzIDSDK;
    const status = ref( true );

    if ( typeof( JanishutzID ) !== 'undefined' ) {   
        sdk = JanishutzID();
        sdk.setLoginSDKURL( localStorage.getItem( 'url' ) ?? '' );
    } else {
        setTimeout( () => {
            notifications.value.createNotification( 'Unable to initialize account services!', 5, 'error' );
        }, 1000 );
        status.value = false;
    }

    const login = () => {
        sdk.createSession();
    }

    const store = useUserStore();

    if ( store.isUserAuth ) {
        router.push( localStorage.getItem( 'redirect' ) ?? '/app' );
        localStorage.removeItem( 'redirect' );
    } else {
        if ( typeof( sdk ) !== 'undefined' ) {
            sdk.verifySession().then( res => {
                if ( res.status ) {
                    store.isUserAuth = true;
                    store.username = res.username;
                    router.push( localStorage.getItem( 'redirect' ) ?? '/app' );
                    localStorage.removeItem( 'redirect' );
                } else {
                    isTryingToSignIn.value = false;
                }
            } );
        }
    }
</script>

<style scoped>
    .home-view {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .logo {
        height: 50vh;
        border-radius: 50px;
    }
</style>