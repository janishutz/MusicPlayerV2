<template>
    <div class="app-view">
        <div class="home-view" v-if="isLoggedIntoAppleMusic">
            <libraryView class="library-view" :playlists="playlists" @selected-playlist="( id ) => { selectPlaylist( id ) }"></libraryView>
        </div>
        <div v-else class="login-view">
            <img src="@/assets/appleMusicIcon.svg" alt="Apple Music Icon">
            <button class="fancy-button" style="margin-top: 20px;" @click="logIntoAppleMusic()">Log into Apple Music</button>
            <button class="fancy-button" title="This allows you to use local playlists only. Cover images for your songs will be fetched from the apple music api as good as possible" @click="skipLogin()">Continue without logging in</button>
        </div>
        <playerView :class="'player-view' + ( isLoggedIntoAppleMusic ? ( isShowingFullScreenPlayer ? ' full-screen-player' : '' ) : ' player-hidden' )" @player-state-change="( state ) => { handlePlayerStateChange( state ) }"
            ref="player"></playerView>
    </div>
</template>

<script setup lang="ts">
    import playerView from '@/components/playerView.vue';
    import libraryView from '@/components/libraryView.vue';
    import { ref } from 'vue';
    
    const isLoggedIntoAppleMusic = ref( false );
    const isShowingFullScreenPlayer = ref( false );
    const player = ref( playerView );
    const playlists = ref( [] );

    const handlePlayerStateChange = ( newState: string ) => {
        if ( newState === 'hide' ) {
            isShowingFullScreenPlayer.value = false;
        } else {
            isShowingFullScreenPlayer.value = true;
        }
    }

    let loginChecker = 0;

    const logIntoAppleMusic = () => {
        loginChecker = setInterval( () => {
            if ( player.value.getAuth()[ 0 ] ) {
                isLoggedIntoAppleMusic.value = true;
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
        isLoggedIntoAppleMusic.value = true;
        player.value.skipLogin();
    }

    const selectPlaylist = ( id: string ) => {
        player.value.selectPlaylist( id );
    }
</script>

<style scoped>
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
        height: 10vh;
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