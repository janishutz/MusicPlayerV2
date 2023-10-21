<template>
    <div class="player">
        <div class="controls">
            <div v-if="audioLoaded">
                <span class="material-symbols-outlined control-icon" v-if="!isPlaying" @click="control( 'play' )">play_arrow</span>
                <span class="material-symbols-outlined control-icon" v-else @click="control( 'pause' )">pause</span>
            </div>
            <span class="material-symbols-outlined control-icon" style="cursor: default;" v-else>play_disabled</span>
        </div>
        <div class="song-info">
            <audio v-if="audioLoaded" :src="'http://localhost:8081/getSongFile?filename=' + playingSong.filename" id="music-player"></audio>
        </div>
    </div>
</template>

<style>
    .song-info {
        background-color: var( --accent-background );
        height: 80%;
        width: 50%;
    }

    .control-icon {
        cursor: pointer;
    }
</style>

<script>
export default {
    data() {
        return {
            playingSong: {},
            audioLoaded: false,
            isPlaying: false,
        }
    },
    methods: {
        play( song ) {
            this.playingSong = song;
            this.audioLoaded = true;
            this.init();
        },
        init() {
            setTimeout( () => {
                document.getElementById( 'music-player' ).play();
                this.isPlaying = true;
            }, 300 );
        },
        control( action ) {
            if ( document.getElementById( 'music-player' ) ) {
                if ( action === 'play' ) {
                    document.getElementById( 'music-player' ).play();
                    this.isPlaying = true;
                } else if ( action === 'pause' ) {
                    document.getElementById( 'music-player' ).pause();
                    this.isPlaying = false;
                }
            }
        }
    }
}
</script>