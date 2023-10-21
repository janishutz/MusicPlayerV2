<template>
    <div class="media-pool">
        <div v-if="hasLoadedSongs" style="width: 100%;" class="song-list-wrapper">
            <div v-for="song in songQueue" class="song-list">
                <span class="material-symbols-outlined song-image" v-if="!loadCoverArtPreview || !song.hasCoverArt">music_note</span>
                <img v-else :src="'http://localhost:8081/getSongCover?filename=' + song.filename" class="song-image">
                <span class="material-symbols-outlined play-icon" @click="play( song )">play_arrow</span>
                <h3>{{ song.title }}</h3>
            </div>
        </div>
        <div v-else-if="isLoadingSongs" class="no-songs">
            <h3>Loading songs...</h3>
            <p>Analyzing metadata...</p>
            <span class="material-symbols-outlined loading-spinner">autorenew</span>
        </div>
        <div v-else class="no-songs">
            <h3>No songs loaded</h3>
            <button @click="loadSongs()">Load songs</button>
        </div>
    </div>
</template>

<style>
    .loading-spinner {
        animation: spin 2s infinite linear;
    }
    
    @keyframes spin {
        from {
            transform: rotate( 0deg );
        }
        to {
            transform: rotate( 720deg );
        }
    }

    .media-pool {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .no-songs {
        height: 50vh;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .song-list-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .song-list {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        width: 80%;
        margin: 2px;
        padding: 15px;
        border: 1px var( --border-color ) solid;
    }

    .song-list h3 {
        margin: 0;
        display: block;
        margin-left: 10px;
        margin-right: auto;
    }

    .song-list .song-image {
        width: 5vw;
        height: 5vw;
        object-fit: cover;
        object-position: center;
        font-size: 5vw;
    }

    .play-icon {
        display: none;
        width: 5vw;
        height: 5vw;
        object-fit: cover;
        object-position: center;
        font-size: 5vw;
        cursor: pointer;
    }

    .song-list:hover .song-image {
        display: none;
    }

    .song-list:hover .play-icon {
        display: block;
    }
</style>

<script>
    export default {
        name: 'HomeView',
        data() {
            return {
                hasLoadedSongs: false,
                isLoadingSongs: false,
                loadCoverArtPreview: true,
                songQueue: [],
                loadedDirs: [],
                allowedFiletypes: [ '.mp3', '.wav' ],
                currentlyPlaying: '',
            }
        },
        methods: {
            getLoadedDirs () {

            },
            loadSongs() {
                this.isLoadingSongs = true;
                fetch( 'http://localhost:8081/openSongs' ).then( res => {
                    if ( res.status === 200 ) {
                        res.json().then( json => {
                            this.loadedDirs = json.data;
                            this.indexFiles();
                        } );
                    }
                } );
            },
            indexFiles () {
                for ( let dir in this.loadedDirs ) {
                    fetch( 'http://localhost:8081/indexDirs?dir=' + this.loadedDirs[ dir ] + ( this.loadCoverArtPreview ? '&coverart=true' : '' ) ).then( res => {
                        if ( res.status === 200 ) {
                            res.json().then( json => {
                                for ( let song in json ) {
                                    this.songQueue.push( json[ song ] );
                                }
                                this.isLoadingSongs = false;
                                this.hasLoadedSongs = true;
                            } );
                        }
                    } );
                }
            },
            play( song ) {
                this.$emit( 'playing', song );
            }
        }
    }
</script>