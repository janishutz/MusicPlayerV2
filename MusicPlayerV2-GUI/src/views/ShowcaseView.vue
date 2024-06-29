<template>
    <div>
        <div class="info">Designed and developed by Janis Hutz <a href="https://janishutz.com" target="_blank" style="text-decoration: none; color: white;">https://janishutz.com</a></div>
        <div class="remote-view">
            <div v-if="hasLoaded && !showCouldNotFindRoom" class="showcase-wrapper">
                <div class="current-song-wrapper">
                    <img v-if="playlist[ playingSong ]" :src="playlist[ playingSong ].cover" class="fancy-view-song-art" id="current-image" crossorigin="anonymous">
                    <span v-else class="material-symbols-outlined">music_note</span>
                    <div class="current-song">
                        <progress max="1000" id="progress" :value="progressBar"></progress>
                        <h1>{{ playlist[ playingSong ] ? playlist[ playingSong ].title : 'Not playing' }}</h1>
                        <p class="additional-info" v-if="playlist[ playingSong ] ? ( playlist[ playingSong ].additionalInfo !== '' ) : false">{{ playlist[ playingSong ] ? playlist[ playingSong ].additionalInfo : '' }}</p>
                        <p>{{ playlist[ playingSong ] ? playlist[ playingSong ].artist : '' }}</p>
                    </div>
                </div>
                <div class="mode-selector-wrapper">
                    <select v-model="visualizationSettings" @change="handleAnimationChange()">
                        <option value="mic">Microphone (Mic access required)</option>
                        <option value="off">No visualization except background</option>
                    </select>
                </div>
                <div class="song-list-wrapper">
                    <div v-for="song in songQueue" v-bind:key="song.id" class="song-list">
                        <img :src="song.cover" class="song-image">
                        <div v-if="( playlist[ playingSong ] ? playlist[ playingSong ].id : '' ) === song.id && isPlaying" class="playing-symbols">
                            <div class="playing-symbols-wrapper">
                                <div class="playing-bar" id="bar-1"></div>
                                <div class="playing-bar" id="bar-2"></div>
                                <div class="playing-bar" id="bar-3"></div>
                            </div>
                        </div>
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
            <div v-else-if="!hasLoaded && !showCouldNotFindRoom" class="showcase-wrapper">
                <h1>Loading...</h1>
            </div>
            <div v-else class="showcase-wrapper">
                <h1>Couldn't connect!</h1>
                <p>There does not appear to be a share with the specified name, or an error occurred when connecting.</p>
                <p>You may reload the page to try again!</p>
            </div>
            <div class="background" id="background">
                <div class="beat-manual"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import SocketConnection from '@/scripts/connection';
    import type { Song } from '@/scripts/song';
    import { computed, ref, type Ref } from 'vue';
    import bizualizer from '@/scripts/bizualizer';

    const isPlaying = ref( false );
    const playlist: Ref<Song[]> = ref( [] );
    const pos = ref( 0 );
    const playingSong = ref( 0 );
    const progressBar = ref( 0 );
    const hasLoaded = ref( false );
    const showCouldNotFindRoom = ref( false );
    const playbackStart = ref( 0 );
    let timeTracker = 0;
    const visualizationSettings = ref( 'mic' );

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
        progressBar.value = ( pos.value / playlist.value[ playingSong.value ].duration ) * 1000;
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
            setTimeout( () => {
                setBackground();
            }, 1000 )
        } );
    } ).catch( () => {
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

        setTimeout( () => {
            handleAnimationChange();
            setBackground();
        }, 1000 );
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

        handleAnimationChange();
    }

    const animateBeat = () => {
        $( '.beat-manual' ).stop();
        const duration = Math.ceil( 60 / 120 * 500 ) - 50;
        $( '.beat-manual' ).fadeIn( 50 );
        setTimeout( () => {
            $( '.beat-manual' ).fadeOut( duration );
            setTimeout( () => {
                bizualizer.coolDown();
                $( '.beat-manual' ).stop();
            }, duration );
        }, 50 );
    }

    const handleAnimationChange = () => {
        if ( visualizationSettings.value === 'mic' && isPlaying.value ) {
            bizualizer.subscribeToBeatUpdate( animateBeat );
        } else {
            bizualizer.unsubscribeFromBeatUpdate()
        }
    }

    const setBackground = () => {
        bizualizer.createBackground().then( bg => {
            $( '#background' ).css( 'background', bg );
        } );
    }

    const notifier = () => {
        Notification.requestPermission();

        console.warn( '[ notifier ]: Status is now enabled \n\n-> Any leaving or tampering with the website will send a notification to the host' );
        // Detect if window is currently in focus
        window.onblur = () => {
            sendNotification();
        }

        // Detect if browser window becomes hidden (also with blur event)
        document.onvisibilitychange = () => {
            if ( document.visibilityState === 'hidden' ) {
                sendNotification();
            }
        };
    }

    const sendNotification = () => {
        new Notification( 'YOU ARE UNDER SURVEILLANCE', { 
            body: 'Please return to the original webpage immediately!',
            requireInteraction: true,
        } );
    }
</script>

<style scoped>
    .remote-view {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        text-align: justify;
    }

    .showcase-wrapper {
        width: 100%;
        z-index: 5;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
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
        border: 1px white solid;
        background-color: rgba( 0, 0, 0, 0.4 );
    }

    .song-details-wrapper {
        margin: 0;
        display: block;
        margin-left: 10px;
        margin-right: auto;
        text-align: justify;
    }

    .song-list .song-image {
        width: 5vw;
        height: 5vw;
        object-fit: cover;
        object-position: center;
        font-size: 5vw;
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
        justify-content: center;
        align-items: center;
        flex-direction: column;
        height: 55vh;
        width: 100%;
        margin-bottom: 0.5%;
        margin-top: 0.25%;
    }

    .current-song {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        margin-top: 1vh;
        padding: 1vh;
        text-align: center;
        background-color: rgba( 0, 0, 0, 0.4 );
    }

    .fancy-view-song-art {
        height: 30vh;
        width: 30vh;
        object-fit: cover;
        object-position: center;
        margin-bottom: 10px;
        font-size: 30vh !important;
    }

    #app {
        background-color: rgba( 0, 0, 0, 0 );
    }

    #progress, #progress::-webkit-progress-bar {
        background-color: rgba(45, 28, 145);
        color: rgba(45, 28, 145);
        width: 30vw;
        border: none;
        border-radius: 0px;
        accent-color: white;
        -webkit-appearance: none;
        appearance: none;
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

    .dancing-style {
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
        z-index: 100;
    }
</style>

<style scoped>
    .background {
        position: fixed;
        left: -50vw;
        width: 200vw;
        height: 200vw;
        top: -50vw;
        z-index: 1;
        filter: blur(10px);
        background: conic-gradient( blue, green, red, blue );
        animation: gradientAnim 10s infinite linear;
        background-position: center;
    }

    .beat, .beat-manual {
        height: 100%;
        width: 100%;
        background-color: rgba( 0, 0, 0, 0.1 );
        display: none;
    }

    .beat {
        animation: beatAnim 0.6s infinite linear;
    }

    @keyframes beatAnim {
        0% {
            background-color: rgba( 0, 0, 0, 0.2 );
        }
        20% {
            background-color: rgba( 0, 0, 0, 0 );
        }
        100% {
            background-color: rgba( 0, 0, 0, 0.2 );
        }
    }

    @keyframes gradientAnim {
        from {
            transform: rotate( 0deg );
        }
        to {
            transform: rotate( 360deg );
        }
    }
</style>