/*
*				MusicPlayerV2 - index.js
*
*	Created by Janis Hutz 11/20/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

/*
    Quick side note here: This is terribly ugly code, but I was in a hurry to finish it, 
    so I had no time to clean it up. I will do that at some point -jh
*/

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
            isShowingWarning: false,

            // For use with playlists that are partially from apple music and 
            // local drive
            isUsingCustomPlaylist: false,
            rawLoadedPlaylistData: {},
            basePath: '',
            audioPlayer: null,
            isReconnecting: false,

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
                this.playingSong = this.songQueue[ this.queuePos ];
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
                if ( this.playingSong.origin === 'apple-music' ) {
                    this.musicKit.seekToTime( this.pos );
                } else {
                    this.audioPlayer.currentTime = this.pos;
                }
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
                    'origin': 'apple-music',
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
                if ( !this.playingSong.origin ) {
                    this.play( this.songQueue[ 0 ] );
                    this.isPlaying = true;
                } else {
                    if ( this.playingSong.origin === 'apple-music' ) {
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
                        try {
                            this.audioPlayer.pause();
                        } catch ( err ) {}
                    } else {
                        this.audioPlayer.play();
                        this.musicKit.pause();
                    }
                    this.isPlaying = true;
                    try { 
                        clearInterval( this.progressTracker );
                    } catch( err ) {};
                    this.progressTracker = setInterval( () => {
                        if ( this.playingSong.origin === 'apple-music' ) {
                            this.pos = parseInt( this.musicKit.currentPlaybackTime );
                        } else {
                            this.pos = parseInt( this.audioPlayer.currentTime );
                        }

                        if ( this.pos > this.playingSong.duration - 1 ) {
                            this.control( 'next' );
                        }

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
                    }, 50 );
                    this.sendUpdate( 'pos' );
                    this.sendUpdate( 'isPlaying' );
                }
            } else if ( action === 'pause' ) {
                if ( this.playingSong.origin === 'apple-music' ) {
                    this.musicKit.pause();
                } else {
                    this.audioPlayer.pause();
                }
                this.sendUpdate( 'pos' );
                try {
                    clearInterval( this.progressTracker );
                    clearInterval( this.notifier );
                } catch ( err ) {};
                this.isPlaying = false;
                this.sendUpdate( 'isPlaying' );
            } else if ( action === 'replay10' ) {
                if ( this.playingSong.origin === 'apple-music' ) {
                    this.musicKit.seekToTime( this.musicKit.currentPlaybackTime > 10 ? this.musicKit.currentPlaybackTime - 10 : 0 );
                    this.pos = this.musicKit.currentPlaybackTime;
                } else {
                    this.audioPlayer.currentTime = this.audioPlayer.currentTime > 10 ? this.audioPlayer.currentTime - 10 : 0;
                    this.pos = this.audioPlayer.currentTime;
                }
                this.sendUpdate( 'pos' );
            } else if ( action === 'forward10' ) {
                if ( this.playingSong.origin === 'apple-music' ) {
                    if ( this.musicKit.currentPlaybackTime < ( this.playingSong.duration - 10 ) ) {
                        this.musicKit.seekToTime( this.musicKit.currentPlaybackTime + 10 );
                        this.pos = this.musicKit.currentPlaybackTime;
                        this.sendUpdate( 'pos' );
                    } else {
                        if ( this.repeatMode !== 'one' ) {
                            this.control( 'next' );
                        } else {
                            this.musicKit.seekToTime( 0 );
                            this.pos = this.musicKit.currentPlaybackTime;
                            this.sendUpdate( 'pos' );
                        }
                    }
                } else {
                    if ( this.audioPlayer.currentTime < ( this.playingSong.duration - 10 ) ) {
                        this.audioPlayer.currentTime = this.audioPlayer.currentTime + 10;
                        this.pos = this.audioPlayer.currentTime;
                        this.sendUpdate( 'pos' );
                    } else {
                        if ( this.repeatMode !== 'one' ) {
                            this.control( 'next' );
                        } else {
                            this.audioPlayer.currentTime = 0;
                            this.pos = this.audioPlayer.currentTime;
                            this.sendUpdate( 'pos' );
                        }
                    }
                }
            } else if ( action === 'reset' ) {
                clearInterval( this.progressTracker );
                this.pos = 0;
                if ( this.playingSong.origin === 'apple-music' ) {
                    this.musicKit.seekToTime( 0 );
                } else {
                    this.audioPlayer.currentTime = 0;
                }
                this.sendUpdate( 'pos' );
            } else if ( action === 'next' ) {
                if ( this.queuePos < parseInt( Object.keys( this.songQueue ).length ) - 1 ) {
                    this.queuePos = parseInt( this.queuePos ) + 1;
                    this.play( this.songQueue[ this.queuePos ] );
                } else {
                    if ( this.repeatMode === 'all' ) {
                        this.queuePos = 0;
                        this.play( this.songQueue[ 0 ] );
                    } else {
                        this.control( 'pause' );
                    }
                }
            } else if ( action === 'previous' ) {
                if ( this.pos > 3 ) {
                    this.pos = 0;
                    if ( this.isUsingCustomPlaylist ) {
                        this.audioPlayer.currentTime = 0;
                        this.sendUpdate( 'pos' );
                    } else {
                        this.musicKit.seekToTime( 0 ).then( () => {
                            this.sendUpdate( 'pos' );
                            this.control( 'play' );
                        } );
                    }
                } else {
                    if ( this.queuePos > 0 ) {
                        this.queuePos = parseInt( this.queuePos ) - 1;
                        this.play( this.songQueue[ this.queuePos ] );
                    } else {
                        this.queuePos = parseInt( Object.keys( this.songQueue ).length ) - 1;
                        this.play[ this.songQueue[ this.queuePos ] ];
                    }
                }

            } else if ( action === 'shuffleOff' ) {
                // TODO: Make shuffle function
                this.isShuffleEnabled = false;
                // this.loadPlaylist();
                alert( 'not implemented yet' );
            } else if ( action === 'shuffleOn' ) {
                this.isShuffleEnabled = true;
                alert( 'not implemented yet' );
                // this.loadPlaylist();
            } else if ( action === 'repeatOne' ) {
                this.repeatMode = 'one';
            } else if ( action === 'repeatAll' ) {
                this.repeatMode = 'all';
            } else if ( action === 'repeatOff' ) {
                this.musicKit.repeatMode = MusicKit.PlayerRepeatMode.none;
                this.repeatMode = 'off';
            }
        },
        play( song, specificID ) {
            let foundSong = specificID ?? 0;
            if ( !specificID ) {
                for ( let s in this.songQueue ) {
                    if ( this.songQueue[ s ] === song ) {
                        foundSong = s;
                    }
                }
            }

            this.queuePos = foundSong;
            this.sendUpdate( 'queuePos' );
            this.pos = 0;
            this.sendUpdate( 'posReset' );
            this.playingSong = song;
            this.sendUpdate( 'playingSong' );
            if ( song.origin === 'apple-music' ) { 
                this.musicKit.setQueue( { 'song': song.filename } ).then( () => {
                    setTimeout( () => {
                        this.control( 'play' );
                    }, 500 );
                } ).catch( ( err ) => {
                    console.log( err );
                } );
            } else {
                setTimeout( () => {
                    this.control( 'play' );
                }, 500 );
            }
            const minuteCounts = Math.floor( ( this.playingSong.duration ) / 60 );
            this.durationBeautified = String( minuteCounts ) + ':';
            if ( ( '' + minuteCounts ).length === 1 ) {
                this.durationBeautified = '0' + minuteCounts + ':';
            }
            const secondCounts = Math.floor( ( this.playingSong.duration ) - minuteCounts * 60 );
            if ( ( '' + secondCounts ).length === 1 ) {
                this.durationBeautified += '0' + secondCounts;
            } else {
                this.durationBeautified += secondCounts;
            }
            this.hasFinishedInit = true;
        },
        toggleShowMode() {
            this.isShowingRemainingTime = !this.isShowingRemainingTime;
        },
        exportCurrentPlaylist() {
            let fetchOptions = {
                method: 'post',
                body: JSON.stringify( this.songQueue ),
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                },
            };
            fetch( '/savePlaylist', fetchOptions ).then( res => {
                if ( res.status === 200 ) {
                    console.log( 'saved' );
                }
            } );
        },
        selectPlaylistFromDisk() {
            this.isPreparingToPlay = true;
            let playlistSongs = [];
            fetch( '/loadPlaylist' ).then( res => {
                res.json().then( data => {
                    this.rawLoadedPlaylistData = data.data;
                    this.basePath = data.path.slice( 0, data.path.lastIndexOf( '/' ) );
                    for ( let song in this.rawLoadedPlaylistData ) {
                        if ( this.rawLoadedPlaylistData[ song ].origin === 'apple-music' ) {
                            playlistSongs.push( this.rawLoadedPlaylistData[ song ].filename );
                        }
                    }
                    this.musicKit.setQueue( { songs: playlistSongs } ).then( () => {
                        this.isUsingCustomPlaylist = true;
                        try {
                            this.loadCustomPlaylist();
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
                } );
            } );
        },
        loadCustomPlaylist() {
            const songQueue = this.musicKit.queue.items;
            let offset = 0;
            ( async() => {
                for ( let item in this.rawLoadedPlaylistData ) {
                    if ( this.rawLoadedPlaylistData[ item ].origin === 'apple-music' ) {
                        this.songQueue[ item ] = {
                            'artist': songQueue[ item - offset ].attributes.artistName,
                            'title': songQueue[ item - offset ].attributes.name,
                            'year': songQueue[ item - offset ].attributes.releaseDate,
                            'genre': songQueue[ item - offset ].attributes.genreNames,
                            'duration': Math.round( songQueue[ item - offset ].attributes.durationInMillis / 1000 ),
                            'filename': songQueue[ item - offset ].id,
                            'coverArtOrigin': 'api',
                            'hasCoverArt': true,
                            'queuePos': item,
                            'origin': 'apple-music',
                            'offset': offset,
                        }
                        let url = songQueue[ item - offset ].attributes.artwork.url;
                        url = url.replace( '{w}', songQueue[ item - offset ].attributes.artwork.width );
                        url = url.replace( '{h}', songQueue[ item - offset ].attributes.artwork.height );
                        this.songQueue[ item ][ 'coverArtURL' ] = url;
                    } else {
                        offset += 1;
                        const queryParameters = { 
                            term: ( this.rawLoadedPlaylistData[ item ].artist ?? '' ) + ' ' + ( this.rawLoadedPlaylistData[ item ].title ?? '' ), 
                            types: [ 'songs' ],
                        };
                        // TODO: Make storefront adjustable
                        const result = await this.musicKit.api.music( '/v1/catalog/ch/search', queryParameters );
                        let json;
                        try {
                            const res = await fetch( '/getMetadata?file=' + this.basePath + '/' + this.rawLoadedPlaylistData[ item ].filename );
                            json = await res.json();
                        } catch( err ) {}
                        if ( result.data ) {
                            if ( result.data.results.songs ) {
                                const dat = result.data.results.songs.data[ 0 ];
                                console.log( json );
                                this.songQueue[ item ] = {
                                    'artist': dat.attributes.artistName,
                                    'title': dat.attributes.name,
                                    'year': dat.attributes.releaseDate,
                                    'genre': dat.attributes.genreNames,
                                    'duration': json ? Math.round( json.duration ) : undefined,
                                    'filename': this.rawLoadedPlaylistData[ item ].filename,
                                    'coverArtOrigin': 'api',
                                    'hasCoverArt': true,
                                    'queuePos': item,
                                    'origin': 'local',
                                }
                                let url = dat.attributes.artwork.url;
                                url = url.replace( '{w}', dat.attributes.artwork.width );
                                url = url.replace( '{h}', dat.attributes.artwork.height );
                                this.songQueue[ item ][ 'coverArtURL' ] = url;
                            }
                        }
                    }
                    this.handleAdditionalData();
                    this.sendUpdate( 'songQueue' );
                }
            } )();
            setTimeout( () => {
                this.audioPlayer = document.getElementById( 'audio-player' );
            }, 1000 );
        },
        search() {
            ( async() => {
                const searchTerm = prompt( 'Enter search term...' )
                const queryParameters = { 
                    term: ( searchTerm ), 
                    types: [ 'songs' ],
                };
                // TODO: Make storefront adjustable
                const result = await this.musicKit.api.music( '/v1/catalog/ch/search', queryParameters );
                console.log( result );
            } )();
        },
        connectToNotifier() {
            let source = new EventSource( '/mainNotifier', { withCredentials: true } );
            source.onmessage = ( e ) => {
                let data;
                try {
                    data = JSON.parse( e.data );
                } catch ( err ) {
                    data = { 'type': e.data };
                }
                if ( data.type === 'blur' ) {
                    this.isShowingWarning = true;
                } else if ( data.type === 'visibility' ) {
                    this.isShowingWarning = true;
                }
            };

            source.onopen = () => {
                console.log( 'client notifier connected successfully' );
            };

            let self = this;
                
            source.addEventListener( 'error', function( e ) {
                if ( e.eventPhase == EventSource.CLOSED ) source.close();

                if ( e.target.readyState == EventSource.CLOSED ) {
                    console.log( 'disconnected' );
                }
                
                setTimeout( () => {
                    if ( !self.isReconnecting ) {
                        self.isReconnecting = true;
                        self.tryReconnect();
                    }
                }, 1000 );
            }, false );
        },
        tryReconnect() {
            const int = setInterval( () => {
                if ( !this.isReconnecting ) {
                    clearInterval( int );
                } else {
                    connectToSSESource();
                }
            }, 1000 );
        },
        dismissNotification() {
            this.isShowingWarning = false;
        }
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
        this.connectToNotifier();
        fetch( '/getLocalIP' ).then( res => {
            if ( res.status === 200 ) {
                res.text().then( ip => {
                    this.localIP = ip;
                } );
            }
        } );
    },
} ).mount( '#app' );