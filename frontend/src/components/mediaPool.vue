<template>
    <div class="media-pool" :style="isShowingFancyView ? 'overflow: hidden;' : ''">
        <div v-if="hasLoadedSongs" style="width: 100%;" class="song-list-wrapper">
            <div v-for="song in songQueue" class="song-list" :class="[ isPlaying ? ( currentlyPlaying === song.filename ? 'playing': 'not-playing' ) : 'not-playing', !isPlaying && currentlyPlaying === song.filename ? 'active-song': undefined ]">
                <span class="material-symbols-outlined song-image" v-if="!loadCoverArtPreview || !song.hasCoverArt">music_note</span>
                <img v-else :src="'http://localhost:8081/getSongCover?filename=' + song.filename" class="song-image">
                <div v-if="currentlyPlaying === song.filename && isPlaying" class="playing-symbols">
                    <div class="playing-symbols-wrapper">
                        <div class="playing-bar" id="bar-1"></div>
                        <div class="playing-bar" id="bar-2"></div>
                        <div class="playing-bar" id="bar-3"></div>
                    </div>
                </div>
                <span class="material-symbols-outlined play-icon" @click="play( song )">play_arrow</span>
                <span class="material-symbols-outlined pause-icon" @click="pause( song )">pause</span>
                <h3>{{ song.title }}</h3>
            </div>
        </div>
        <div v-else-if="isLoadingSongs" class="no-songs">
            <h3>Loading songs...</h3>
            <p>Analyzing metadata...</p>
            <span class="material-symbols-outlined loading-spinner">autorenew</span>
        </div>
        <div v-else-if="errorOccurredLoading" class="no-songs">
            <h3>This directory does not exist!</h3>
            <button @click="loadSongs()">Load songs</button>
        </div>
        <div v-else class="no-songs">
            <h3>No songs loaded</h3>
            <button @click="loadSongs()">Load songs</button>
        </div>
    </div>
</template>

<style>
    .playing-symbols {
        position: absolute;
        left: 9.95vw;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
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
        background-color: var( --primary-color );
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
        padding: 1vh;
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

    .song-list:hover .song-image {
        display: none;
    }

    .not-playing:hover .play-icon {
        display: block;
    }

    .active-song .pause-icon {
        display: block;
    }

    .active-song .song-image, .active-song:hover .pause-icon {
        display: none;
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
                allSongs: [],
                songQueue: [],
                loadedDirs: [],
                allowedFiletypes: [ '.mp3', '.wav' ],
                currentlyPlaying: '',
                isPlaying: false,
                songPos: 0,
                repeat: false,
                isShowingFancyView: false,
                errorOccurredLoading: false,
            }
        },
        methods: {
            update( status ) {
                if ( status.type === 'playback' ) {
                    this.isPlaying = status.status;
                } else if ( status.type === 'next' ) {
                    if ( this.songPos < this.songQueue.length - 1 ) {
                        this.songPos += 1;
                        this.queueHandler( 'load' );
                    } else {
                        this.songPos = 0;
                        if ( this.repeat ) {
                            this.queueHandler( 'load' );
                        } else {
                            this.isPlaying = false;
                            this.currentlyPlaying = '';
                            this.$emit( 'com', { 'type': 'startPlayback', 'song': this.songQueue[ 0 ], 'autoplay': false } );
                            this.$emit( 'com', { 'type': 'pause' } );
                        }
                    }
                } else if ( status.type === 'previous' ) {
                    if ( this.songPos > 0 ) {
                        this.songPos -= 1;
                    } else {
                        this.songPos = this.songQueue.length - 1;
                    }
                    this.queueHandler( 'load' );
                } else if ( status.type === 'shuffle' ) {
                    this.queueHandler( 'shuffle' );
                } else if ( status.type === 'shuffleOff' ) {
                    this.queueHandler( 'shuffleOff' );
                } else if ( status.type === 'repeat' ) {
                    this.repeat = true;
                } else if ( status.type === 'repeatOff' ) {
                    this.repeat = false;
                } else if ( status.type === 'fancyView' ) {
                    this.isShowingFancyView = status.status;
                }
            },
            queueHandler ( command ) {
                if ( command === 'load' ) {
                    this.play( this.songQueue[ this.songPos ] );
                } else if ( command === 'shuffle' ) {
                    let processArray = JSON.parse( JSON.stringify( this.allSongs ) );
                    let newOrder = [];
                    for ( let i = 0; i < this.allSongs.length; i++ ) {
                        let randNum = Math.floor( Math.random() * this.allSongs.length );
                        while ( newOrder.includes( randNum ) ) {
                            randNum = Math.floor( Math.random() * this.allSongs.length );
                        }
                        newOrder.push( randNum );
                    }
                    this.songQueue = [];
                    for ( let el in newOrder ) {
                        this.songQueue.push( processArray[ newOrder[ el ] ] );
                    }
                } else if ( command === 'shuffleOff' ) {
                    this.songQueue = JSON.parse( JSON.stringify( this.allSongs ) );
                }
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
                            this.errorOccurredLoading = false;
                            res.json().then( json => {
                                for ( let song in json ) {
                                    this.songQueue.push( json[ song ] );
                                    this.allSongs.push( json[ song ] );
                                }
                                this.queueHandler();
                                this.isLoadingSongs = false;
                                this.hasLoadedSongs = true;
                                this.$emit( 'com', { 'type': 'songsLoaded' } );
                            } );
                        } else if ( res.status === 404 ) {
                            this.isLoadingSongs = false;
                            this.errorOccurredLoading = true;
                        }
                    } );
                }
            },
            play( song ) {
                if ( song.filename === this.currentlyPlaying ) {
                    this.$emit( 'com', { 'type': 'play', 'song': song } );
                } else {
                    for ( let s in this.songQueue ) {
                        if ( this.songQueue[ s ][ 'filename' ] === song.filename ) {
                            this.songPos = parseInt( s );
                        }
                    }
                    this.$emit( 'com', { 'type': 'startPlayback', 'song': song } );
                }
                this.currentlyPlaying = song.filename;
                this.update( { 'type': 'playback', 'status': true } );
            },
            pause( song ) {
                this.update( { 'type': 'playback', 'status': false } );
                this.$emit( 'com', { 'type': 'pause', 'song': song } );
            },
        }
    }
</script>