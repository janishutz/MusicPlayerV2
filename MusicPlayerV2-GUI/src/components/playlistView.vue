<template>
    <div>
        <h1>Playlist</h1>
        <input type="file" multiple accept="audio/*" id="more-songs">
        <button @click="addNewSongs()">Load local songs</button>
        <p v-if="!hasSelectedSongs">Please select at least one song to proceed</p>
        <div class="playlist-box" id="pl-box">
            <!-- TODO: Allow sorting -->
            <!-- TODO: Allow adding more songs with search on Apple Music or loading from local disk -->
            <div class="song" v-for="song in computedPlaylist" v-bind:key="song.id" 
                :class="( song.id === ( $props.playlist ? $props.playlist [ $props.currentlyPlaying ?? 0 ].id : '' ) && isPlaying ? 'playing' : ' not-playing' ) 
                + ( ( !isPlaying && ( song.id === ( $props.playlist ? $props.playlist [ $props.currentlyPlaying ?? 0 ].id : '' ) ) ) ? ' active-song' : '' )">
                <img :src="song.cover" alt="Song cover" class="song-cover">
                <div v-if="song.id === ( $props.playlist ? $props.playlist [ $props.currentlyPlaying ?? 0 ].id : '' ) && $props.isPlaying" class="playing-symbols">
                    <div class="playing-symbols-wrapper">
                        <div class="playing-bar" id="bar-1"></div>
                        <div class="playing-bar" id="bar-2"></div>
                        <div class="playing-bar" id="bar-3"></div>
                    </div>
                </div>
                <span class="material-symbols-outlined play-icon" @click="control( 'play' )" v-if="song.id === ( $props.playlist ? $props.playlist [ $props.currentlyPlaying ?? 0 ].id : '' )">play_arrow</span>
                <span class="material-symbols-outlined play-icon" @click="play( song.id )" v-else>play_arrow</span>
                <span class="material-symbols-outlined pause-icon" @click="control( 'pause' )">pause</span>
                <span class="material-symbols-outlined move-icon" @click="moveSong( song.id, 'up' )" title="Move song up" v-if="canBeMoved( 'up', song.id )">arrow_upward</span>
                <span class="material-symbols-outlined move-icon" @click="moveSong( song.id, 'down' )" title="Move song down" v-if="canBeMoved( 'down', song.id )">arrow_downward</span>
                <h3 class="song-title">{{ song.title }}</h3>
                <p class="playing-in">{{ getTimeUntil( song ) }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { ReadFile, Song } from '@/scripts/song';
    import { computed, ref } from 'vue';

    const props = defineProps( { 
        'playlist': {
            default: [],
            required: true,
            type: Array<Song>
        },
        'currentlyPlaying': {
            default: 0,
            required: true,
            type: Number,
        },
        'isPlaying': {
            default: true,
            required: true,
            type: Boolean,
        },
        'pos': {
            default: 0,
            required: false,
            type: Number,
        }
    } );
    const hasSelectedSongs = ref( true );

    const computedPlaylist = computed( () => {
        let pl: Song[] = [];
        // ( document.getElementById( 'pl-box' ) as HTMLDivElement ).scrollTo( { behavior: 'smooth', top: 0 } );
        for ( let i = props.currentlyPlaying; i < props.playlist.length; i++ ) {
            pl.push( props.playlist[ i ] );
        }
        return pl;
    } );

    const canBeMoved = computed( () => {
        return ( direction: movementDirection, songID: string ): boolean => {
            let id = 0;
            for ( let song in props.playlist ) {
                if ( props.playlist[ song ].id === songID ) {
                    id = parseInt( song );
                    break;
                }
            }
            if ( direction === 'up' ) {
                if ( props.currentlyPlaying + 1 === id || props.currentlyPlaying === id ) {
                    return false;
                }
                return true;
            } else {
                if ( id === props.playlist.length - 1 || props.currentlyPlaying === id ) {
                    return false;
                }
                return true;
            }
        }
    } )

    const getTimeUntil = computed( () => {
        return ( song: Song ) => {
            let timeRemaining = 0;
            for ( let i = props.currentlyPlaying; i < Object.keys( props.playlist ).length; i++ ) {
                if ( props.playlist[ i ] == song ) {
                    break;
                }
                timeRemaining += props.playlist[ i ].duration;
            }
            if ( props.isPlaying ) {
                if ( timeRemaining === 0 ) {
                    return 'Currently playing';
                } else {
                    return 'Playing in less than ' + Math.ceil( timeRemaining / 60 - props.pos / 60 )  + 'min';
                }
            } else {
                if ( timeRemaining === 0 ) {
                    return 'Plays next';
                } else {
                    return 'Playing less than ' + Math.ceil( timeRemaining / 60 - props.pos / 60 )  + 'min after starting to play';
                }
            }
        }
    } );


    const control = ( action: string ) => {
        emits( 'control', action );
    }

    const play = ( song: string ) => {
        emits( 'play-song', song );
    }

    const addNewSongs = () => {
        // TODO: Also allow loading Apple Music songs
        const fileURLList: ReadFile[] = [];
        const allFiles = ( document.getElementById( 'pl-loader' ) as HTMLInputElement ).files ?? [];
        if ( allFiles.length > 0 ) {
            hasSelectedSongs.value = true;
            for ( let file = 0; file < allFiles.length; file++ ) {
                fileURLList.push( { 'url': URL.createObjectURL( allFiles[ file ] ), 'filename': allFiles[ file ].name } );
            }
            emits( 'add-new-songs', fileURLList );
        } else {
            hasSelectedSongs.value = false;
        }
    }

    type movementDirection = 'up' | 'down';
    const moveSong = ( songID: string, direction: movementDirection ) => {
        let newSongPos = 0;
        let hasFoundSongToMove = false;
        for ( let el in props.playlist ) {
            if ( props.playlist[ el ].id === songID ) {
                const currPos = parseInt( el );
                newSongPos = currPos + ( direction === 'up' ? -1 : 1 );
                hasFoundSongToMove = true;
                break;
            }
        }
        if ( hasFoundSongToMove ) {
            emits( 'playlist-reorder', { 'songID': songID, 'newPos': newSongPos } );
        }
    }

    const emits = defineEmits( [ 'play-song', 'control', 'playlist-reorder', 'add-new-songs' ] );
</script>

<style scoped>
    .playlist-box {
        height: calc( 100% - 100px );
        width: 100%;
        overflow: scroll;
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .song {
        border: solid var( --primary-color ) 1px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        width: 80%;
        margin: 2px;
        padding: 1vh;
        position: relative;
    }

    .song .song-cover {
        width: 5vw;
        height: 5vw;
        object-fit: cover;
        object-position: center;
        font-size: 5vw;
    }

    .song-title {
        margin-left: 10px;
        margin-right: auto;
    }

    .playing-symbols {
        position: absolute;
        left: 1vh;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        margin: 0;
        width: 5vw;
        height: 5vw;
        background-color: rgba( 0, 0, 0, 0.6 );
    }

    .playing-symbols-wrapper {
        width: 4vw;
        height: 5vw;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
    }

    .playing-bar {
        height: 60%;
        background-color: white;
        width: 10%;
        border-radius: 50px;
        margin: auto;
    }

    #bar-1 {
        animation: music-playing 0.9s infinite ease-in-out;
    }

    #bar-2 {
        animation: music-playing 0.9s infinite ease-in-out;
        animation-delay: 0.3s;
    }

    #bar-3 {
        animation: music-playing 0.9s infinite ease-in-out;
        animation-delay: 0.6s;
    }

    @keyframes music-playing {
        0% {
            transform: scaleY( 1 );
        }
        50% {
            transform: scaleY( 0.5 );
        }
        100% {
            transform: scaleY( 1 );
        }
    }

    .play-icon, .pause-icon {
        display: none;
        width: 5vw;
        height: 5vw;
        object-fit: cover;
        object-position: center;
        font-size: 5vw;
        cursor: pointer;
        user-select: none;
    }

    .playing:hover .pause-icon {
        display: block;
    }

    .playing:hover .playing-symbols {
        display: none;
    }

    .song:hover .song-cover {
        display: none;
    }

    .not-playing:hover .play-icon {
        display: block;
    }

    .active-song .pause-icon {
        display: block;
    }

    .active-song.not-playing .song-cover {
        display: none;
    }

    .active-song .song-image, .active-song:hover .pause-icon {
        display: none;
    }

    .move-icon {
        font-size: 1.5rem;
        cursor: pointer;
        user-select: none;
    }
</style>