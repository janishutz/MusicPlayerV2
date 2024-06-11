interface Song {
    /**
     * The ID. Either the apple music ID, or if from local disk, an ID starting in local_
     */
    id: string;

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



class MusicKitJSWrapper {
    playingSongID: number;
    playlist: Song[];
    queue: number[];
    config: Config;
    musicKit: any;
    isLoggedIn: boolean;

    constructor () {
        this.playingSongID = 0;
        this.playlist = [];
        this.queue = [];
        this.config = {
            devToken: '',
            userToken: '',
        };
        this.isLoggedIn = false;

        const self = this;

        if ( !window.MusicKit ) {
            document.addEventListener( 'musickitloaded', () => {
                self.init();
            } );
        } else {
            this.init();
        }
    }

    logIn () {
        if ( !this.musicKit.isAuthorized ) {
            this.musicKit.authorize().then( () => {
                this.isLoggedIn = true;
                this.init();
            } );
        } else {
            this.musicKit.authorize().then( () => {
                this.isLoggedIn = true;
                this.init();
            } );
        }
    }

    init () {
        fetch( localStorage.getItem( 'url' ) + '/getAppleMusicDevToken', { credentials: 'include' } ).then( res => {
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
                        this.apiGetRequest( 'https://api.music.apple.com/v1/me/library/playlists', this.handleAPIReturns );
                    } );
                } );
            }
        } );
    }

    handleAPIReturns ( data: object ) {
        console.log( data );
    }

    getUserPlaylists () {

    }

    apiGetRequest ( url: string, callback: ( data: object ) => void ) {
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
        } else return false;
    }

    /**
     * Start playing the song at the current songID.
     * @returns {void}
     */
    play (): void {

    }

    /**
     * Start playing the current song
     * @returns {void}
     */
    pause (): void {

    }

    /**
     * Skip to the next song
     * @returns {void}
     */
    skip (): void {

    }


    /**
     * Return to start of song, or if within four seconds of start of the song, go to previous song.
     * @returns {void}
     */
    previous (): void {

    }

    /**
     * Go to a specific position in the song. If position > song duration, go to next song
     * @param {number} pos The position in milliseconds since start of the song
     * @returns {void}
     */
    goToPos ( pos: number ): void {

    }

    // TODO: think about queue handling
    /**
     * Set, if the queue should be shuffled
     * @param {boolean} enable True to enable shuffle, false to disable
     * @returns {void}
     */
    shuffle ( enable: boolean ): void {

    }

    /**
     * Set the repeat mode
     * @param {string} repeatType The repeat type. Can be '', '_on' or '_one_on'
     * @returns {void}
     */
    repeat ( repeatType: string ): void {

    }

    /**
     * Set the playlist to play.
     * @param {Song[]} pl Playlist to play. An array of songs
     * @returns {void}
     */
    setPlaylist ( pl: Song[] ): void {

    }

    /**
     * Set which song (by Song-ID) to play.
     * @param {string} id The song ID (apple music ID or internal ID, if from local drive)
     * @returns {void}
     */
    setCurrentlyPlayingSongID ( id: string ): void {

    }

    /**
     * Insert a song into the currently playing playlist
     * @param {Song} song A song using the Song object
     * @param {number} pos Position in the queue to insert it into
     * @returns {void}
     */
    insertSong ( song: Song, pos: number ): void {

    }

    /**
     * Remove a song from the queue
     * @param {string} id Song ID to remove.
     * @returns {void}
     */
    removeSong ( id: string ): void {

    }

    /**
     * Get the playlist, as it will play
     * @returns {Song[]}
     */
    getOrderedPlaylist (): Song[] {
        return this.playlist;
    }

    /**
     * Get the playlist, ignoring order specified by the queue.
     * @returns {Song[]}
     */
    getPlaylist (): Song[] {
        return this.playlist;
    }

    /**
     * Get the position of the playback head. Returns time in ms
     * @returns {number}
     */
    getPlaybackPos (): number {
        return 0;
    }

    /**
     * Returns the currently playing song object
     * @returns {Song}
     */
    getPlayingSong (): Song {
        return this.playlist[ this.playingSongID ];
    }

    /**
     * Returns the ID of the currently playing song
     * @returns {string}
     */
    getPlayingSongID (): string {
        return this.playlist[ this.playingSongID ].id;
    }

    /**
     * Returns the index in the playlist of the currently playing song
     * @returns {number}
     */
    getPlayingIndex (): number {
        return this.playingSongID;
    }
}

export default MusicKitJSWrapper;