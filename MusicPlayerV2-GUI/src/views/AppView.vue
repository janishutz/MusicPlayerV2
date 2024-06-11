<template>
    <div class="app-view">
        <div class="home-view" v-if="isLoggedIntoAppleMusic">
            <libraryView></libraryView>
            <playerView class="player-view" :is-showing-full-screen-player="isShowingFullScreenPlayer"></playerView>
        </div>
        <div v-else class="home-view">
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
</script>

<style scoped>
    .app-view {
        height: 100vh;
        width: 100vw;
    }

    .home-view {
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
    }
</style>