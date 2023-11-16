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

            // slider
            offset: 0,
            isDragging: false,
            sliderPos: 0,
            originalPos: 0,
            sliderProgress: 0,
            position: 0,
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
                    this.musicKit.play();
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
                            }
                        } );
                        this.config.devToken = token;
                        this.musicKit = MusicKit.getInstance();
                        if ( this.musicKit.isAuthorized ) {
                            this.isLoggedIn = true;
                            this.config.userToken = this.musicKit.musicUserToken;
                        }
                        this.musicKit.addEventListener( 'mediaItemDidChange', ( e ) => {
                            // Assemble this.playingSong
                            // Also add additional items to queue if there are new
                            // items that weren't previously shown (limitation of MusicKitJS).
                            this.playingSong = {
                                'artist': e.item.attributes.artistName,
                                'title': e.item.attributes.name,
                                'year': e.item.attributes.releaseDate,
                                // Think about bpm analysis
                                // 'bpm': metadata[ 'common' ][ 'bpm' ],
                                'genre': e.item.attributes.genreNames,
                                'duration': Math.round( e.item.attributes.durationInMillis / 1000 ),
                                'filename': e.item.id,
                                'coverArtOrigin': 'api',
                            }
                            let url = e.item.attributes.artwork.url;
                            url = url.replace( '{w}', e.item.attributes.artwork.width );
                            url = url.replace( '{h}', e.item.attributes.artwork.height );
                            this.songQueue[ item ][ 'coverArtURL' ] = url;
                        } );
                        this.apiGetRequest( 'https://api.music.apple.com/v1/me/library/playlists', this.playlistHandler );
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
        selectPlaylist( id ) {
            this.isPreparingToPlay = true;
            this.musicKit.api.library.playlist( id ).then( playlist => {
                const tracks = playlist.relationships.tracks.data.map( tracks => tracks.id );

                this.musicKit.setQueue( { songs: tracks } ).then( () => {
                    try {
                        this.musicKit.play();
                        const songQueue = this.musicKit.player.queue.items;
                        for ( let item in songQueue ) {
                            this.songQueue[ item ] = {
                                'artist': songQueue[ item ].attributes.artistName,
                                'title': songQueue[ item ].attributes.name,
                                'year': songQueue[ item ].attributes.releaseDate,
                                // Think about bpm analysis
                                // 'bpm': metadata[ 'common' ][ 'bpm' ],
                                'genre': songQueue[ item ].attributes.genreNames,
                                'duration': Math.round( songQueue[ item ].attributes.durationInMillis / 1000 ),
                                'filename': songQueue[ item ].id,
                                'coverArtOrigin': 'api',
                            }
                            let url = songQueue[ item ].attributes.artwork.url;
                            url = url.replace( '{w}', songQueue[ item ].attributes.artwork.width );
                            url = url.replace( '{h}', songQueue[ item ].attributes.artwork.height );
                            this.songQueue[ item ][ 'coverArtURL' ] = url;
                        }
                        // TODO: Load additional data from file
                        this.hasSelectedPlaylist = true;
                        this.isPreparingToPlay = false;
                    } catch( err ) {
                        this.hasSelectedPlaylist = false;
                        console.error( err );
                        alert( 'We were unable to play. Please ensure that DRM (yeah sorry it is Apple Music, we cannot do anything about that) is enabled and working' );
                    }
                } ).catch( err => {
                    console.error( 'ERROR whilst settings Queue', err );
                } )
            } );
        },
        handleDrag( e ) {
            if ( this.isDragging ) {
                if ( 0 < this.originalPos + e.screenX - this.offset && this.originalPos + e.screenX - this.offset < document.getElementById( 'progress-slider-' + this.name ).clientWidth - 5 ) {
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
            if ( this.active ) {
                this.originalPos = e.offsetX;
                this.calcProgressPos();
                this.calcPlaybackPos();
            }
        },
        calcProgressPos() {
            this.sliderProgress = Math.ceil( ( this.originalPos + parseInt( this.sliderPos ) ) / ( document.getElementById( 'progress-slider-' + this.name ).clientWidth - 5 ) * 1000 );
        },
        calcPlaybackPos() {
            this.pos = Math.round( ( this.originalPos + parseInt( this.sliderPos ) ) / ( document.getElementById( 'progress-slider-' + this.name ).clientWidth - 5 ) * this.duration );
        },
        sendUpdate( update ) {
            let data = {};
            if ( update === 'pos' ) {
                data = this.pos;
            } else if ( update === 'playingSong' ) {
                data = this.playingSong;
            } else if ( update === 'isPlaying' ) {
                data = this.isPlaying;
            } else if ( update === 'songQueue' ) {
                data = this.songQueue;
            } else if ( update === 'queuePos' ) {
                data = this.queuePos;
            }
            let fetchOptions = {
                method: 'post',
                body: JSON.stringify( { 'type': update, 'data': data } ),
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                },
            };
            fetch( 'http://localhost:8081/statusUpdate', fetchOptions ).catch( err => {
                console.error( err );
            } );
        },
        control( action ) {
            if ( action === 'play' ) {
                this.musicKit.play();
                this.progressTracker = setInterval( () => {
                    this.pos = this.musicKit.currentPlaybackTime;

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
                }, 20 );
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
                this.musicKit.seekToTime( this.musicKit.currentPlaybackTime > 10 ? musicPlayer.currentPlaybackTime - 10 : 0 );
                this.pos = musicPlayer.currentTime;
                this.sendUpdate( 'pos' );
            } else if ( action === 'forward10' ) {
                if ( this.musicKit.currentPlaybackTime < ( this.playingSong.duration - 10 ) ) {
                    this.musicKit.seekToTime( this.musicKit.currentTime + 10 );
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
                this.$emit( 'update', { 'type': 'next' } );
            } else if ( action === 'previous' ) {
                if ( this.pos > 3 ) {
                    this.pos = 0;
                    musicPlayer.currentTime = 0;
                    this.sendUpdate( 'pos' );
                } else {
                    this.$emit( 'update', { 'type': 'previous' } );
                }
            } else if ( action === 'shuffleOff' ) {
                this.$emit( 'update', { 'type': 'shuffleOff' } );
                this.isShuffleEnabled = false;
            } else if ( action === 'shuffleOn' ) {
                this.$emit( 'update', { 'type': 'shuffle' } );
                this.isShuffleEnabled = true;
            } else if ( action === 'repeatOne' ) {
                this.repeatMode = 'one';
            } else if ( action === 'repeatAll' ) {
                this.$emit( 'update', { 'type': 'repeat' } );
                this.repeatMode = 'all';
            } else if ( action === 'repeatOff' ) {
                this.$emit( 'update', { 'type': 'repeatOff' } );
                this.repeatMode = 'off';
            } else if ( action === 'exitFancyView' ) {
                this.isShowingFancyView = false;
                this.$emit( 'update', { 'type': 'fancyView', 'status': false } );
            }
        }
    },
    watch: {
        pos() {
            if ( !this.isDragging ) {
                this.sliderProgress = Math.ceil( this.position / this.duration * 1000 + 2 );
                this.originalPos = Math.ceil( this.position / this.duration * ( document.getElementById( 'progress-slider-' + this.name ).scrollWidth - 5 ) );
            }
        }
    },
    created() {
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