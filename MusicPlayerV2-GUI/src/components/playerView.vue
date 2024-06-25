<template>
    <div>
        <div :class="'player' + ( isShowingFullScreenPlayer ? '' : ' player-hidden' )">
            <div class="main-player">
                <!-- TODO: Make cover art of song or otherwise MusicPlayer Logo -->
                <img src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png" alt="MusicPlayer Logo" class="logo-player" @click="controlUI( 'show' )" v-if="coverArt === ''">
                <img :src="coverArt" alt="MusicPlayer Logo" class="logo-player" @click="controlUI( 'show' )" v-else>
                <div class="song-name-wrapper">
                    <p class="song-name" @click="controlUI( 'show' )">{{ currentlyPlayingSongName }} <i v-if="currentlyPlayingSongArtist">by {{ currentlyPlayingSongArtist }}</i></p>
                    <div :class="'playback' + ( isShowingFullScreenPlayer ? ' full-screen' : '' )">
                        <sliderView :position="pos" :active="true" :duration="duration" name="main" @pos="( pos ) => player.goToPos( pos )"
                            v-if="isShowingFullScreenPlayer"></sliderView>
                        <div :class="'playback-pos-wrapper' + ( isShowingFullScreenPlayer ? ' full-screen' : '' )">
                            <p class="playback-pos">{{ nicePlaybackPos }}</p>
                            <p v-if="!isShowingFullScreenPlayer"> / </p>
                            <p class="playback-duration">{{ niceDuration }}</p>
                        </div>
                    </div>
                </div>
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
        </div>
        <div :class="'playlist-view' + ( isShowingFullScreenPlayer ? '' : ' hidden' )">
            <span class="material-symbols-outlined close-fullscreen" @click="controlUI( 'hide' )">close</span>
            <playlistView :playlist="playlist" class="pl-wrapper" :currently-playing="currentlyPlayingSongIndex" :is-playing="isPlaying"
            @control="( action ) => { control( action ) }" @play-song="( song ) => { playSong( song ) }"></playlistView>
        </div>
    </div>
</template>


<script setup lang="ts">
    // TODO: Handle resize, hide all non-essential controls when below 900px width

    import { ref, type Ref } from 'vue';
    import playlistView from '@/components/playlistView.vue';
    import MusicKitJSWrapper from '@/scripts/music-player';
    import sliderView from './sliderView.vue';
    import type { Song } from '@/scripts/song';

    const isPlaying = ref( false );
    const repeatMode = ref( '' );
    const shuffleMode = ref( '' );
    const currentlyPlayingSongName = ref( 'Not playing' );
    const currentlyPlayingSongIndex = ref( 0 );
    const clickCountForward = ref( 0 );
    const clickCountBack = ref( 0 );
    const isShowingFullScreenPlayer = ref( false );
    const player = new MusicKitJSWrapper();
    const playlist: Ref<Song[]> = ref( [] );
    const coverArt = ref( '' );
    const nicePlaybackPos = ref( '00:00' );
    const niceDuration = ref( '00:00' );
    const isShowingRemainingTime = ref( false );
    const currentlyPlayingSongArtist = ref( '' );
    const pos = ref( 0 );
    const duration = ref( 0 );

    const emits = defineEmits( [ 'playerStateChange' ] );

    const playPause = () => {
        isPlaying.value = !isPlaying.value;
        if ( isPlaying.value ) {
            player.control( 'play' );
            startProgressTracker();
        } else {
            player.control( 'pause' );
            stopProgressTracker();
        }
    }

    const control = ( action: string ) => {
        if ( action === 'pause' ) {
            isPlaying.value = false;
            player.control( 'pause' );
            stopProgressTracker();
        } else if ( action === 'play' ) {
            isPlaying.value = true;
            player.control( 'play' );
            startProgressTracker();
        } else if ( action === 'repeat' ) {
            if ( repeatMode.value === '' ) {
                repeatMode.value = '_on';
                player.setRepeatMode( 'all' );
            } else if ( repeatMode.value === '_on' ) {
                repeatMode.value = '_one_on';
                player.setRepeatMode( 'once' );
            } else {
                repeatMode.value = '';
                player.setRepeatMode( 'off' );
            }
        } else if ( action === 'shuffle' ) {
            if ( shuffleMode.value === '' ) {
                shuffleMode.value = '_on';
                player.setShuffle( true );
            } else {
                shuffleMode.value = '';
                player.setShuffle( false );
            }
            getDetails();
        } else if ( action === 'forward' ) {
            clickCountForward.value += 1;
            player.control( 'skip-10' );
        } else if ( action === 'back' ) {
            clickCountBack.value += 1;
            player.control( 'back-10' );
        } else if ( action === 'next' ) {
            stopProgressTracker();
            player.control( 'next' );
            coverArt.value = '';
            currentlyPlayingSongArtist.value = '';
            currentlyPlayingSongName.value = 'Loading...';
            setTimeout( () => {
                getDetails();
                startProgressTracker();
            }, 2000 );
        } else if ( action === 'previous' ) {
            stopProgressTracker();
            player.control( 'previous' );
            coverArt.value = '';
            currentlyPlayingSongArtist.value = '';
            currentlyPlayingSongName.value = 'Loading...';
            setTimeout( () => {
                getDetails();
                startProgressTracker();
            }, 2000 );
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

    const selectPlaylist = ( id: string ) => {
        currentlyPlayingSongArtist.value = '';
        coverArt.value = '';
        currentlyPlayingSongName.value = 'Loading...';
        player.setPlaylistByID( id ).then( () => {
            isPlaying.value = true;
            setTimeout( () => {
                startProgressTracker();
                getDetails();
            }, 2000 );
        } );
    }

    const getDetails = () => {
        const details = player.getPlayingSong();
        currentlyPlayingSongName.value = details.title;
        coverArt.value = details.cover;
        currentlyPlayingSongIndex.value = player.getPlayingSongID();
        playlist.value = player.getQueue();
        console.log( playlist.value );
        currentlyPlayingSongArtist.value = details.artist;
    }

    const playSong = ( id: string ) => {
        const p = player.getPlaylist();
        currentlyPlayingSongArtist.value = '';
        coverArt.value = '';
        currentlyPlayingSongName.value = 'Loading...';
        stopProgressTracker();
        for ( const s in p ) {
            if ( p[ s ].id === id ) {
                player.prepare( parseInt( s ) );
                setTimeout( () => {
                    getDetails();
                    startProgressTracker();
                }, 2000 );
                break;
            }
        }
    }


    let progressTracker = 0;
    const startProgressTracker = () => {
        isPlaying.value = true;
        const playingSong = player.getPlayingSong();
        duration.value = playingSong.duration;
        const minuteCounts = Math.floor( ( playingSong.duration ) / 60 );
        niceDuration.value = String( minuteCounts ) + ':';
        if ( ( '' + minuteCounts ).length === 1 ) {
            niceDuration.value = '0' + minuteCounts + ':';
        }
        const secondCounts = Math.floor( ( playingSong.duration ) - minuteCounts * 60 );
        if ( ( '' + secondCounts ).length === 1 ) {
            niceDuration.value += '0' + secondCounts;
        } else {
            niceDuration.value += secondCounts;
        }
        progressTracker = setInterval( () => {
            pos.value = player.getPlaybackPos();
            if ( pos.value > playingSong.duration - 1 ) {
                // TODO: repeat
                control( 'next' );
            }

            const minuteCount = Math.floor( pos.value / 60 );
            nicePlaybackPos.value = minuteCount + ':';
            if ( ( '' + minuteCount ).length === 1 ) {
                nicePlaybackPos.value = '0' + minuteCount + ':';
            }
            const secondCount = Math.floor( pos.value - minuteCount * 60 );
            if ( ( '' + secondCount ).length === 1 ) {
                nicePlaybackPos.value += '0' + secondCount;
            } else {
                nicePlaybackPos.value += secondCount;
            }

            if ( isShowingRemainingTime.value ) {
                const minuteCounts = Math.floor( ( playingSong.duration - pos.value ) / 60 );
                niceDuration.value = '-' + String( minuteCounts ) + ':';
                if ( ( '' + minuteCounts ).length === 1 ) {
                    niceDuration.value = '-0' + minuteCounts + ':';
                }
                const secondCounts = Math.floor( ( playingSong.duration - pos.value ) - minuteCounts * 60 );
                if ( ( '' + secondCounts ).length === 1 ) {
                    niceDuration.value += '0' + secondCounts;
                } else {
                    niceDuration.value += secondCounts;
                }
            }
        }, 50 );
    }

    const stopProgressTracker = () => {
        try {
            clearInterval( progressTracker );
        } catch ( _ ) { /* empty */ }
        isPlaying.value = false;
    }

    defineExpose( {
        logIntoAppleMusic,
        getPlaylists,
        controlUI,
        getAuth,
        skipLogin,
        selectPlaylist,
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

    .main-player {
        height: 12vh;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        transition: all 1s;
        position: relative
    }

    .song-name-wrapper {
        cursor: pointer;
        margin-left: 10px;
        width: 100%;
        height: 100%;
        text-align: justify;
        font-weight: bold;
        font-size: 1.25rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .song-name {
        margin: 0;
    }

    .logo-player {
        cursor: pointer;
        height: 80%;
        margin-left: 30px;
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

    .pl-wrapper {
        height: 80vh;
    }

    .playback {
        width: fit-content;
        bottom: -20px;
        left: 7%;
        font-weight: normal;
        font-size: 1rem;
    }

    .playback.full-screen {
        left: 30%;
        position: absolute;
        width: 40%;
    }

    .playback-pos-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .playback-pos-wrapper p {
        margin: 0;
    }

    .playback-pos-wrapper.full-screen p {
        margin-bottom: 15px;
    }

    .playback-pos-wrapper.full-screen .playback-duration {
        margin-left: auto;
    }
</style>