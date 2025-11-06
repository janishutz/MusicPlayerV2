import type {
    SearchResult, Song, SongMove
} from './song';

interface Config {
    'devToken': string;
    'userToken': string;
}

type ControlAction = 'play' | 'pause' | 'next' | 'previous' | 'skip-10' | 'back-10';
type RepeatMode = 'off' | 'once' | 'all';

class MusicKitJSWrapper {

    playingSongID: number;

    playlist: Song[];

    queue: number[];

    config: Config;

    musicKit: any;

    isLoggedIn: boolean;

    isPreparedToPlay: boolean;

    repeatMode: RepeatMode;

    isShuffleEnabled: boolean;

    hasEncounteredAuthError: boolean;

    queuePos: number;

    audioPlayer: HTMLAudioElement;

    constructor () {
        this.playingSongID = 0;
        this.playlist = [];
        this.queue = [];
        this.config = {
            'devToken': '',
            'userToken': '',
        };
        this.isShuffleEnabled = false;
        this.repeatMode = 'off';
        this.isPreparedToPlay = false;
        this.isLoggedIn = false;
        this.hasEncounteredAuthError = false;
        this.queuePos = 0;
        this.audioPlayer = document.getElementById( 'local-audio' ) as HTMLAudioElement;

        const self = this;

        if ( !window.MusicKit ) {
            document.addEventListener( 'musickitloaded', () => {
                self.init();
            } );
        } else {
            this.init();
        }
    }

    /**
     * Log a user into Apple Music. Will automatically initialize MusicKitJS, once user is logged in
     * @returns {void}
     */
    logIn (): void {
        if ( !this.musicKit.isAuthorized ) {
            this.musicKit.authorize().then( () => {
                this.isLoggedIn = true;
                this.init();
            } )
                .catch( () => {
                    this.hasEncounteredAuthError = true;
                } );
        } else {
            this.musicKit.authorize().then( () => {
                this.isLoggedIn = true;
                this.init();
            } )
                .catch( () => {
                    this.hasEncounteredAuthError = true;
                } );
        }
    }

    /**
     * Initialize MusicKitJS. Should not be called. Use logIn instead, which first tries to log the user in, then calls this method.
     * @returns {void}
     */
    init (): void {
        fetch( localStorage.getItem( 'url' ) + '/getAppleMusicDevToken', {
            'credentials': 'include'
        } ).then( res => {
            if ( res.status === 200 ) {
                res.text().then( token => {
                    this.audioPlayer = document.getElementById( 'local-audio' ) as HTMLAudioElement;
                    // MusicKit global is now defined
                    MusicKit.configure( {
                        'developerToken': token,
                        'app': {
                            'name': 'MusicPlayer',
                            'build': '3'
                        },
                        'storefrontId': 'CH',
                    } ).then( () => {
                        this.config.devToken = token;
                        this.musicKit = MusicKit.getInstance();

                        if ( this.musicKit.isAuthorized ) {
                            this.isLoggedIn = true;
                            this.config.userToken = this.musicKit.musicUserToken;
                        }

                        this.musicKit.shuffleMode = MusicKit.PlayerShuffleMode.off;
                    } );
                } );
            }
        } );
    }

    /**
     * Get the authentication status of the user
     * @returns {boolean[]} Returns an array, where the first element indicates login status, the second one, if an error was encountered
     */
    getAuth (): boolean[] {
        return [
            this.isLoggedIn,
            this.hasEncounteredAuthError
        ];
    }

    /**
     * Request data from the Apple Music API
     * @param {string} url The URL at the Apple Music API to call (including protocol and url)
     * @param {( data: object ) => void} callback A callback function that takes the data and returns nothing
     * @returns {void}
     */
    apiGetRequest ( url: string, callback: ( data: object ) => void ): void {
        if ( this.config.devToken != '' && this.config.userToken != '' ) {
            fetch( url, {
                'method': 'GET',
                'headers': {
                    'Authorization': `Bearer ${ this.config.devToken }`,
                    'Music-User-Token': this.config.userToken
                }
            } ).then( res => {
                if ( res.status === 200 ) {
                    res.json().then( json => {
                        try {
                            callback( {
                                'status': 'ok',
                                'data': json
                            } );
                        } catch ( err ) { /* empty */ }
                    } );
                } else {
                    try {
                        callback( {
                            'status': 'error',
                            'error': res.status
                        } );
                    } catch ( err ) { /* empty */ }
                }
            } );
        } else return;
    }

    /**
     * Set the playlist to play
     * @param {Song[]} playlist The playlist as an array of songs
     * @returns {void}
     */
    setPlaylist ( playlist: Song[] ): void {
        this.playlist = playlist;
        this.setShuffle( this.isShuffleEnabled );
    }

    setPlaylistByID ( id: string ): Promise<void> {
        return new Promise( ( resolve, reject ) => {
            this.musicKit.setQueue( {
                'playlist': id
            } ).then( () => {
                const pl = this.musicKit.queue.items;
                const songs: Song[] = [];

                for ( const item in pl ) {
                    let url = pl[ item ].attributes.artwork.url;

                    url = url.replace( '{w}', pl[ item ].attributes.artwork.width );
                    url = url.replace( '{h}', pl[ item ].attributes.artwork.height );
                    const song: Song = {
                        'artist': pl[ item ].attributes.artistName,
                        'cover': url,
                        'duration': pl[ item ].attributes.durationInMillis / 1000,
                        'id': pl[ item ].id,
                        'origin': 'apple-music',
                        'title': pl[ item ].attributes.name,
                        'genres': pl[ item ].attributes.genreNames
                    };

                    songs.push( song );
                }

                this.playlist = songs;
                this.setShuffle( this.isShuffleEnabled );
                this.queuePos = 0;
                this.playingSongID = this.queue[ 0 ];
                this.prepare( this.playingSongID );
                resolve();
            } )
                .catch( err => {
                    console.error( err );
                    reject( err );
                } );
        } );
    }

    /**
     * Prepare a specific song in the queue for playing and start playing
     * @param {number} playlistID The ID of the song in the playlist to prepare to play
     * @returns {boolean} Returns true, if successful, false, if playlist is missing / empty. Set that first
     */
    prepare ( playlistID: number ): boolean {
        if ( this.playlist.length > 0 ) {
            this.playingSongID = playlistID;
            this.isPreparedToPlay = true;

            for ( const el in this.queue ) {
                if ( this.queue[ el ] === playlistID ) {
                    this.queuePos = parseInt( el );
                    break;
                }
            }

            if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                this.musicKit.setQueue( {
                    'song': this.playlist[ this.playingSongID ].id
                } ).then( () => {
                    setTimeout( () => {
                        this.control( 'play' );
                    }, 500 );
                } )
                    .catch( err => {
                        console.log( err );
                    } );
            } else {
                this.audioPlayer = document.getElementById( 'local-audio' ) as HTMLAudioElement;
                this.audioPlayer.src = this.playlist[ this.playingSongID ].id;
                setTimeout( () => {
                    this.control( 'play' );
                }, 500 );
            }

            return true;
        } else {
            return false;
        }
    }

    /**
     * Control the player
     * @param {ControlAction} action Action to take on the player
     * @returns {boolean} returns a boolean indicating if there was a change in song.
     */
    control ( action: ControlAction ): boolean {
        switch ( action ) {
            case 'play':
                if ( this.isPreparedToPlay ) {
                    this.control( 'pause' );

                    if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                        this.musicKit.play();

                        return false;
                    } else {
                        this.audioPlayer.play();

                        return false;
                    }
                } else {
                    return false;
                }

            case 'pause':
                if ( this.isPreparedToPlay ) {
                    if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                        this.musicKit.pause();

                        return false;
                    } else {
                        this.audioPlayer.pause();

                        return false;
                    }
                } else {
                    return false;
                }

            case 'back-10':
                if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                    this.musicKit.seekToTime( this.musicKit.currentPlaybackTime > 10 ? this.musicKit.currentPlaybackTime - 10 : 0 );

                    return false;
                } else {
                    this.audioPlayer.currentTime = this.audioPlayer.currentTime > 10 ? this.audioPlayer.currentTime - 10 : 0;

                    return false;
                }

            case 'skip-10':
                if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                    if ( this.musicKit.currentPlaybackTime < ( this.playlist[ this.playingSongID ].duration - 10 ) ) {
                        this.musicKit.seekToTime( this.musicKit.currentPlaybackTime + 10 );

                        return false;
                    } else {
                        if ( this.repeatMode !== 'once' ) {
                            this.control( 'next' );

                            return true;
                        } else {
                            this.musicKit.seekToTime( 0 );

                            return false;
                        }
                    }
                } else {
                    if ( this.audioPlayer.currentTime < ( this.playlist[ this.playingSongID ].duration - 10 ) ) {
                        this.audioPlayer.currentTime = this.audioPlayer.currentTime + 10;
                    } else {
                        if ( this.repeatMode !== 'once' ) {
                            this.control( 'next' );
                        } else {
                            this.audioPlayer.currentTime = 0;
                        }
                    }

                    return false;
                }

            case 'next':
                this.control( 'pause' );

                if ( this.queuePos < this.queue.length - 1 ) {
                    this.queuePos += 1;
                    this.prepare( this.queue[ this.queuePos ] );

                    return true;
                } else {
                    this.queuePos = 0;

                    if ( this.repeatMode !== 'all' ) {
                        this.control( 'pause' );
                    } else {
                        this.playingSongID = this.queue[ this.queuePos ];
                        this.prepare( this.queue[ this.queuePos ] );
                    }

                    return true;
                }

            case 'previous':
                this.control( 'pause' );

                if ( this.queuePos > 0 ) {
                    this.queuePos -= 1;
                    this.prepare( this.queue[ this.queuePos ] );

                    return true;
                } else {
                    this.queuePos = this.queue.length - 1;

                    return true;
                }
        }
    }

    setShuffle ( enabled: boolean ) {
        this.isShuffleEnabled = enabled;
        this.queue = [];

        if ( enabled ) {
            const d = [];

            for ( const el in this.playlist ) {
                d.push( parseInt( el ) );
            }

            this.queue = d.map( value => ( {
                value,
                'sort': Math.random()
            } ) )
                .sort( ( a, b ) => a.sort - b.sort )
                .map( ( {
                    value
                } ) => value );
            this.queue.splice( this.queue.indexOf( this.playingSongID ), 1 );
            this.queue.push( this.playingSongID );
            this.queue.reverse();
        } else {
            for ( const song in this.playlist ) {
                this.queue.push( parseInt( song ) );
            }
        }

        // Find current song ID in queue
        for ( const el in this.queue ) {
            if ( this.queue[ el ] === this.playingSongID ) {
                this.queuePos = parseInt( el );
                break;
            }
        }
    }

    setRepeatMode ( mode: RepeatMode ) {
        this.repeatMode = mode;
    }

    goToPos ( pos: number ) {
        if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
            this.musicKit.seekToTime( pos );
        } else {
            this.audioPlayer.currentTime = pos;
        }
    }


    moveSong ( move: SongMove ) {
        const newQueue = [];
        const finishedQueue = [];

        let songID = 0;

        for ( const song in this.playlist ) {
            if ( this.playlist[ song ].id === move.songID ) {
                songID = parseInt( song );
                break;
            }
        }

        for ( const el in this.queue ) {
            if ( this.queue[ el ] !== songID ) {
                newQueue.push( this.queue[ el ] );
            }
        }

        let hasBeenAdded = false;

        for ( const el in newQueue ) {
            if ( parseInt( el ) === move.newPos ) {
                finishedQueue.push( songID );
                hasBeenAdded = true;
            }

            finishedQueue.push( newQueue[ el ] );
        }

        if ( !hasBeenAdded ) {
            finishedQueue.push( songID );
        }

        this.queue = finishedQueue;
    }

    /**
     * Get the current position of the play heed. Will return in ms since start of the song
     * @returns {number}
     */
    getPlaybackPos (): number {
        if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
            return this.musicKit.currentPlaybackTime;
        } else {
            return this.audioPlayer.currentTime;
        }
    }

    /**
     * Get details on the currently playing song
     * @returns {Song}
     */
    getPlayingSong (): Song {
        return this.playlist[ this.playingSongID ];
    }

    /**
     * Get the playlist index of the currently playing song
     * @returns {number}
     */
    getPlayingSongID (): number {
        return this.playingSongID;
    }

    /**
     * Get the queue index of the currently playing song
     * @returns {number}
     */
    getQueueID (): number {
        return this.queuePos;
    }

    /**
     * Get the full playlist, as it is set currently, not ordered by queue settings, but as passed in originally
     * @returns {Song[]}
     */
    getPlaylist (): Song[] {
        return this.playlist;
    }

    /**
     * Same as getPlaylist, but returns a ordered playlist, by how it will play according to the queue.
     * @returns {Song[]}
     */
    getQueue (): Song[] {
        const data = [];

        for ( const el in this.queue ) {
            data.push( this.playlist[ this.queue[ el ] ] );
        }

        return data;
    }

    /**
     * Get all playlists the authenticated user has on Apple Music. Only available once the user has authenticated!
     * @param {( data: object ) => void} cb The callback function called with the results from the API
     * @returns {boolean} Returns true, if user is authenticated and request was started, false if not.
     */
    getUserPlaylists ( cb: ( data: object ) => void ): boolean {
        if ( this.isLoggedIn ) {
            this.apiGetRequest( 'https://api.music.apple.com/v1/me/library/playlists', cb );

            return true;
        } else {
            return false;
        }
    }

    getPlaying ( ): boolean {
        if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
            return this.musicKit.isPlaying;
        } else {
            return !this.audioPlayer.paused;
        }
    }

    findSongOnAppleMusic ( searchTerm: string ): Promise<SearchResult> {
        // TODO: Make storefront adjustable
        return new Promise( ( resolve, reject ) => {
            const queryParameters = {
                'term': searchTerm,
                'types': [ 'songs' ],
            };

            this.musicKit.api.music( 'v1/catalog/ch/search', queryParameters )
                .then( results => {
                    resolve( results );
                } )
                .catch( e => {
                    console.error( e );
                    reject( e );
                } );
        } );
    }

}

export default MusicKitJSWrapper;
