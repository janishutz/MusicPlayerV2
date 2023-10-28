<template>
    <div class="fancy-view">
        <span class="material-symbols-outlined fancy-view-song-art" v-if="!song.hasCoverArt">music_note</span>
        <img v-else :src="'http://localhost:8081/getSongCover?filename=' + song.filename" class="fancy-view-song-art">
        <button @click="exit()" id="exit-button"><span class="material-symbols-outlined" style="font-size: 4vh;">close</span></button>
        <div class="controls">
            <div>
                <div style="margin-right: auto;">{{ playbackPosBeautified }}</div>
                <div>{{ durationBeautified }}</div>
            </div>
            <sliderView :active="audioLoaded" :position="playbackPos" :duration="song.duration" @pos="( p ) => { setPos( p ) }"></sliderView>
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
        z-index: 20;
        height: 100vh;
        width: 100vw;
        top: 0;
        left: 0;
        background-color: var( --background-color );
    }

    .fancy-view-song-art {
        height: 40vh;
        width: auto;
        margin-bottom: 5%;
    }
</style>

<script>
    import SliderView from './sliderView.vue';
    export default {
        methods: {
            control ( instruction, value ) {

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