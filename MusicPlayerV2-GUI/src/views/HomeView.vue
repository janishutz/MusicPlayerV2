<template>
    <div class="home-view">
        <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="logo">
        <button @click="login()" class="fancy-button">Log in / Sign up</button>
        <p>MusicPlayer is a browser based Music Player, that allows you to connect other devices, simply with another web-browser, where you can see the current playlist with sleek animations. You can log in using your Apple Music account or load a playlist from your local disk, simply by selecting the songs using a file picker.</p>
    </div>
</template>

<script setup lang="ts">
import router from '@/router';

    const login = () => {
        alert( 'Logging in...' );
        // TODO: Actually implement with sdk, then check if user has subscription for product, if so, have them proceed to /app
        // else: proceed to /purchase where they get linked to https://store.janishutz.com/product/com.janishutz.MusicPlayer
        router.push( '/app' );
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