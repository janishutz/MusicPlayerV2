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
            startTime: 0,
            offsetTime: 0,
            progressBar: 0,
            timeTracker: null,
            timeCorrector: null,
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
        }
    },
    methods: {
        startTimeTracker () {
            this.startTime = new Date().getTime();
            this.timeTracker = setInterval( () => {
                this.pos += 0.075;
                this.progressBar = this.pos / this.playingSong.duration * 1000;
            }, 75 );

            this.timeCorrector = setInterval( () => {
                this.pos = this.oldPos + ( new Date().getTime() - this.startTime ) / 1000;
                this.progressBar = this.pos / this.playingSong.duration * 1000;
            }, 5000 );
        },
        stopTimeTracker () {
            clearInterval( this.timeTracker );
            clearInterval( this.timeCorrector );
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
                    if ( this.isPlaying ) this.startTimeTracker();
                    getColourPalette( '/getSongCover?filename=' + data.data.playingSong.filename ).then( palette => {
                        this.colourPalette = palette;
                        this.handleBackground();
                    } ).catch( () => {
                        this.colourPalette = [ { 'r': 255, 'g': 0, 'b': 0 }, { 'r': 0, 'g': 255, 'b': 0 }, { 'r': 0, 'g': 0, 'b': 255 } ];
                        this.handleBackground();
                    } );
                } else if ( data.type === 'pos' ) {
                    this.pos = data.data;
                    this.oldPos = data.data;
                    this.startTime = new Date().getTime();
                    this.progressBar = data.data / this.playingSong.duration * 1000;
                } else if ( data.type === 'isPlaying' ) {
                    this.isPlaying = data.data;
                    this.handleBackground();
                } else if ( data.type === 'songQueue' ) {
                    this.songs = data.data;
                } else if ( data.type === 'playingSong' ) {
                    this.playingSong = data.data;
                    getColourPalette( '/getSongCover?filename=' + data.data.filename ).then( palette => {
                        this.colourPalette = palette;
                        this.handleBackground();
                    } ).catch( () => {
                        this.colourPalette = [ { 'r': 255, 'g': 0, 'b': 0 }, { 'r': 0, 'g': 255, 'b': 0 }, { 'r': 0, 'g': 0, 'b': 255 } ];
                        this.handleBackground();
                    } );
                } else if ( data.type === 'queuePos' ) {
                    this.queuePos = data.data;
                }
            };

            source.onopen = () => {
                this.hasLoaded = true;
            };
                
            source.addEventListener( 'error', function( e ) {
                if ( e.eventPhase == EventSource.CLOSED ) source.close();

                if ( e.target.readyState == EventSource.CLOSED ) {
                    console.log( 'disconnected' );
                }
            }, false );
        },
        handleBackground() {
            // TODO: Consider using mic and realtime-bpm-analyzer
            let colours = {};
            if ( this.colourPalette[ 0 ] ) {
                for ( let i = 0; i < 3; i++ ) {
                    colours[ i ] = 'rgb(' + this.colourPalette[ i ].r + ',' + this.colourPalette[ i ].g + ',' + this.colourPalette[ i ].b + ')';
                }
            }
            $( '#background' ).css( 'background', `conic-gradient( ${ colours[ 0 ] }, ${ colours[ 1 ] }, ${ colours[ 2 ] }, ${ colours[ 0 ] } )` );
            // if ( this.playingSong.bpm && this.isPlaying ) {
            //     $( '.beat' ).show();
            //     $( '.beat' ).css( 'animation-duration', 60 / this.playingSong.bpm );
            //     $( '.beat' ).css( 'animation-delay', this.pos % ( 60 / this.playingSong.bpm  * this.pos ) );
            // } else {
            //     $( '.beat' ).hide();
            // }
        }
    },
    mounted() {
        this.connect();
        // Initialize Web Audio API components
        const audioContext = new ( window.AudioContext || window.webkitAudioContext )();
        // Start audio analysis
        navigator.mediaDevices.getUserMedia( { audio: true } ).then( ( stream ) => {
            
        } );
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
