<template>
    <div class="app-view">
        <button id="logout" @click="logout()"><span class="material-symbols-outlined">logout</span></button>
        <div class="loading-view" v-if="!hasFinishedLoading">
            <h1>Loading...</h1>
        </div>
        <div class="home-view" v-else-if="hasFinishedLoading && isReady">
            <libraryView class="library-view" :playlists="playlists" @selected-playlist="( id ) => { selectPlaylist( id ) }" 
                :is-logged-in="isLoggedIntoAppleMusic" @custom-playlist="( pl ) => selectCustomPlaylist( pl )"></libraryView>
        </div>
        <div v-else class="login-view">
            <img src="@/assets/appleMusicIcon.svg" alt="Apple Music Icon">
            <button class="fancy-button" style="margin-top: 20px;" @click="logIntoAppleMusic()">Log into Apple Music</button>
            <button class="fancy-button" title="This allows you to use local playlists only. Cover images for your songs will be fetched from the apple music api as good as possible" @click="skipLogin()">Continue without logging in</button>
        </div>
        <playerView :class="'player-view' + ( isReady ? ( isShowingFullScreenPlayer ? ' full-screen-player' : '' ) : ' player-hidden' )" @player-state-change="( state ) => { handlePlayerStateChange( state ) }"
            ref="player"></playerView>
        <!-- TODO: Call to backend to check if user has access -->
    </div>
</template>

<script setup lang="ts">
    import playerView from '@/components/playerView.vue';
    import libraryView from '@/components/libraryView.vue';
    import { ref } from 'vue';
    import type { ReadFile } from '@/scripts/song';
    import router from '@/router';
    import { useUserStore } from '@/stores/userStore';
    
    const isLoggedIntoAppleMusic = ref( false );
    const isReady = ref( false );
    const isShowingFullScreenPlayer = ref( false );
    const player = ref( playerView );
    const playlists = ref( [] );
    const hasFinishedLoading = ref( false );
    const userStore = useUserStore();

    const handlePlayerStateChange = ( newState: string ) => {
        if ( newState === 'hide' ) {
            isShowingFullScreenPlayer.value = false;
        } else {
            isShowingFullScreenPlayer.value = true;
        }
    }

    let loginChecker = 0;

    const logIntoAppleMusic = () => {
        player.value.logIntoAppleMusic();
        loginChecker = setInterval( () => {
            if ( player.value.getAuth()[ 0 ] ) {
                isLoggedIntoAppleMusic.value = true;
                isReady.value = true;
                player.value.getPlaylists( ( data ) => {
                    playlists.value = data.data.data;
                } );
                clearInterval( loginChecker );
            } else if ( player.value.getAuth()[ 1 ] ) {
                clearInterval( loginChecker );
                alert( 'An error occurred when logging you in. Please try again!' );
            }
        }, 500 );
    }

    const skipLogin = () => {
        isReady.value = true;
        isLoggedIntoAppleMusic.value = false;
        player.value.skipLogin();
    }

    const selectPlaylist = ( id: string ) => {
        player.value.selectPlaylist( id );
        player.value.controlUI( 'show' );
    }

    const selectCustomPlaylist = ( playlist: ReadFile[] ) => {
        player.value.selectCustomPlaylist( playlist );
        player.value.controlUI( 'show' );
    }

    fetch( localStorage.getItem( 'url' ) + '/checkUserStatus', { credentials: 'include' } ).then( res => {
        if ( res.status === 200 ) {
            res.text().then( text => {
                if ( text === 'ok' ) {
                    hasFinishedLoading.value = true;
                    userStore.setSubscriptionStatus( true );
                } else {
                    userStore.setSubscriptionStatus( false );
                    sessionStorage.setItem( 'getRedirectionReason', 'notOwned' );
                    router.push( '/get' );
                }
            } );
        } else if ( res.status === 404 ) {
            userStore.setSubscriptionStatus( false );
            router.push( '/get' );
            sessionStorage.setItem( 'getRedirectionReason', 'notOwned' );
        } else {
            console.log( res.status );
        }
    } );

    const logout = () => {
        // location.href = 'http://localhost:8080/logout?return=' + location.href;
        location.href = 'https://id.janishutz.com/logout?return=' + location.href;
    }
</script>

<style scoped>
    #logout {
        border: none;
        background: none;
        position: fixed;
        left: calc( 10px + 2rem );
        top: 10px;
        cursor: pointer;
    }

    #logout .material-symbols-outlined {
        font-size: 1.5rem;
        color: var( --primary-color );
    }

    .library-view {
        height: calc( 90vh - 10px );
        width: 100%;
    }

    .app-view {
        height: 100%;
        width: 100%;
    }

    .home-view {
        height: 100%;
    }

    .login-view {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .logo {
        height: 50vh;
    }

    .player-view {
        height: 13vh;
        width: calc( 100vw - 20px );
        position: fixed;
        bottom: 10px;
        left: 10px;
        background-color: var( --secondary-color );
        transition: all 0.75s ease-in-out;
    }

    .full-screen-player {
        height: 100vh;
        width: 100vw;
        left: 0;
        bottom: 0;
    }

    .player-hidden {
        display: none;
    }
</style>