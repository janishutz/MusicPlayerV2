<template>
    <div class="app-view">
        <div class="home-view" v-if="isLoggedIntoAppleMusic">
            <libraryView class="library-view"></libraryView>
            <playerView :class="'player-view' + ( isShowingFullScreenPlayer ? ' full-screen-player' : '' )" @player-state-change="( state ) => { handlePlayerStateChange( state ) }"></playerView>
        </div>
        <div v-else class="login-view">
            <img src="@/assets/appleMusicIcon.svg" alt="Apple Music Icon">
            <button class="fancy-button" style="margin-top: 20px;">Log into Apple Music</button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import playerView from '@/components/playerView.vue';
    import libraryView from '@/components/libraryView.vue';
    import { ref } from 'vue';
    
    const isLoggedIntoAppleMusic = ref( true );
    const isShowingFullScreenPlayer = ref( false );

    const handlePlayerStateChange = ( newState: string ) => {
        if ( newState === 'hide' ) {
            isShowingFullScreenPlayer.value = false;
        } else {
            isShowingFullScreenPlayer.value = true;
        }
    }
</script>

<style scoped>
    .library-view {
        height: calc( 90vh - 10px );
        width: 100vw;
    }

    .app-view {
        height: 100vh;
        width: 100vw;
    }

    .home-view {
        height: 100vh;
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
        transition: all 1s;
    }

    .full-screen-player {
        height: 100vh;
        width: 100vw;
        left: 0;
        bottom: 0;
    }
</style>