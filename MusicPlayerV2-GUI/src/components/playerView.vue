<template>
    <div>
        <div :class="'player' + ( isShowingFullScreenPlayer ? '' : ' player-hidden' )">
            <!-- TODO: Make cover art of song or otherwise MusicPlayer Logo -->
            <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="logo-player" @click="controlUI( 'show' )">
            <p class="song-name" @click="controlUI( 'show' )">{{ currentlyPlayingSongName }}</p>
            <div class="controls-wrapper">
                <span class="material-symbols-outlined controls next-previous" @click="control( 'previous' )" id="previous">skip_previous</span>
                <span class="material-symbols-outlined controls forward-back" @click="control( 'back' )" :style="'rotate: -' + 360 * clickCountBack + 'deg;'">replay_10</span>
                <span class="material-symbols-outlined controls" v-if="isPlaying" @click="playPause()" id="play-pause">pause</span>
                <span class="material-symbols-outlined controls" v-else @click="playPause()" id="play-pause">play_arrow</span>
                <span class="material-symbols-outlined controls forward-back" @click="control( 'forward' )" :style="'rotate: ' + 360 * clickCountForward + 'deg;'">forward_10</span>
                <span class="material-symbols-outlined controls next-previous" @click="control( 'next' )" id="next">skip_next</span>

                <span class="material-symbols-outlined controls" @click="control( 'repeat' )" style="margin-left: 20px;">repeat{{ repeatMode }}</span>
                <span class="material-symbols-outlined controls" @click="control( 'shuffle' )">shuffle{{ shuffleMode }}</span>
            </div>
        </div>
        <div :class="'playlist-view' + ( isShowingFullScreenPlayer ? '' : ' hidden' )">
            <span class="material-symbols-outlined close-fullscreen" @click="controlUI( 'hide' )">close</span>
            <playlistView></playlistView>
        </div>
    </div>
</template>


<script setup lang="ts">
    // TODO: Handle resize, hide all non-essential controls when below 900px width

    import { ref } from 'vue';
    import playlistView from '@/components/playlistView.vue';
    import MusicKitJSWrapper from '@/scripts/music-player';

    const isPlaying = ref( false );
    const repeatMode = ref( '' );
    const shuffleMode = ref( '' );
    const currentlyPlayingSongName = ref( 'Not playing' );
    const clickCountForward = ref( 0 );
    const clickCountBack = ref( 0 );
    const isShowingFullScreenPlayer = ref( false );
    const player = new MusicKitJSWrapper();

    const emits = defineEmits( [ 'playerStateChange' ] );

    const playPause = () => {
        isPlaying.value = !isPlaying.value;
        // TODO: Execute function on player
        if ( isPlaying.value ) {
            player.control( 'play' );
        } else {
            player.control( 'pause' );
        }
    }

    const control = ( action: string ) => {
        if ( action === 'repeat' ) {
            if ( repeatMode.value === '' ) {
                repeatMode.value = '_on';
            } else if ( repeatMode.value === '_on' ) {
                repeatMode.value = '_one_on';
            } else {
                repeatMode.value = '';
            }
        } else if ( action === 'shuffle' ) {
            if ( shuffleMode.value === '' ) {
                shuffleMode.value = '_on';
            } else {
                shuffleMode.value = '';
            }
        } else if ( action === 'forward' ) {
            clickCountForward.value += 1;
        } else if ( action === 'back' ) {
            clickCountBack.value += 1;
        }
    }


    const controlUI = ( action: string ) => {
        if ( action === 'show' ) {
            isShowingFullScreenPlayer.value = true;
            emits( 'playerStateChange', 'show' );
        } else if ( action === 'hide' ) {
            isShowingFullScreenPlayer.value = false;
            emits( 'playerStateChange', 'hide' );
        }
    }

    const getPlaylists = ( cb: ( data: object ) => void ) => {
        player.getUserPlaylists( cb );
    }

    const logIntoAppleMusic = () => {
        player.logIn();
    }

    const getAuth = (): boolean[] => {
        return player.getAuth();
    }

    const skipLogin = () => {
        player.init();
    }

    defineExpose( {
        logIntoAppleMusic,
        getPlaylists,
        controlUI,
        getAuth,
        skipLogin,
    } );
</script>

<style scoped>
    .player {
        height: 15%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        transition: all 1s;
    }

    .song-name {
        cursor: pointer;
        margin-left: 10px;
        width: 100%;
        height: 100%;
        text-align: justify;
        font-weight: bold;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        flex-direction: row;
    }

    .logo-player {
        cursor: pointer;
        height: 80%;
        margin-left: 30px;
    }

    .playlist-view {
        height: 15%;
        overflow: scroll;
    }

    .player-hidden {
        height: 100%;
    }

    .hidden {
        height: 0%;
    }

    .controls {
        cursor: pointer;
        font-size: 1.75rem;
        user-select: none;
        transition: all 0.5s ease-in-out;
    }

    .controls-wrapper {
        margin-right: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: nowrap;
    }

    #play-pause {
        font-size: 2.5rem;
    }

    .controls:hover {
        transform: scale(1.25);
    }

    .forward-back {
        transition: all 0.4s ease-in-out;
    }

    .next-previous {
        transform: translateX(0px);
        transition: all 0s;
    }

    .next-previous:hover {
        transform: scale(1);
    }

    #previous:active {
        transform: translateX(-10px);
    }

    #next:active {
        transform: translateX(10px);
    }

    .close-fullscreen {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 2.5rem;
        color: var( --primary-color );
        cursor: pointer;
        transition: all 0.5s ease-in-out;
    }

    .close-fullscreen:hover {
        transform: scale( 1.25 );
    }

    .hidden .close-fullscreen {
        display: none;
    }
</style>