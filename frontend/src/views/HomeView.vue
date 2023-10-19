<template>
    <div class="home">
        <div class="top-bar">
            <img src="@/assets/logo.png" alt="logo" class="logo">
            <div class="player-wrapper">
                
            </div>
        </div>
        <div class="pool-wrapper">
            <mediaPool></mediaPool>
        </div>
    </div>
</template>

<style>
    .home {
        width: 100%;
        height: 100%;
    }

    .pool-wrapper {
        height: 84vh;
    }

    .top-bar {
        margin-left: auto;
        margin-right: auto;
        width: 99%;
        height: 15vh;
        display: flex;
        align-items: center;
        flex-direction: row;
        border: var( --primary-color ) 2px solid;
    }

    .player-wrapper {
        width: 70vw;
        margin-right: auto;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .logo {
        height: 90%;
        margin-left: 3%;
        margin-right: auto;
    }
</style>

<script>
    import mediaPool from '@/components/mediaPool.vue';

    export default {
        name: 'HomeView',
        components: {
            mediaPool,
        },
        data() {
            return {
                hasLoadedSongs: false,
                songQueue: [],
            }
        },
        methods: {
            loadSongs() {
                
            }
        }
    }
</script>
