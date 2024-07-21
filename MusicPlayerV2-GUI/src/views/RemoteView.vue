<template>
    <div>
        <div class="info">Designed and developed by Janis Hutz <a href="https://janishutz.com" target="_blank" style="text-decoration: none; color: white;">https://janishutz.com</a></div>
        <div class="remote-view">
            <div v-if="hasLoaded && !showCouldNotFindRoom" style="width: 100%">
                <div class="current-song-wrapper">
                    <img v-if="playlist[ playingSong ]" :src="playlist[ playingSong ].cover" class="fancy-view-song-art" id="current-image" crossorigin="anonymous">
                    <span v-else class="material-symbols-outlined fancy-view-song-art">music_note</span>
                    <div class="current-song">
                        <h1 style="margin-bottom: 5px;">{{ playlist[ playingSong ] ? playlist[ playingSong ].title : 'Not playing' }}</h1>
                        <p>{{ playlist[ playingSong ] ? playlist[ playingSong ].artist : '' }}</p>
                        <p class="additional-info" v-if="playlist[ playingSong ] ? ( playlist[ playingSong ].additionalInfo !== '' ) : false">{{ playlist[ playingSong ] ? playlist[ playingSong ].additionalInfo : '' }}</p>
                        <progress max="1000" id="progress" :value="progressBar"></progress>
                    </div>
                </div>
                <div class="song-list-wrapper">
                    <div v-for="song in songQueue" v-bind:key="song.id" class="song-list">
                        <div class="song-details-wrapper">
                            <h3>{{ song.title }}</h3>
                            <p>{{ song.artist }}</p>
                        </div>
                        <div class="time-until">
                            {{ getTimeUntil( song.id ) }}
                        </div>
                    </div>
                    <!-- <img :src="" alt=""> -->
                </div>
            </div>
            <div v-else-if="!hasLoaded && !showCouldNotFindRoom">
                <h1>Loading...</h1>
            </div>
            <div v-else style="max-width: 80%;">
                <span class="material-symbols-outlined" style="font-size: 4rem;">wifi_off</span>
                <h1>Couldn't connect!</h1>
                <p>There does not appear to be a share with the specified name, or an error occurred when connecting.</p>
                <p>You may <a href="">reload</a> the page to try again!</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import SocketConnection from '@/scripts/connection';
    import type { Song } from '@/scripts/song';
    import { computed, ref, type Ref } from 'vue';

    const isPlaying = ref( false );
    const playlist: Ref<Song[]> = ref( [] );
    const pos = ref( 0 );
    const playingSong = ref( 0 );
    const progressBar = ref( 0 );
    const hasLoaded = ref( false );
    const showCouldNotFindRoom = ref( false );
    const playbackStart = ref( 0 );
    let timeTracker = 0;

    const conn = new SocketConnection();

    conn.connect().then( d => {
        playlist.value = d.playlist;
        isPlaying.value = d.playbackStatus;
        playingSong.value = d.playlistIndex;
        playbackStart.value = d.playbackStart;
        if ( isPlaying.value ) {
            startTimeTracker();
        }
        pos.value = ( new Date().getTime() - parseInt( d.playbackStart ) ) / 1000;
        progressBar.value = ( pos.value / ( playlist.value[ playingSong.value ] ? playlist.value[ playingSong.value ].duration : 1 ) ) * 1000;
        hasLoaded.value = true;
        conn.registerListener( 'playlist', ( data ) => {
            playlist.value = data;
        } );

        conn.registerListener( 'playback', ( data ) => {
            isPlaying.value = data;
            if ( isPlaying.value ) {
                startTimeTracker();
            } else {
                stopTimeTracker();
            }
        } );

        conn.registerListener( 'playback-start', ( data ) => {
            playbackStart.value = data;
            pos.value = ( new Date().getTime() - parseInt( data ) ) / 1000;
        } );

        conn.registerListener( 'playlist-index', ( data ) => {
            playingSong.value = parseInt( data );
        } );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        conn.registerListener( 'delete-share', ( _ ) => {
            alert( 'This share was just deleted. It is no longer available. The page will reload automatically to try and re-establish connection!' );
            conn.disconnect();
            location.reload();
        } );
    } ).catch( e => {
        console.error( e );
        showCouldNotFindRoom.value = true;
    } );

    const songQueue = computed( () => {
        let ret: Song[] = [];
        let pos = 0;
        for ( let song in playlist.value ) {
            if ( pos >= playingSong.value ) {
                ret.push( playlist.value[ song ] );
            }
            pos += 1;
        }
        return ret;
    } );

    // TODO: Handle disconnect from updater (=> have it disconnect)

    const getTimeUntil = computed( () => {
        return ( song: string ) => {
            let timeRemaining = 0;
            for ( let i = playingSong.value; i < Object.keys( playlist.value ).length - 1; i++ ) {
                if ( playlist.value[ i ].id == song ) {
                    break;
                }
                timeRemaining += playlist.value[ i ].duration;
            }
            if ( isPlaying.value ) {
                if ( timeRemaining === 0 ) {
                    return 'Currently playing';
                } else {
                    return 'Playing in less than ' + Math.ceil( timeRemaining / 60 - pos.value / 60 )  + 'min';
                }
            } else {
                if ( timeRemaining === 0 ) {
                    return 'Plays next';
                } else {
                    return 'Playing less than ' + Math.ceil( timeRemaining / 60 - pos.value / 60 )  + 'min after starting to play';
                }
            }
        }
    } );

    const startTimeTracker = () => {
        try {
            clearInterval( timeTracker );
        } catch ( err ) { /* empty */ }
        timeTracker = setInterval( () => {
            pos.value = ( new Date().getTime() - playbackStart.value ) / 1000;
            progressBar.value = ( pos.value / playlist.value[ playingSong.value ].duration ) * 1000;
            if ( isNaN( progressBar.value ) ) {
                progressBar.value = 0;
            }
        }, 100 );
    }
    
    const stopTimeTracker = () => {
        clearInterval( timeTracker );
    }
</script>

<style>
    #themeSelector {
        display: none;
    }
</style>

<style scoped>
    .remote-view {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        text-align: justify;
        background-color: rgb(2, 16, 61);
        color: white;
        min-height: 100vh;
    }

    .loaded {
        display: block;
    }

    .loading {
        display: flex;
        height: 100vh;
    }

    .playing-symbols {
        position: absolute;
        left: 10vw;
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

    .song-list-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        margin-bottom: 5%;
    }

    .song-list {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 80%;
        margin: 2px;
        padding: 1vh;
        border: 1px white solid;
        background-color: rgba( 0, 0, 0, 0.4 );
        border-radius: 10px;
    }

    .song-details-wrapper {
        margin: 0;
        display: block;
        margin-left: 10px;
        margin-right: auto;
        width: 65%;
        text-align: justify;
    }

    .pause-icon {
        width: 5vw;
        height: 5vw;
        object-fit: cover;
        object-position: center;
        font-size: 5vw !important;
        user-select: none;
    }

    .current-song-wrapper {
        display: flex;
        align-items: center;
        flex-direction: column;
        width: 100%;
        margin-bottom: 2%;
        margin-top: 1%;
    }

    .current-song {
        display: flex;
        align-items: center;
        flex-direction: column;
        margin-top: 1vh;
        padding: 1vh;
        max-width: 80%;
        text-align: center;
        background-color: rgba( 0, 0, 0, 0.4 );
        border-radius: 10px;
    }

    .fancy-view-song-art {
        height: 30vh;
        width: 30vh;
        object-fit: cover;
        object-position: center;
        margin-bottom: 10px;
        font-size: 30vh !important;
        border-radius: 30px;
    }

    #app {
        background-color: rgba( 0, 0, 0, 0 );
    }

    #progress, #progress::-webkit-progress-bar {
        background-color: rgb(82, 82, 82);
        color: rgb(82, 82, 82);
        width: 30vw;
        height: 10px;
        border: none;
        border-radius: 0px;
        accent-color: white;
        -webkit-appearance: none;
        appearance: none;
        border-radius: 10px;
        margin-bottom: 5px;
    }

    #progress::-moz-progress-bar {
        background-color: white;
    }

    #progress::-webkit-progress-value {
        background-color: white !important;
    }

    .mode-selector-wrapper {
        opacity: 0;
        position: fixed;
        right: 0.5%;
        top: 0.5%;
        padding: 0.5%;
    }

    .mode-selector-wrapper:hover {
        opacity: 1;
    }

    .additional-info {
        font-size: 250%;
        margin: 0;
        font-weight: bolder;
    }

    .info {
        position: fixed;
        font-size: 12px;
        transform: rotate(270deg);
        left: -150px;
        margin: 0;
        padding: 0;
        top: 50%;
        color: white;
    }

    .time-until {
        width: 30%;
        text-align: end;
    }
</style>