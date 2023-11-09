// eslint-disable-next-line no-undef
const { createApp } = Vue;

createApp( {
    data() {
        return {
            hasLoaded: false,
            songs: [],
            playingSong: {},
            isPlaying: false,
            pos: 0,
            queuePos: 0,
            colourPalette: [],
            progressBar: 0,
            timeTracker: null,
        };
    },
    computed: {
        songQueue() {
            let ret = [];
            for ( let song in this.songs ) {
                if ( parseInt( song ) >= this.queuePos ) {
                    ret.push( this.songs[ song ] );
                }
            }
            return ret;
        },
        getTimeUntil() {
            return ( song ) => {
                let timeRemaining = 0;
                for ( let i = this.queuePos; i < this.songs.length; i++ ) {
                    if ( this.songs[ i ] == song ) {
                        break;
                    }
                    timeRemaining += parseInt( this.songs[ i ].duration );
                }
                if ( this.isPlaying ) {
                    if ( timeRemaining === 0 ) {
                        return 'Currently playing';
                    } else {
                        return 'Playing in less than ' + Math.ceil( timeRemaining / 60 - this.pos / 60 )  + 'min';
                    }
                } else {
                    if ( timeRemaining === 0 ) {
                        return 'Plays next';
                    } else {
                        return 'Playing less than ' + Math.ceil( timeRemaining / 60 - this.pos / 60 )  + 'min after starting to play';
                    }
                }
            }
        }
    },
    methods: {
        startTimeTracker () {
            this.timeTracker = setInterval( () => {
                this.pos = ( new Date().getTime() - this.playingSong.startTime ) / 1000 + this.oldPos;
                this.progressBar = ( this.pos / this.playingSong.duration ) * 1000;
                if ( isNaN( this.progressBar ) ) {
                    this.progressBar = 0;
                }
            }, 100 );
        },
        stopTimeTracker () {
            clearInterval( this.timeTracker );
            this.oldPos = this.pos;
        },
        connect() {
            let source = new EventSource( '/clientDisplayNotifier', { withCredentials: true } );
            source.onmessage = ( e ) => {
                let data;
                try {
                    data = JSON.parse( e.data );
                } catch ( err ) {
                    data = { 'type': e.data };
                }
                if ( data.type === 'basics' ) {
                    this.isPlaying = data.data.isPlaying ?? false;
                    this.playingSong = data.data.playingSong ?? {};
                    this.songs = data.data.songQueue ?? [];
                    this.pos = data.data.pos ?? 0;
                    this.oldPos = data.data.pos ?? 0;
                    this.progressBar = this.pos / this.playingSong.duration * 1000;
                    this.queuePos = data.data.queuePos ?? 0;
                } else if ( data.type === 'pos' ) {
                    this.pos = data.data;
                    this.oldPos = data.data;
                    this.progressBar = data.data / this.playingSong.duration * 1000;
                } else if ( data.type === 'isPlaying' ) {
                    this.isPlaying = data.data;
                } else if ( data.type === 'songQueue' ) {
                    this.songs = data.data;
                } else if ( data.type === 'playingSong' ) {
                    this.playingSong = data.data;
                } else if ( data.type === 'queuePos' ) {
                    this.queuePos = data.data;
                }
            };

            source.onopen = () => {
                this.hasLoaded = true;
            };
                
            let self = this;

            source.addEventListener( 'error', function( e ) {
                if ( e.eventPhase == EventSource.CLOSED ) source.close();

                if ( e.target.readyState == EventSource.CLOSED ) {
                    console.log( 'disconnected' );
                }

                setTimeout( () => {
                    self.connect();
                }, 1000 );
            }, false );
        },
    },
    mounted() {
        this.connect();
    },
    watch: {
        isPlaying( value ) {
            if ( value ) {
                this.startTimeTracker();
            } else {
                this.stopTimeTracker();
            }
        }
    }
} ).mount( '#app' );
