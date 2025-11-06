<template>
    <div>
        <div v-if="isShowingWarning" class="warning">
            <h3>WARNING!</h3>
            <p>A client display is being tampered with!</p>
            <p>A desktop notification with a warning has already been dispatched.</p>
            <button class="simple-button" @click="dismissNotification()">
                Ok
            </button>

            <div class="flash"></div>
        </div>
        <div class="player">
            <div :class="'main-player' + ( isShowingFullScreenPlayer ? ' full-screen' : '' )">
                <div :class="'song-name-wrapper' + ( isShowingFullScreenPlayer ? ' full-screen' : '' )" @click="controlUI( 'show' )">
                    <img
                        v-if="coverArt === ''"
                        src="https://github.com/simplePCBuilding/MusicPlayerV2/raw/master/assets/logo.png"
                        alt="MusicPlayer Logo"
                        class="logo-player"
                    >
                    <img
                        v-else
                        :src="coverArt"
                        alt="MusicPlayer Logo"
                        class="logo-player"
                    >
                    <div class="name-time">
                        <p class="song-name">
                            {{ currentlyPlayingSongName }} <i v-if="currentlyPlayingSongArtist">by {{ currentlyPlayingSongArtist }}</i>
                        </p>
                        <div v-if="!isShowingFullScreenPlayer" class="playback">
                            <div class="playback-pos-wrapper">
                                <p class="playback-pos">
                                    {{ nicePlaybackPos }}
                                </p>
                                <p> / </p>
                                <p class="playback-duration">
                                    {{ niceDuration }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div :class="'controls-wrapper' + ( isShowingFullScreenPlayer ? ' full-screen' : '' )" :style="playlist.length > 0 ? '' : 'pointer-events: none'">
                    <div class="main-controls">
                        <span
                            v-if="isShowingFullScreenPlayer"
                            id="previous"
                            class="material-symbols-outlined controls next-previous"
                            @click="control( 'previous' )"
                        >skip_previous</span>
                        <span
                            v-if="isShowingFullScreenPlayer"
                            class="material-symbols-outlined controls forward-back"
                            :style="'rotate: -' + 360 * clickCountBack + 'deg;'"
                            @click="control( 'back' )"
                        >replay_10</span>
                        <span
                            v-if="isPlaying"
                            id="play-pause"
                            class="material-symbols-outlined controls"
                            @click="playPause()"
                        >pause</span>
                        <span
                            v-else
                            id="play-pause"
                            class="material-symbols-outlined controls"
                            @click="playPause()"
                        >play_arrow</span>
                        <span
                            v-if="isShowingFullScreenPlayer"
                            class="material-symbols-outlined controls forward-back"
                            :style="'rotate: ' + 360 * clickCountForward + 'deg;'"
                            @click="control( 'forward' )"
                        >forward_10</span>
                        <span id="next" class="material-symbols-outlined controls next-previous" @click="control( 'next' )">skip_next</span>
                    </div>

                    <div v-if="isShowingFullScreenPlayer" class="slider-wrapper">
                        <div class="slider-pb-pos">
                            <p class="playback-pos">
                                {{ nicePlaybackPos }}
                            </p>
                            <p class="playback-duration" title="Toggle between remaining time and song duration" @click="toggleRemaining()">
                                {{ niceDuration }}
                            </p>
                        </div>
                        <sliderView
                            :position="pos"
                            :active="true"
                            :duration="duration"
                            name="main"
                            @pos="( pos ) => goToPos( pos )"
                        />
                    </div>

                    <div v-if="isShowingFullScreenPlayer" class="shuffle-repeat">
                        <span class="material-symbols-outlined controls" style="margin-right: auto;" @click="control( 'repeat' )">repeat{{ repeatMode }}</span>
                        <div style="margin-right: auto; pointer-events: all;">
                            <span
                                v-if="!isConnectedToNotifier"
                                class="material-symbols-outlined controls"
                                title="Share your playlist on a public playlist page (opens a configuration window)"
                                @click="control( 'start-share' )"
                            >share</span>
                            <div v-else>
                                <span class="material-symbols-outlined controls" title="Stop sharing your playlist on a public playlist page" @click="control( 'stop-share' )">close</span>
                                <span class="material-symbols-outlined controls" title="Show information on the share, including URL to connect to" @click="control( 'show-share' )">info</span>
                            </div>
                        </div>
                        <span class="material-symbols-outlined controls" @click="control( 'shuffle' )">shuffle{{ shuffleMode }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div :class="'playlist-view' + ( isShowingFullScreenPlayer ? '' : ' hidden' )">
            <span class="material-symbols-outlined close-fullscreen" @click="controlUI( 'hide' )">close</span>
            <playlistView
                :playlist="playlist"
                class="pl-wrapper"
                :currently-playing="currentlyPlayingSongIndex"
                :is-playing="isPlaying"
                :pos="pos"
                :is-logged-into-apple-music="player.isLoggedIn"
                @control="( action ) => { control( action ) }"
                @play-song="( song ) => { playSong( song ) }"
                @add-new-songs="( songs ) => addNewSongs( songs )"
                @playlist-reorder="( move ) => moveSong( move )"
                @add-new-songs-apple-music="( song ) => addNewSongFromObject( song )"
                @delete-song="song => removeSongFromPlaylist( song )"
                @clear-playlist="() => clearPlaylist()"
                @send-additional-info="() => sendAdditionalInfo()"
            />
        </div>
        <notificationsModule ref="notifications" location="bottomleft" size="bigger" />
        <popupModule ref="popup" @update="( data ) => popupReturnHandler( data )" />
        <audio id="local-audio" src="" controls="false"></audio>
    </div>
</template>


<script setup lang="ts">
    import type {
        ReadFile, Song, SongMove
    } from '@/scripts/song';
    import {
        type Ref, ref
    } from 'vue';
    import MusicKitJSWrapper from '@/scripts/music-player';
    import NotificationHandler from '@/scripts/notificationHandler';
    import notificationsModule from './notificationsModule.vue';
    import {
        parseBlob
    } from 'music-metadata';
    import playlistView from '@/components/playlistView.vue';
    import popupModule from './popupModule.vue';
    import sliderView from './sliderView.vue';
    import {
        useUserStore
    } from '@/stores/userStore';

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

    let isShowingRemainingTimeBackend = false;

    const currentlyPlayingSongArtist = ref( '' );
    const pos = ref( 0 );
    const duration = ref( 0 );
    const notifications = ref( notificationsModule );
    const notificationHandler = new NotificationHandler();
    const isConnectedToNotifier = ref( false );
    const popup = ref( popupModule );
    const roomName = ref( '' );
    const isShowingWarning = ref( false );

    let currentlyOpenPopup = '';
    let logoutErrorNotification = -1;

    const emits = defineEmits( [ 'playerStateChange' ] );

    document.addEventListener( 'musicplayer:autherror', () => {
        localStorage.setItem( 'close-tab', 'true' );
        isConnectedToNotifier.value = false;
        logoutErrorNotification = notifications.value.createNotification(
            'You appear to have been logged out. Click to log in again!', 600, 'error', 'critical', '/', true
        );
    } );

    window.addEventListener( 'storage', () => {
        if ( localStorage.getItem( 'login-ok' ) === 'true' ) {
            notifications.value.cancelNotification( logoutErrorNotification );
            notifications.value.createNotification(
                'Logged in again. You will have to reconnect to the share!', 20, 'ok', 'normal'
            );
            localStorage.removeItem( 'login-ok' );
        }
    } );

    const playPause = () => {
        isPlaying.value = !isPlaying.value;

        if ( isPlaying.value ) {
            player.control( 'play' );
            startProgressTracker();
        } else {
            player.control( 'pause' );
            stopProgressTracker();
        }
    };

    const goToPos = ( position: number ) => {
        player.goToPos( position );
        pos.value = position;
        notificationHandler.emit( 'playback-start-update', new Date().getTime() - pos.value * 1000 );
    };

    const toggleRemaining = () => {
        isShowingRemainingTime.value = !isShowingRemainingTime.value;
    };

    const control = ( action: string ) => {
        if ( action === 'pause' ) {
            isPlaying.value = false;
            player.control( 'pause' );
            stopProgressTracker();
            notificationHandler.emit( 'playback-update', isPlaying.value );
        } else if ( action === 'play' ) {
            isPlaying.value = true;
            player.control( 'play' );
            startProgressTracker();
            notificationHandler.emit( 'playback-update', isPlaying.value );
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
                getDetails();
                notificationHandler.emit( 'playlist-update', playlist.value );
            } else {
                shuffleMode.value = '';
                player.setShuffle( false );
                getDetails();
                notificationHandler.emit( 'playlist-update', playlist.value );
            }

            notificationHandler.emit( 'playlist-index-update', player.getQueueID() );
            getDetails();
        } else if ( action === 'forward' ) {
            clickCountForward.value += 1;

            if ( player.control( 'skip-10' ) ) {
                startProgressTracker();
            } else {
                pos.value = player.getPlaybackPos();
                notificationHandler.emit( 'playback-start-update', new Date().getTime() - pos.value * 1000 );
            }
        } else if ( action === 'back' ) {
            clickCountBack.value += 1;

            if ( player.control( 'back-10' ) ) {
                startProgressTracker();
            } else {
                pos.value = player.getPlaybackPos();
                notificationHandler.emit( 'playback-start-update', new Date().getTime() - pos.value * 1000 );
            }
        } else if ( action === 'next' ) {
            stopProgressTracker();
            player.control( 'next' );
            coverArt.value = '';
            currentlyPlayingSongArtist.value = '';
            currentlyPlayingSongName.value = 'Loading...';
            startProgressTracker();
        } else if ( action === 'previous' ) {
            stopProgressTracker();
            player.control( 'previous' );
            coverArt.value = '';
            currentlyPlayingSongArtist.value = '';
            currentlyPlayingSongName.value = 'Loading...';
            startProgressTracker();
        } else if ( action === 'start-share' ) {
            popup.value.openPopup( {
                'title': 'Define a share name',
                'popupType': 'input',
                'subtitle': 'A share allows others to join your playlist and see the current song, the playback position and the upcoming songs. You can get the link to the page, once the share is set up. Please choose a name, which will then be part of the URL with which others can join the share. The anti tamper feature notifies you, whenever a user leaves the fancy view.',
                'data': [
                    {
                        'name': 'Share Name',
                        'dataType': 'text',
                        'id': 'roomName'
                    },
                    {
                        'name': 'Use Anti-Tamper?',
                        'dataType': 'checkbox',
                        'id': 'useAntiTamper'
                    }
                ]
            } );
            currentlyOpenPopup = 'create-share';
        } else if ( action === 'stop-share' ) {
            if ( confirm( 'Do you really want to stop sharing?' ) ) {
                notificationHandler.disconnect();
                isConnectedToNotifier.value = false;
                notifications.value.createNotification(
                    'Disconnected successfully!', 5, 'ok', 'normal'
                );
            }
        } else if ( action === 'show-share' ) {
            popup.value.openPopup( {
                'title': 'Details on share',
                'subtitle': 'You are currently connected to share "' + roomName.value
                    + '". \nYou can connect to it via <a href="https://music.janishutz.com/share/' + roomName.value + '" target="_blank">https://music.janishutz.com/share/' + roomName.value + '</a>'
                    + '. \n\nYou can connect to the fancy showcase screen using this link: <a href="https://music.janishutz.com/fancy/' + roomName.value + '" target="_blank">https://music.janishutz.com/fancy/' + roomName.value + '</a>'
                    + '. Be aware that this one will use significantly more system AND network resources, so only use that for a screen that is front and center, not for a QR code to have all people connect to.'
            } );
            currentlyOpenPopup = 'share-details';
        }
    };


    const controlUI = ( action: string ) => {
        if ( action === 'show' ) {
            isShowingFullScreenPlayer.value = true;
            isShowingRemainingTime.value = isShowingRemainingTimeBackend;
            emits( 'playerStateChange', 'show' );
        } else if ( action === 'hide' ) {
            isShowingFullScreenPlayer.value = false;
            isShowingRemainingTimeBackend = isShowingRemainingTime.value;
            isShowingRemainingTime.value = false;

            try {
                prepNiceDurationTime( player.getPlayingSong() );
            } catch ( err ) { /* empty */ }

            emits( 'playerStateChange', 'hide' );
        }
    };

    const getPlaylists = ( cb: ( data: object ) => void ) => {
        player.getUserPlaylists( cb );
    };

    const logIntoAppleMusic = () => {
        player.logIn();
    };

    const getAuth = (): boolean[] => {
        return player.getAuth();
    };

    const skipLogin = () => {
        player.init();
    };

    const selectPlaylist = ( id: string ) => {
        currentlyPlayingSongArtist.value = '';
        coverArt.value = '';
        currentlyPlayingSongName.value = 'Loading...';
        player.setPlaylistByID( id ).then( () => {
            isPlaying.value = true;
            startProgressTracker();
            setTimeout( () => {
                getDetails();
                notificationHandler.emit( 'playlist-update', playlist.value );
            }, 2000 );
        } );
    };

    const selectCustomPlaylist = async ( pl: ReadFile[] ) => {
        let n = notifications.value.createNotification(
            'Analyzing playlist', 200, 'progress', 'normal'
        );

        playlist.value = [];
        const plLoad: Song[] = [];

        for ( let element in pl ) {
            try {
                plLoad.push( await fetchSongData( pl[ element ] ) );
            } catch ( e ) {
                console.error( e );
            }

            notifications.value.updateNotification( n, `Analyzing playlist (${ element }/${ pl.length })` );
        }

        playlist.value = plLoad;
        player.setPlaylist( playlist.value );
        player.prepare( 0 );
        isPlaying.value = true;
        startProgressTracker();
        setTimeout( () => {
            getDetails();
            notificationHandler.emit( 'playlist-update', playlist.value );
        }, 2000 );
        notifications.value.cancelNotification( n );
        notifications.value.createNotification(
            'Playlist loaded', 10, 'ok', 'normal'
        );
    };

    const fetchSongData = ( songDetails: ReadFile ): Promise<Song> => {
        return new Promise( ( resolve, reject ) => {
            console.info( 'Loading song', songDetails.filename );
            fetch( songDetails.url )
                .then( res => {
                    if ( res.status === 200 ) {
                        res.blob().then( blob => {
                            console.info( 'Song loaded for processing' );
                            parseBlob( blob )
                                .then( data => {
                                    console.info( 'Song metadata processing successful' );

                                    try {
                                        player.findSongOnAppleMusic( data.common.title
                                            ?? songDetails.filename.split( '.' )[ 0 ] )
                                            .then( d => {
                                                console.info( 'Apple Music API lookup successful' );
                                                let url = d.data.results.songs.data[ 0 ].attributes.artwork.url;

                                                url = url.replace( '{w}', String( d.data.results.songs.data[ 0 ].attributes.artwork.width ) );
                                                url = url.replace( '{h}', String( d.data.results.songs.data[ 0 ].attributes.artwork.height ) );
                                                const song: Song = {
                                                    'artist': d.data.results.songs.data[ 0 ].attributes.artistName,
                                                    'title': d.data.results.songs.data[ 0 ].attributes.name,
                                                    'duration': data.format.duration ?? ( d.data.results.songs.data[ 0 ].attributes.durationInMillis / 1000 ),
                                                    'id': songDetails.url,
                                                    'origin': 'disk',
                                                    'cover': url
                                                };

                                                resolve( song );
                                            } )
                                            .catch( e => {
                                                console.info( 'Apple Music API failed' );
                                                console.error( e );
                                                const song: Song = {
                                                    'artist': data.common.artist ?? 'Unknown artist',
                                                    'title': data.common.title ?? 'Unknown song title',
                                                    'duration': data.format.duration ?? 1000,
                                                    'id': songDetails.url,
                                                    'origin': 'disk',
                                                    'cover': ''
                                                };

                                                resolve( song );
                                            } );
                                    } catch ( err ) {
                                        console.error( err );
                                        alert( 'One of your songs was not loadable. (finalization-error)' );
                                        reject( err );
                                    }
                                } )
                                .catch( e => {
                                    console.error( e );
                                    alert( 'One of your songs was not loadable. (parser-error)' );
                                    reject( e );
                                } );
                        } )
                            .catch( e => {
                                console.error( e );
                                alert( 'One of your songs was not loadable. (converter-error)' );
                                reject( e );
                            } );
                    } else {
                        console.error( res.status );
                        alert( 'One of your songs was not loadable. (invalid-response-code)' );
                        reject( res.status );
                    }
                } )
                .catch( e => {
                    console.error( e );
                    alert( 'One of your songs was not loadable. (could-not-connect)' );
                    reject( e );
                } );
        } );
    };

    const getDetails = () => {
        const details = player.getPlayingSong();

        currentlyPlayingSongName.value = details.title;
        coverArt.value = details.cover;
        currentlyPlayingSongIndex.value = player.getQueueID();
        playlist.value = player.getQueue();
        currentlyPlayingSongArtist.value = details.artist;
    };

    const playSong = ( id: string ) => {
        const p = player.getPlaylist();

        currentlyPlayingSongArtist.value = '';
        coverArt.value = '';
        currentlyPlayingSongName.value = 'Loading...';
        stopProgressTracker();

        for ( const s in p ) {
            if ( p[ s ].id === id ) {
                player.prepare( parseInt( s ) );
                startProgressTracker();
                break;
            }
        }
    };


    let progressTracker: ReturnType<typeof setInterval> = setInterval( () => {}, 1000 );

    clearInterval( progressTracker );
    let hasReachedEnd = false;
    let hasStarted = false;

    const startProgressTracker = () => {
        hasReachedEnd = false;
        isPlaying.value = true;
        let playingSong = player.getPlayingSong();

        hasStarted = false;
        pos.value = 0;
        progressTracker = setInterval( () => {
            pos.value = player.getPlaybackPos();

            if ( pos.value > playingSong.duration - 1 && !hasReachedEnd ) {
                stopProgressTracker();
                hasReachedEnd = true;

                if ( repeatMode.value === '_one_on' ) {
                    player.goToPos( 0 );
                    setTimeout( () => {
                        control( 'play' );
                    }, 500 );
                } else {
                    control( 'next' );
                }
            }

            if ( pos.value > 0 && !hasStarted ) {
                if ( player.getPlaying() ) {
                    setTimeout( () => {
                        getDetails();
                        playingSong = player.getPlayingSong();
                        pos.value = player.getPlaybackPos();
                        prepNiceDurationTime( playingSong );
                        notificationHandler.emit( 'playlist-index-update', currentlyPlayingSongIndex.value );
                        notificationHandler.emit( 'playback-update', isPlaying.value );
                        notificationHandler.emit( 'playback-start-update', new Date().getTime() - pos.value * 1000 );
                        hasStarted = true;
                    }, 2000 );
                }
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
        }, 100 );
    };

    const prepNiceDurationTime = ( playingSong: Song ) => {
        duration.value = playingSong.duration;
        const minuteCounts = Math.floor( playingSong.duration / 60 );

        niceDuration.value = String( minuteCounts ) + ':';

        if ( ( '' + minuteCounts ).length === 1 ) {
            niceDuration.value = '0' + minuteCounts + ':';
        }

        const secondCounts = Math.floor( playingSong.duration - minuteCounts * 60 );

        if ( ( '' + secondCounts ).length === 1 ) {
            niceDuration.value += '0' + secondCounts;
        } else {
            niceDuration.value += secondCounts;
        }
    };

    const stopProgressTracker = () => {
        try {
            clearInterval( progressTracker );
        } catch ( _ ) { /* empty */ }

        isPlaying.value = false;
        notificationHandler.emit( 'playback-update', isPlaying.value );
    };

    const moveSong = ( move: SongMove ) => {
        player.moveSong( move );
        getDetails();
        notificationHandler.emit( 'playlist-update', playlist.value );
    };

    const addNewSongs = async ( songs: ReadFile[] ) => {
        let n = notifications.value.createNotification(
            'Analyzing new songs', 200, 'progress', 'normal'
        );

        playlist.value = player.getQueue();

        for ( let element in songs ) {
            try {
                playlist.value.push( await fetchSongData( songs[ element ] ) );
            } catch ( e ) {
                console.error( e );
            }

            notifications.value.updateNotification( n, `Analyzing new songs (${ element }/${ songs.length })` );
        }

        player.setPlaylist( playlist.value );

        if ( !isPlaying.value ) {
            player.prepare( 0 );
            isPlaying.value = true;
            startProgressTracker();
        }

        notifications.value.cancelNotification( n );
        notifications.value.createNotification(
            'New songs added', 10, 'ok', 'normal'
        );
        notificationHandler.emit( 'playlist-update', playlist.value );
    };

    const addNewSongFromObject = ( song: Song ) => {
        playlist.value = player.getQueue();
        playlist.value.push( song );
        player.setPlaylist( playlist.value );

        if ( !isPlaying.value ) {
            player.prepare( 0 );
            isPlaying.value = true;
            startProgressTracker();
        }

        notificationHandler.emit( 'playlist-update', playlist.value );
    };

    const removeSongFromPlaylist = ( song: number ) => {
        playlist.value = player.getQueue();
        playlist.value.splice( song, 1 );
        player.setPlaylist( playlist.value );

        if ( !isPlaying.value ) {
            player.prepare( 0 );
            isPlaying.value = true;
            startProgressTracker();
        }

        notificationHandler.emit( 'playlist-update', playlist.value );
    };

    const clearPlaylist = () => {
        playlist.value = [];
        player.control( 'pause' );
        stopProgressTracker();
        isPlaying.value = false;
        player.setPlaylist( [] );
        currentlyPlayingSongArtist.value = '';
        currentlyPlayingSongName.value = 'Not playing';
        coverArt.value = '';
        pos.value = 0;
        notificationHandler.emit( 'playlist-update', playlist.value );
    };

    const sendAdditionalInfo = () => {
        notifications.value.createNotification(
            'Additional song info transmitted', 5, 'ok', 'normal'
        );
        notificationHandler.emit( 'playlist-update', playlist.value );
    };

    emits( 'playerStateChange', isShowingFullScreenPlayer.value ? 'show' : 'hide' );

    const userStore = useUserStore();

    document.addEventListener( 'keydown', e => {
        if ( !userStore.isUsingKeyboard ) {
            if ( e.key === ' ' ) {
                e.preventDefault();
                playPause();
            } else if ( e.key === 'ArrowRight' ) {
                e.preventDefault();
                control( 'next' );
            } else if ( e.key === 'ArrowLeft' ) {
                e.preventDefault();
                control( 'previous' );
            }
        }
    } );

    const dismissNotification = () => {
        isShowingWarning.value = false;
    };

    const popupReturnHandler = ( data: any ) => {
        if ( currentlyOpenPopup === 'create-share' ) {
            notificationHandler.connect( data.roomName, data.useAntiTamper ?? false ).then( () => {
                roomName.value = notificationHandler.getRoomName();
                isConnectedToNotifier.value = true;
                notificationHandler.emit( 'playlist-index-update', currentlyPlayingSongIndex.value );
                notificationHandler.emit( 'playback-update', isPlaying.value );
                notificationHandler.emit( 'playback-start-update', new Date().getTime() - pos.value * 1000 );
                notificationHandler.emit( 'playlist-update', playlist.value );
                notifications.value.createNotification(
                    'Joined share "' + data.roomName + '"!', 5, 'ok', 'normal'
                );
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                notificationHandler.registerListener( 'tampering-msg', _ => {
                    isShowingWarning.value = true;
                } );
            } )
                .catch( e => {
                    if ( e === 'ERR_CONFLICT' ) {
                        notifications.value.createNotification(
                            'A share with this name exists already!', 5, 'error', 'normal'
                        );
                        control( 'start-share' );
                    } else if ( e === 'ERR_UNAUTHORIZED' ) {
                        console.error( e );
                        localStorage.setItem( 'close-tab', 'true' );
                        logoutErrorNotification = notifications.value.createNotification(
                            'You appear to have been logged out. Click to log in again!', 20, 'error', 'normal', '/', true
                        );
                    } else {
                        console.error( e );
                        notifications.value.createNotification(
                            'Could not create share!', 5, 'error', 'normal'
                        );
                    }
                } );
        }
    };

    window.addEventListener( 'beforeunload', async () => {
        await notificationHandler.disconnect();
    } );

    defineExpose( {
        logIntoAppleMusic,
        getPlaylists,
        controlUI,
        getAuth,
        skipLogin,
        selectPlaylist,
        selectCustomPlaylist,
    } );
</script>

<style scoped>
    .player {
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

    .main-player.full-screen {
        flex-direction: column;
        height: 30vh;
        min-height: 250px;
    }

    .song-name-wrapper {
        margin-top: 10px;
        cursor: pointer;
        margin-left: 10px;
        width: 100%;
        height: 100%;
        text-align: justify;
        font-weight: bold;
        font-size: 1.25rem;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        flex-grow: 0;
    }

    .song-name-wrapper.full-screen {
        flex-direction: row;
        max-height: 50%;
        align-items: center;
    }

    .name-time {
        margin-right: auto;
        margin-left: 10px;
    }

    .song-name {
        margin: 0;
        height: fit-content;
    }

    .slider-wrapper {
        position: relative;
        width: 90%;
        margin-bottom: 5px;
    }

    .shuffle-repeat {
        margin-top: 5px;
        display: flex;
        width: 80%;
        position: relative;
        z-index: 5;
    }

    .slider-pb-pos {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .slider-pb-pos .playback-duration {
        margin-top: 5px;
        margin-left: auto;
        user-select: none;
        cursor: pointer;
    }

    .slider-pb-pos .playback-pos {
        margin-top: 5px;
        user-select: none;
        user-select: none;
    }

    .logo-player {
        cursor: pointer;
        height: 80%;
        width: auto;
        margin-left: 10px;
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

    .controls-wrapper.full-screen {
        flex-direction: column;
        width: 80%;
    }

    .main-controls {
        display: flex;
        justify-content: center;
        align-items: center;
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
        height: 70vh;
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
        user-select: none;
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

    @media only screen and (min-width: 800px) {
        .slider-wrapper {
            width: 40%;
        }

        .shuffle-repeat {
            width: 35%;
        }

        .main-controls .controls {
            font-size: 2rem;
        }

        #play-pause {
            font-size: 3rem;
        }
    }

    #local-audio {
        position: fixed;
        bottom: -50%;
    }
</style>

<style scoped>
    .warning {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40vw;
        height: 50vh;
        font-size: 2vh;
        background-color: rgb(255, 0, 0);
        color: white;
        position: fixed;
        right: 1vh;
        top: 1vh;
        flex-direction: column;
        z-index: 1001;
    }

    .warning h3 {
        font-size: 4vh;
    }

    .warning .flash {
        background-color: rgba(255, 0, 0, 0.4);
        animation: flashing linear infinite 1s;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        position: fixed;
        z-index: -1;
    }

    @keyframes flashing {
        0% {
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }

    .simple-button {
        padding: 10px 15px;
        border: none;
        background-color: rgb(0, 0, 51);
        color: white;
        font-size: 1rem;
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.5s;
    }

    .simple-button:hover {
        border-radius: 5px;
    }
</style>
