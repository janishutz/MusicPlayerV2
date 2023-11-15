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
            audioLoaded: false,
            // TODO: Set audio loaded to true

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
                } );
            } else {
                this.musicKit.authorize().then( () => {
                    this.musicKit.play();
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
            this.musicKit.api.library.playlist( id ).then( playlist => {
                const tracks = playlist.relationships.tracks.data.map( tracks => tracks.id );

                this.musicKit.setQueue( { songs: tracks } ).then( () => {
                    try {
                        this.musicKit.play();
                        this.hasSelectedPlaylist = true;
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
        }
    },
    watch: {
        position() {
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
    },
} ).mount( '#app' );