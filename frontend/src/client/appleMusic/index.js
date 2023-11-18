const app = Vue.createApp( {
    data() {
        return {
            musicKit: null,
            isLoggedIn: false,
            config: { 
                'devToken': '',
                'userToken': ''
            },
            playlists: {},
            hasSelectedPlaylist: false,
            songQueue: {},
            queuePos: 0,
            pos: 0,
            playingSong: {},
            isPlaying: false,
            isShuffleEnabled: false,
            repeatMode: 'off',
            playbackPosBeautified: '',
            durationBeautified: '',
            isShowingRemainingTime: false,
            localIP: '',
            hasLoadedPlaylists: false,
            isPreparingToPlay: false,
            additionalSongInfo: {},
            hasFinishedInit: false,

            // slider
            offset: 0,
            isDragging: false,
            sliderPos: 0,
            originalPos: 0,
            sliderProgress: 0,
            active: false,
        }
    },
    methods: {
        logInto() {
            if ( !this.musicKit.isAuthorized ) {
                this.musicKit.authorize().then( () => {
                    this.isLoggedIn = true;
                    this.initMusicKit();
                } );
            } else {
                this.musicKit.authorize().then( () => {
                    this.isLoggedIn = true;
                    this.initMusicKit();
                } );
            }
        },
        initMusicKit () {
            fetch( '/getAppleMusicDevToken' ).then( res => {
                if ( res.status === 200 ) {
                    res.text().then( token => {
                        // MusicKit global is now defined
                        MusicKit.configure( {
                            developerToken: token,
                            app: {
                                name: 'MusicPlayer',
                                build: '2'
                            },
                            storefrontId: 'CH',
                        } ).then( () => {
                            this.config.devToken = token;
                            this.musicKit = MusicKit.getInstance();
                            if ( this.musicKit.isAuthorized ) {
                                this.isLoggedIn = true;
                                this.config.userToken = this.musicKit.musicUserToken;
                            }
                            this.musicKit.shuffleMode = MusicKit.PlayerShuffleMode.off;
                            this.musicKit.addEventListener( 'nowPlayingItemDidChange', ( e ) => {
                                this.control( 'play' );
                                this.hasFinishedInit = true;
                                // Assemble this.playingSong
                                // TODO: Also add additional items to queue if there are new
                                // items that weren't previously shown (limitation of MusicKitJS).
                                if ( e.item ) {
                                    this.playingSong = this.songQueue[ this.musicKit.nowPlayingItemIndex ];
                                    let url = e.item.attributes.artwork.url;
                                    url = url.replace( '{w}', e.item.attributes.artwork.width );
                                    url = url.replace( '{h}', e.item.attributes.artwork.height );
                                    this.playingSong[ 'coverArtURL' ] = url;
                                    this.queuePos = this.musicKit.nowPlayingItemIndex;
                                    this.sendUpdate( 'playingSong' );
                                    this.sendUpdate( 'pos' );
                                    this.sendUpdate( 'isPlaying' );
                                    this.sendUpdate( 'queuePos' );
                                    setTimeout( () => {
                                        this.sendUpdate( 'pos' );
                                    }, 500 );
                                }
                            } );
                            this.apiGetRequest( 'https://api.music.apple.com/v1/me/library/playlists', this.playlistHandler );
                        } );
                    } );
                }
            } );
        },
        playlistHandler ( data ) {
            if ( data.status === 'ok' ) {
                const d = data.data.data;
                this.playlist = {};
                for ( let el in d ) {
                    this.playlists[ d[ el ].id ] = {
                        title: d[ el ].attributes.name,
                        id: d[ el ].id,
                        playParams: d[ el ].attributes.playParams,
                    }
                }
                this.hasLoadedPlaylists = true;
            }
        },
        apiGetRequest( url, callback ) {
            if ( this.config.devToken != '' && this.config.userToken != '' ) {
                fetch( url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${ this.config.devToken }`,
                        'Music-User-Token': this.config.userToken
                    }
                } ).then( res => {
                    if ( res.status === 200 ) {
                        res.json().then( json => {
                            try {
                                callback( { 'status': 'ok', 'data': json } );
                            } catch( err ) {}
                        } );
                    } else {
                        try {
                            callback( { 'status': 'error', 'error': res.status } );
                        } catch( err ) {}
                    }
                } );
            } else return false;
        },
        getAdditionalSongInfo() {
            if ( Object.keys( this.additionalSongInfo ).length < 1 ) {
                fetch( '/apple-music/getAdditionalData' ).then( res => {
                    if ( res.status === 200 ) {
                        res.json().then( json => {
                            this.additionalSongInfo = json;
                            this.handleAdditionalData();
                        } );
                    }
                } );
            }
        },
        handleAdditionalData () {
            if ( Object.keys( this.additionalSongInfo ).length > 0 ) {
                for ( let item in this.songQueue ) {
                    if ( this.additionalSongInfo[ item ] ) {
                        for ( let d in this.additionalSongInfo[ item ] ) {
                            if ( !this.songQueue[ item ][ d ] ) {
                                this.songQueue[ item ][ d ] = this.additionalSongInfo[ item ][ d ];
                            }
                        }
                    }
                }
                this.playingSong = this.songQueue[ this.musicKit.nowPlayingItemIndex ];
                this.sendUpdate( 'songQueue' );
                this.sendUpdate( 'playingSong' );
            }
        },
        selectPlaylist( id ) {
            this.isPreparingToPlay = true;
            this.musicKit.setQueue( { playlist: id } ).then( () => {
                try {
                    this.loadPlaylist();
                    this.hasSelectedPlaylist = true;
                    this.isPreparingToPlay = false;
                } catch( err ) {
                    this.hasSelectedPlaylist = false;
                    console.error( err );
                    alert( 'We were unable to play. Please ensure that DRM (yeah sorry it is Apple Music, we cannot do anything about that) is enabled and working' );
                }
            } ).catch( err => {
                console.error( 'ERROR whilst settings Queue', err );
            } );
        },
        handleDrag( e ) {
            if ( this.isDragging ) {
                if ( 0 < this.originalPos + e.screenX - this.offset && this.originalPos + e.screenX - this.offset < document.getElementById( 'progress-slider' ).clientWidth - 5 ) {
                    this.sliderPos = e.screenX - this.offset;
                    this.calcProgressPos();
                }
            }
        },
        startMove( e ) {
            this.offset = e.screenX;
            this.isDragging = true;
            document.getElementById( 'drag-support' ).classList.add( 'drag-support-active' );
        },
        stopMove() {
            this.originalPos += parseInt( this.sliderPos );
            this.isDragging = false;
            this.offset = 0;
            this.sliderPos = 0;
            document.getElementById( 'drag-support' ).classList.remove( 'drag-support-active' );
            this.calcPlaybackPos();
        },
        setPos ( e ) {
            if ( this.hasSelectedPlaylist ) {
                this.originalPos = e.offsetX;
                this.calcProgressPos();
                this.calcPlaybackPos();
                this.musicKit.seekToTime( this.pos );
                this.sendUpdate( 'pos' );
            }
        },
        calcProgressPos() {
            this.sliderProgress = Math.ceil( ( this.originalPos + parseInt( this.sliderPos ) ) / ( document.getElementById( 'progress-slider' ).clientWidth - 5 ) * 1000 );
        },
        calcPlaybackPos() {
            this.pos = Math.round( ( this.originalPos + parseInt( this.sliderPos ) ) / ( document.getElementById( 'progress-slider' ).clientWidth - 5 ) * this.playingSong.duration );
        },
        sendUpdate( update ) {
            let data = {};
            let up = update;
            if ( update === 'pos' ) {
                data = this.pos;
            } else if ( update === 'playingSong' ) {
                data = this.playingSong;
            } else if ( update === 'isPlaying' ) {
                data = this.isPlaying;
            } else if ( update === 'songQueue' ) {
                data = this.songQueue;
            } else if ( update === 'queuePos' ) {
                this.queuePos = this.musicKit.nowPlayingItemIndex >= 0 ? this.musicKit.nowPlayingItemIndex : 0;
                data = this.queuePos;
            } else if ( update === 'posReset' ) {
                data = 0;
                up = 'pos';
            }
            let fetchOptions = {
                method: 'post',
                body: JSON.stringify( { 'type': up, 'data': data } ),
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                },
            };
            fetch( 'http://localhost:8081/statusUpdate', fetchOptions ).catch( err => {
                console.error( err );
            } );
        },
        loadPlaylist() {
            const songQueue = this.musicKit.queue.items;
            for ( let item in songQueue ) {
                this.songQueue[ item ] = {
                    'artist': songQueue[ item ].attributes.artistName,
                    'title': songQueue[ item ].attributes.name,
                    'year': songQueue[ item ].attributes.releaseDate,
                    'genre': songQueue[ item ].attributes.genreNames,
                    'duration': Math.round( songQueue[ item ].attributes.durationInMillis / 1000 ),
                    'filename': songQueue[ item ].id,
                    'coverArtOrigin': 'api',
                    'hasCoverArt': true,
                    'queuePos': item,
                }
                let url = songQueue[ item ].attributes.artwork.url;
                url = url.replace( '{w}', songQueue[ item ].attributes.artwork.width );
                url = url.replace( '{h}', songQueue[ item ].attributes.artwork.height );
                this.songQueue[ item ][ 'coverArtURL' ] = url;
                this.handleAdditionalData();
                this.sendUpdate( 'songQueue' );
            }
        },
        control( action ) {
            if ( action === 'play' ) {
                if( !this.musicKit || !this.isPlaying ) {
                    this.musicKit.play().then( () => {
                        this.sendUpdate( 'pos' );
                    } ).catch( err => {
                        console.log( 'player failed to start' );
                        console.log( err );
                    } );
                } else {
                    this.musicKit.pause().then( () => {
                        this.musicKit.play().catch( err => {
                            console.log( 'player failed to start' );
                            console.log( err );
                        } );
                    } );
                }
                this.isPlaying = true;
                try { 
                    clearInterval( this.progressTracker );
                } catch( err ) {};
                this.progressTracker = setInterval( () => {
                    this.pos = parseInt( this.musicKit.currentPlaybackTime );

                    const minuteCount = Math.floor( this.pos / 60 );
                    this.playbackPosBeautified = minuteCount + ':';
                    if ( ( '' + minuteCount ).length === 1 ) {
                        this.playbackPosBeautified = '0' + minuteCount + ':';
                    }
                    const secondCount = Math.floor( this.pos - minuteCount * 60 );
                    if ( ( '' + secondCount ).length === 1 ) {
                        this.playbackPosBeautified += '0' + secondCount;
                    } else {
                        this.playbackPosBeautified += secondCount;
                    }

                    if ( this.isShowingRemainingTime ) {
                        const minuteCounts = Math.floor( ( this.playingSong.duration - this.pos ) / 60 );
                        this.durationBeautified = '-' + String( minuteCounts ) + ':';
                        if ( ( '' + minuteCounts ).length === 1 ) {
                            this.durationBeautified = '-0' + minuteCounts + ':';
                        }
                        const secondCounts = Math.floor( ( this.playingSong.duration - this.pos ) - minuteCounts * 60 );
                        if ( ( '' + secondCounts ).length === 1 ) {
                            this.durationBeautified += '0' + secondCounts;
                        } else {
                            this.durationBeautified += secondCounts;
                        }
                    }
                }, 200 );
                this.sendUpdate( 'pos' );
                this.sendUpdate( 'isPlaying' );
            } else if ( action === 'pause' ) {
                this.musicKit.pause();
                this.sendUpdate( 'pos' );
                try {
                    clearInterval( this.progressTracker );
                    clearInterval( this.notifier );
                } catch ( err ) {};
                this.isPlaying = false;
                this.sendUpdate( 'isPlaying' );
            } else if ( action === 'replay10' ) {
                this.musicKit.seekToTime( this.musicKit.currentPlaybackTime > 10 ? musicPlayer.player.currentPlaybackTime - 10 : 0 );
                this.pos = this.musicKit.currentPlaybackTime;
                this.sendUpdate( 'pos' );
            } else if ( action === 'forward10' ) {
                if ( this.musicKit.currentPlaybackTime < ( this.playingSong.duration - 10 ) ) {
                    this.musicKit.seekToTime( this.musicKit.currentPlaybackTime + 10 );
                    this.pos = this.musicKit.currentPlaybackTime;
                    this.sendUpdate( 'pos' );
                    // Get currently playing song and get duration from there
                } else {
                    if ( this.repeatMode !== 'one' ) {
                        this.control( 'next' );
                    } else {
                        this.musicKit.seekToTime( 0 );
                        this.pos = this.musicKit.currentPlaybackTime;
                        this.sendUpdate( 'pos' );
                    }
                }
            } else if ( action === 'reset' ) {
                clearInterval( this.progressTracker );
                this.pos = 0;
                this.musicKit.seekToTime( 0 );
                this.sendUpdate( 'pos' );
            } else if ( action === 'next' ) {
                this.musicKit.skipToNextItem().then( () => {
                    this.sendUpdate( 'queuePos' );
                    this.pos = 0;
                    this.sendUpdate( 'posReset' );
                } );
            } else if ( action === 'previous' ) {
                if ( this.pos > 3 ) {
                    this.pos = 0;
                    this.musicKit.seekToTime( 0 ).then( () => {
                        this.sendUpdate( 'pos' );
                        this.sendUpdate( 'queuePos' );
                        this.control( 'play' );
                    } );
                } else {
                    this.musicKit.skipToPreviousItem().then( () => {
                        this.sendUpdate( 'queuePos' );
                        this.pos = 0;
                        this.sendUpdate( 'posReset' );
                    } );
                }
            } else if ( action === 'shuffleOff' ) {
                this.isShuffleEnabled = false;
                this.musicKit.shuffleMode = MusicKit.PlayerShuffleMode.off;
                this.loadPlaylist();
            } else if ( action === 'shuffleOn' ) {
                this.musicKit.shuffleMode = MusicKit.PlayerShuffleMode.songs;
                this.isShuffleEnabled = true;
                this.loadPlaylist();
            } else if ( action === 'repeatOne' ) {
                this.repeatMode = 'one';
                this.musicKit.repeatMode = MusicKit.PlayerRepeatMode.one;
            } else if ( action === 'repeatAll' ) {
                this.musicKit.repeatMode = MusicKit.PlayerRepeatMode.all;
                this.repeatMode = 'all';
            } else if ( action === 'repeatOff' ) {
                this.musicKit.repeatMode = MusicKit.PlayerRepeatMode.none;
                this.repeatMode = 'off';
            }
        },
        play( song ) {
            let foundSong = 0;
            for ( let s in this.songQueue ) {
                if ( this.songQueue[ s ] === song ) {
                    foundSong = s;
                }
            }
            this.musicKit.changeToMediaItem( this.musicKit.queue.items[ foundSong ] ).then( () => {
                this.sendUpdate( 'queuePos' );
                this.pos = 0;
                this.sendUpdate( 'posReset' );
            } ).catch( ( err ) => {
                console.log( err );
            } );
        },
    },
    watch: {
        pos() {
            if ( !this.isDragging ) {
                this.sliderProgress = Math.ceil( this.pos / this.playingSong.duration * 1000 + 2 );
                this.originalPos = Math.ceil( this.pos / this.playingSong.duration * ( document.getElementById( 'progress-slider' ).scrollWidth - 5 ) );
            }
        }
    },
    created() {
        document.addEventListener( 'keydown', ( e ) => {
            if ( e.key === ' ' ) {
                e.preventDefault();
                if ( !this.isPlaying ) {
                    this.control( 'play' );
                } else {
                    this.control( 'pause' );
                }
            } else if ( e.key === 'ArrowRight' ) {
                e.preventDefault();
                this.control( 'next' );
            } else if ( e.key === 'ArrowLeft' ) {
                e.preventDefault();
                this.control( 'previous' );
            }
        } );
        if ( !window.MusicKit ) {
            document.addEventListener( 'musickitloaded', () => {
                self.initMusicKit();
            } );
        } else {
            this.initMusicKit();
        }
        fetch( '/getLocalIP' ).then( res => {
            if ( res.status === 200 ) {
                res.text().then( ip => {
                    this.localIP = ip;
                } );
            }
        } );
    },
} ).mount( '#app' );