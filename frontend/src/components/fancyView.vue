<template>
    <div class="fancy-view">
        <span class="material-symbols-outlined fancy-view-song-art" v-if="!song.hasCoverArt">music_note</span>
        <img v-else-if="song.hasCoverArt && song.coverArtOrigin === 'api'" :src="song.coverArtURL" class="fancy-view-song-art">
        <img v-else :src="'http://localhost:8081/getSongCover?filename=' + song.filename" class="fancy-view-song-art">
        <button @click="exit()" id="exit-button"><span class="material-symbols-outlined" style="font-size: 4vh;">close</span></button>
        <div class="controls-wrapper">
            <div class="song-info">
                <h3>{{ song.title }}</h3>
                <p>{{ song.artist }}</p>
            </div>
            <div class="controls">
                <span class="material-symbols-outlined control-icon" @click="control( 'previous' )">skip_previous</span>
                <span class="material-symbols-outlined control-icon" @click="control( 'replay10' )">replay_10</span>
                <span class="material-symbols-outlined control-icon play-pause" v-if="!isPlaying" @click="control( 'play' )">play_arrow</span>
                <span class="material-symbols-outlined control-icon play-pause" v-else-if="isPlaying" @click="control( 'pause' )">pause</span>
                <span class="material-symbols-outlined control-icon" @click="control( 'forward10' )">forward_10</span>
                <span class="material-symbols-outlined control-icon" @click="control( 'next' )">skip_next</span>
            </div>
            <div class="slider-wrapper">
                <sliderView :active="true" :position="playbackPos" :duration="song.duration" @pos="( p ) => { setPos( p ) }"
                    name="fancy" class="slider"></sliderView>
                <div class="playback-pos-info">
                    <div style="margin-right: auto;">{{ playbackPosBeautified }}</div>
                    <div>{{ durationBeautified }}</div>
                </div>
            </div>
            <div class="shuffle-repeat-wrapper">
                <span class="material-symbols-outlined control-icon" v-if="!shuffle" @click="control( 'shuffleOn' )">shuffle</span>
                <span class="material-symbols-outlined control-icon" v-else @click="control( 'shuffleOff' )">shuffle_on</span>
                <span class="material-symbols-outlined control-icon" v-if="repeatMode === 'off'" @click="control( 'repeatOne' )">repeat</span>
                <span class="material-symbols-outlined control-icon" v-else-if="repeatMode === 'one'" @click="control( 'repeatAll' )">repeat_one_on</span>
                <span class="material-symbols-outlined control-icon" v-else-if="repeatMode === 'all'" @click="control( 'repeatOff' )">repeat_on</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
    #exit-button {
        position: fixed;
        right: 1vw;
        top: 1vw;
        background-color: rgba( 0,0,0,0 );
        border: none;
        cursor: pointer;
        color: var( --primary-color );
    }

    .fancy-view {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        flex-direction: column;
        z-index: 20;
        height: 100vh;
        width: 100vw;
        top: 0;
        left: 0;
        background-color: var( --background-color );
    }

    .controls-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .slider-wrapper {
        position: relative;
        margin-top: 40px;
        width: 40vh;
        margin-bottom: 20px
    }

    .fancy-view-song-art {
        height: 40vh;
        width: 40vh;
        object-fit: cover;
        object-position: center;
        margin-bottom: 20px;
        font-size: 40vh;
    }

    .controls {
        width: 50vw;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .control-icon {
        cursor: pointer;
        font-size: 3vh;
        user-select: none;
    }

    .play-pause {
        font-size: 5vh;
    }

    .playback-pos-info {
        display: flex;
        flex-direction: row;
        width: 98%;
        margin-left: 1%;
        position: absolute;
        bottom: 17px;
        left: 0;
    }

    .shuffle-repeat-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>

<script>
    import SliderView from './sliderView.vue';
    export default {
        methods: {
            control ( instruction ) {
                this.$emit( 'control', instruction );
            },
            setPos ( pos ) {
                this.$emit( 'posUpdate', pos );
            },
            exit() {
                this.$emit( 'control', 'exitFancyView' );
            }
        },
        components: {
            SliderView,
        },
        props: {
            song: {
                type: Object,
            },
            playbackPos: {
                type: Number,
            },
            playbackPosBeautified: {
                type: String,
            },
            durationBeautified: {
                type: String,
            },
            shuffle: {
                type: Boolean,
            },
            isPlaying: {
                type: Boolean,
            },
            repeatMode: {
                type: String,
            }
        }
    }
</script>