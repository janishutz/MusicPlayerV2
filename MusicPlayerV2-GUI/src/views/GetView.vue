<template>
    <div>
        <div class="top-view">
            <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="logo">
            <h1>MusicPlayer</h1>
            <p><i>An Open Source, browser-based MusicPlayer with beautiful graphics</i></p>
            <div style="margin-top: 20px;">
                <a href="https://store.janishutz.com/product/com.janishutz.MusicPlayer" class="fancy-button" target="_blank">Subscribe</a>
                <a href="https://github.com/simplePCBuilding/MusicPlayerV2" class="fancy-button" style="margin-left: 10px;" target="_blank">GitHub</a>
            </div>
        </div>
        <div class="full-height">
            <h2>Fully featured Music Player</h2>
            <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="promo-img">
        </div>
        <div class="full-height">
            <h2>Apple Music integration</h2>
            <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="promo-img">
        </div>
        <div class="full-height">
            <h2>Share your playlist</h2>
            <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="promo-img">
        </div>
        <div class="full-height">
            <h2>Fully browser based</h2>
            <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="promo-img">
        </div>
    </div>
</template>

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