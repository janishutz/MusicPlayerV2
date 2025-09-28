<template>
    <div class="home-view">
        <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="logo">
        <button
            :class="'fancy-button' + ( isTryingToSignIn ? ' fancy-button-inactive' : '' )"
            style="margin-top: 5vh;"
            title="Sign in or sign up with janishutz.com ID"
            @click="login()"
        >
            {{ isTryingToSignIn ? 'Signing you in...' : 'Login / Sign up' }}
        </button>
        <p style="width: 80%;">
            MusicPlayer is a browser based Music Player, that allows you to connect other devices,
            simply with another web-browser, where you can see the current playlist with sleek animations.
            You can log in using your Apple Music account or load a playlist from your local disk,
            simply by selecting the songs using a file picker.
        </p>
        <router-link to="/get" class="fancy-button">
            More information
        </router-link>
        <notificationsModule ref="notifications" location="bottomleft" size="bigger" />
    </div>
</template>

<script setup lang="ts">
// TODO: Make possible to install and use without account, if using FOSS version
    import {
        RouterLink
    } from 'vue-router';
    import notificationsModule from '@/components/notificationsModule.vue';
    import {
        ref
    } from 'vue';
    import router from '@/router';
    import sdk from '@janishutz/login-sdk-browser';
    import {
        useUserStore
    } from '@/stores/userStore';

    const notifications = ref( notificationsModule );
    const isTryingToSignIn = ref( true );

    const login = () => {
        sdk.login();
    };

    const store = useUserStore();

    if ( store.isUserAuth ) {
        router.push( localStorage.getItem( 'redirect' ) ?? '/app' );
        localStorage.removeItem( 'redirect' );
    } else {
        sdk.verifyFull()
            .then( res => {
                if ( res ) {
                    store.isUserAuth = true;

                    if ( localStorage.getItem( 'close-tab' ) ) {
                        localStorage.removeItem( 'close-tab' );
                        window.close();
                    }

                    localStorage.setItem( 'login-ok', 'true' );
                    router.push( localStorage.getItem( 'redirect' ) ?? '/app' );
                    localStorage.removeItem( 'redirect' );
                } else {
                    isTryingToSignIn.value = false;
                }
            } );
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
