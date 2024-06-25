type Origin = 'apple-music' | 'disk';

interface Song {
    /**
     * The ID. Either the apple music ID, or if from local disk, an ID starting in local_
     */
    id: string;

    /**
     * Origin of the song
     */
    origin: Origin;

    /**
     * The cover image as a URL
     */
    cover: string;

    /**
     * The artist of the song
     */
    artist: string;

    /**
     * The name of the song
     */
    title: string;

    /**
     * Duration of the song in milliseconds
     */
    duration: number;

    /**
     * (OPTIONAL) The genres this song belongs to. Can be displayed on the showcase screen, but requires settings there
     */
    genres?: string[];

    /**
     * (OPTIONAL) This will be displayed in brackets on the showcase screens
     */
    additionalInfo?: string;
}

interface Config {
    devToken: string;
    userToken: string;
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

    constructor () {
        this.playingSongID = 0;
        this.playlist = [];
        this.queue = [];
        this.config = {
            devToken: '',
            userToken: '',
        };
        this.isShuffleEnabled = false;
        this.repeatMode = 'off';
        this.isPreparedToPlay = false;
        this.isLoggedIn = false;
        this.hasEncounteredAuthError = false;

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
            } ).catch( () => {
                this.hasEncounteredAuthError = true;
            } );
        } else {
            this.musicKit.authorize().then( () => {
                this.isLoggedIn = true;
                this.init();
            } ).catch( () => {
                this.hasEncounteredAuthError = true;
            } );
        }
    }

    /**
     * Initialize MusicKitJS. Should not be called. Use logIn instead, which first tries to log the user in, then calls this method.
     * @returns {void}
     */
    init (): void {
        fetch( localStorage.getItem( 'url' ) + '/getAppleMusicDevToken', { credentials: 'include' } ).then( res => {
            if ( res.status === 200 ) {
                res.text().then( token => {
                    // MusicKit global is now defined
                    MusicKit.configure( {
                        developerToken: token,
                        app: {
                            name: 'MusicPlayer',
                            build: '3'
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
        return [ this.isLoggedIn, this.hasEncounteredAuthError ];
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
                        } catch( err ) { /* empty */}
                    } );
                } else {
                    try {
                        callback( { 'status': 'error', 'error': res.status } );
                    } catch( err ) { /* empty */}
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

    /**
     * Prepare a specific song in the queue for playing and start playing
     * @param {number} playlistID The ID of the song in the playlist to prepare to play
     * @returns {boolean} Returns true, if successful, false, if playlist is missing / empty. Set that first
     */
    prepare ( playlistID: number ): boolean {
        if ( this.playlist.length > 0 ) {
            this.playingSongID = playlistID;
            this.isPreparedToPlay = true;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Control the player
     * @param {ControlAction} action Action to take on the player
     * @returns {void}
     */
    control ( action: ControlAction ): void {
        switch ( action ) {
            case "play":
                if ( this.isPreparedToPlay ) {
                    if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                        this.musicKit.play();
                    } else {
                        // TODO: Implement
                    }
                } else {
                    return;
                }
                break;
            case "pause":
                if ( this.isPreparedToPlay ) {
                    if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                        this.musicKit.pause();
                    } else {
                        // TODO: Implement
                    }
                } else {
                    return;
                }
                break;
            case "back-10":
                if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                    this.musicKit.seekToTime( this.musicKit.currentPlaybackTime > 10 ? this.musicKit.currentPlaybackTime - 10 : 0 );
                } else {
                    // TODO: Implement
                }
                break;
            case "skip-10":
                if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
                    if ( this.musicKit.currentPlaybackTime < ( this.playlist[ this.playingSongID ].duration - 10 ) ) {
                        this.musicKit.seekToTime( this.musicKit.currentPlaybackTime + 10 );
                    } else {
                        if ( this.repeatMode !== 'once' ) {
                            this.control( 'next' );
                        } else {
                            this.musicKit.seekToTime( 0 );
                        }
                    }
                } else {
                    // TODO: Finish
                    // if ( this.audioPlayer.currentTime < ( this.playlist[ this.playingSongID ].duration - 10 ) ) {
                    //     this.audioPlayer.currentTime = this.audioPlayer.currentTime + 10;
                    //     this.pos = this.audioPlayer.currentTime;
                    //     this.sendUpdate( 'pos' );
                    // } else {
                    //     if ( this.repeatMode !== 'one' ) {
                    //         this.control( 'next' );
                    //     } else {
                    //         this.audioPlayer.currentTime = 0;
                    //         this.pos = this.audioPlayer.currentTime;
                    //         this.sendUpdate( 'pos' );
                    //     }
                    // }
                }
                break;
            case "next":
                //
                break;
            case "previous":
        }
    }

    setShuffle ( enabled: boolean ) {
        this.isShuffleEnabled = enabled;
        // TODO: Shuffle playlist
    }

    setRepeatMode ( mode: RepeatMode ) {
        this.repeatMode = mode;
    }

    goToPos ( pos: number ) {
        if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
            this.musicKit.seekToTime( pos );
        } else {
            // TODO: Implement
        }
    }

    /**
     * Get the current position of the play heed. Will return in ms since start of the song
     * @returns {number}
     */
    getPlaybackPos (): number {
        if ( this.playlist[ this.playingSongID ].origin === 'apple-music' ) {
            return this.musicKit.currentPlaybackTime;
        } else {
            return 0;
            // TODO: Implement
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

    // findSongOnAppleMusic ( searchTerm: string ): Song => {
    // TODO: Implement
    // }
}

export default MusicKitJSWrapper;