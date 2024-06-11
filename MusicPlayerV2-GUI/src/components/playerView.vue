<template>
    <div>
        <div :class="'player' + ( $props.isShowingFullScreenPlayer ? '' : ' player-hidden' )">
            <!-- TODO: Make cover art of song or otherwise MusicPlayer Logo -->
            <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="logo-player">
            <p class="song-name">{{ currentlyPlayingSongName }}</p>
            <div class="controls-wrapper">
                <span class="material-symbols-outlined controls" @click="control( 'previous' )">skip_previous</span>
                <span class="material-symbols-outlined controls" @click="control( '10s-back' )">replay_10</span>
                <span class="material-symbols-outlined controls" v-if="!isPlaying" @click="playPause()" id="play-pause">pause</span>
                <span class="material-symbols-outlined controls" v-else @click="playPause()" id="play-pause">play_arrow</span>
                <span class="material-symbols-outlined controls" @click="control( '10s-forward' )">forward_10</span>
                <span class="material-symbols-outlined controls" @click="control( 'next' )">skip_next</span>

                <span class="material-symbols-outlined controls" @click="control( 'repeat' )" style="margin-left: 20px;">repeat{{ repeatMode }}</span>
                <span class="material-symbols-outlined controls" @click="control( 'shuffle' )">shuffle{{ shuffleMode }}</span>
            </div>
        </div>
        <playlistView :class="'playlist-view' + ( $props.isShowingFullScreenPlayer ? '' : ' hidden' )"></playlistView>
    </div>
</template>


<script setup lang="ts">
    // TODO: Handle resize, hide all non-essential controls when below 900px width

    import { ref } from 'vue';
    import playlistView from '@/components/playlistView.vue';

    const isPlaying = ref( false );
    const repeatMode = ref( '' );
    const shuffleMode = ref( '' );
    const currentlyPlayingSongName = ref( 'Not playing' );

    const playPause = () => {
        isPlaying.value = !isPlaying.value;
        // TODO: Execute function on player
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
        }
    }


    const props = defineProps( {
        'isShowingFullScreenPlayer': {
            'default': false,
            'required': true,
            'type': Boolean
        }
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
    }

    .song-name {
        margin-left: 10px;
        margin-right: auto;
        font-weight: bold;
        font-size: 1.25rem;
    }

    .logo-player {
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
</style>