<template>
    <div>
        <div class="top-view">
            <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="logo">
            <h1>MusicPlayer</h1>
            <p v-if="reasonForRedirectHere" style="color: red;">{{ reasons[ reasonForRedirectHere ] }}</p>
            <p v-if="!reasonForRedirectHere"><i>An Open Source, browser-based MusicPlayer with beautiful graphics</i></p>
            <div style="margin-top: 20px;">
                <a href="https://store.janishutz.com/product/com.janishutz.MusicPlayer" class="fancy-button" target="_blank">Subscribe</a>
                <a href="/" class="fancy-button" style="margin-left: 10px;" v-if="!reasonForRedirectHere">Log in</a>
                <button href="/" class="fancy-button" style="margin-left: 10px;" v-if="!reasonForRedirectHere" @click="logout()">Log out</button>
                <a href="https://github.com/simplePCBuilding/MusicPlayerV2" class="fancy-button" style="margin-left: 10px;" target="_blank">GitHub</a>
            </div>
        </div>
        <div>
            <h2>Fully featured Music Player</h2>
            <p>All the features you'd expect a Music Player to have are also present here</p>

            <h2>Apple Music integration</h2>
            <p>Use MusicPlayer in conjunction with Apple Music</p>

            <h2>Share your playlist</h2>
            <p>You can share your playlist on a beautifully animated public page, so that other people can join in and view your playlist</p>

            <h2>Fully browser based</h2>
            <p>No installation required when using MusicPlayer on <a href="https://music.janishutz.com">music.janishutz.com</a></p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, type Ref } from 'vue';

    interface Reasons {
        [key: string]: string;
    }

    const reasons: Ref<Reasons> = ref( {
        'notOwned': 'Please subscribe to use MusicPlayer here, or download and install it manually from GitHub!',
    } );
    const reasonForRedirectHere = ref( sessionStorage.getItem( 'getRedirectionReason' ) );
    sessionStorage.removeItem( 'getRedirectionReason' );

    const logout = () => {
        location.href = localStorage.getItem( 'url' ) + '/logout?return=' + location.href;
    }
</script>

<style scoped>
    .logo {
        height: 60vh;
        max-height: 90vw;
        border-radius: 20px;
    }

    .top-view {
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column; 
    }

    .full-height {
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .promo-img {
        height: 100vh;
        width: 100vh;
    }
</style>