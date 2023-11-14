<template>
    <div class="home" v-if="musicOrigin === 'local'">
        <div class="top-bar">
            <img src="@/assets/logo.png" alt="logo" class="logo">
            <div class="player-wrapper">
                <Player ref="player" @update="( info ) => { handleUpdates( info ) }"></Player>
            </div>
        </div>
        <div class="pool-wrapper">
            <mediaPool @com="( info ) => { handleCom( info ) }" ref="pool"></mediaPool>
        </div>
    </div>
    <div v-else-if="musicOrigin === 'AppleMusic'" class="home">
        <AppleMusic></AppleMusic>
    </div>
</template>

<style>
    .home {
        width: 100%;
        height: 100%;
    }

    .pool-wrapper {
        height: 84vh;
        margin-top: 16vh;
    }

    .top-bar {
        margin-left: auto;
        margin-right: auto;
        position: fixed;
        z-index: 8;
        width: 99%;
        height: 15vh;
        display: flex;
        align-items: center;
        flex-direction: row;
        border: var( --primary-color ) 2px solid;
        background-color: var( --background-color );
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
        height: 13vh;
        margin-left: 3%;
        margin-right: auto;
    }
</style>

<script>
    import AppleMusic from '@/components/appleMusic.vue';
    import mediaPool from '@/components/mediaPool.vue';
    import Player from '@/components/player.vue';

    export default {
        name: 'HomeView',
        components: {
            mediaPool,
            Player,
            AppleMusic,
        },
        data() {
            return {
                hasLoadedSongs: false,
                songQueue: [],
                // musicOrigin: 'local',
                musicOrigin: 'AppleMusic',
            }
        },
        methods: {
            handleCom ( data ) {
                if ( data.type === 'startPlayback' ) {
                    this.$refs.player.play( data.song, data.autoplay === undefined ? true : data.autoplay );
                } else {
                    this.$refs.player.control( data.type );
                }
            },
            handleUpdates ( data ) {
                this.$refs.pool.update( data );
            },
        }
    }
</script>
