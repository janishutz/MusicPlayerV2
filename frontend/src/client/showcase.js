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
            visualizationSettings: 'mic',
            micAnalyzer: null,
            beatDetected: false,
            colorThief: null,
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
        getTimeUntil(  ) {
            return ( song ) => {
                let timeRemaining = 0;
                for ( let i = this.queuePos; i < this.songs.length; i++ ) {
                    if ( this.songs[ i ] == song ) {
                        break;
                    }
                    timeRemaining += parseInt( this.songs[ i ].duration );
                }
                if ( timeRemaining === 0 ) {
                    return 'Currently playing';
                } else {
                    return 'Playing in less than ' + Math.ceil( timeRemaining / 60 - this.pos / 60 )  + 'min';
                }
            }
        }
    },
    methods: {
        startTimeTracker () {
            this.startTime = new Date().getTime();
            this.timeTracker = setInterval( () => {
                this.pos += 0.075;
                this.progressBar = ( this.pos / this.playingSong.duration ) * 1000;
            }, 75 );

            this.timeCorrector = setInterval( () => {
                this.pos = this.oldPos + ( new Date().getTime() - this.startTime ) / 1000;
                this.progressBar = ( this.pos / this.playingSong.duration ) * 1000;
            }, 5000 );
        },
        stopTimeTracker () {
            clearInterval( this.timeTracker );
            clearInterval( this.timeCorrector );
            this.oldPos = this.pos;
        },
        getImageData() {
            return new Promise( ( resolve, reject ) => {
                if ( this.playingSong.hasCoverArt ) {
                    setTimeout( () => {
                        const img = document.getElementById( 'current-image' );
                        if ( img.complete ) {
                            resolve( this.colorThief.getPalette( img ) );
                        } else {
                            img.addEventListener( 'load', () => {
                                resolve( this.colorThief.getPalette( img ) );
                            } );
                        }
                    }, 500 );
                } else {
                    reject( 'no image' );
                }
            } );
        },
        connect() {
            this.colorThief = new ColorThief();
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
                    this.startTime = new Date().getTime();
                    this.progressBar = this.pos / this.playingSong.duration * 1000;
                    this.queuePos = data.data.queuePos ?? 0;
                    this.getImageData().then( palette => {
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
                    this.getImageData().then( palette => {
                        this.colourPalette = palette;
                        this.handleBackground();
                    } ).catch( () => {
                        this.colourPalette = [ [ 255, 0, 0 ], [ 0, 255, 0 ], [ 0, 0, 255 ] ];
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
            let colourDetails = [];
            let colours = [];
            let differentEnough = true;
            if ( this.colourPalette[ 0 ] ) {
                for ( let i in this.colourPalette ) {
                    for ( let colour in colourDetails ) {
                        const colourDiff = ( Math.abs( colourDetails[ colour ][ 0 ] - this.colourPalette[ i ][ 0 ] ) / 255
                            + Math.abs( colourDetails[ colour ][ 1 ] - this.colourPalette[ i ][ 1 ] ) / 255
                            + Math.abs( colourDetails[ colour ][ 2 ] - this.colourPalette[ i ][ 2 ] ) / 255 ) / 3 * 100;
                        if ( colourDiff > 15 ) {
                            differentEnough = true;
                        }
                    }
                    if ( differentEnough ) {
                        colourDetails.push( this.colourPalette[ i ] );
                        colours.push( 'rgb(' + this.colourPalette[ i ][ 0 ] + ',' + this.colourPalette[ i ][ 1 ] + ',' + this.colourPalette[ i ][ 2 ] + ')' );
                    }
                    differentEnough = false;
                }
            }
            let outColours = 'conic-gradient(';
            if ( colours.length < 3 ) {
                for ( let i = 0; i < 3; i++ ) {
                    if ( colours[ i ] ) {
                        outColours += colours[ i ] + ',';
                    } else {
                        if ( i === 0 ) {
                            outColours += 'blue,';
                        } else if ( i === 1 ) {
                            outColours += 'green,';
                        } else if ( i === 2 ) {
                            outColours += 'red,';
                        }
                    }
                }
            } else if ( colours.length < 11 ) {
                for ( let i in colours ) {
                    outColours += colours[ i ] + ',';
                }
            } else {
                for ( let i = 0; i < 10; i++ ) {
                    outColours += colours[ i ] + ',';
                }
            }
            outColours += colours[ 0 ] ?? 'blue' + ')';

            $( '#background' ).css( 'background', outColours );
            this.setVisualization();
        },
        setVisualization () {
            if ( this.visualizationSettings === 'bpm' ) {
                if ( this.playingSong.bpm && this.isPlaying ) {
                    $( '.beat' ).show();
                    $( '.beat' ).css( 'animation-duration', 60 / this.playingSong.bpm );
                    $( '.beat' ).css( 'animation-delay', this.pos % ( 60 / this.playingSong.bpm  * this.pos ) + this.playingSong.bpmOffset - ( 60 / this.playingSong.bpm  * this.pos / 2 ) );
                } else {
                    $( '.beat' ).hide();
                }
                try {
                    clearInterval( this.micAnalyzer );
                } catch ( err ) {}
            } else if ( this.visualizationSettings === 'off' ) {
                $( '.beat' ).hide();
                try {
                    clearInterval( this.micAnalyzer );
                } catch ( err ) {}
            } else if ( this.visualizationSettings === 'mic' ) {
                $( '.beat-manual' ).hide();
                try {
                    clearInterval( this.micAnalyzer );
                } catch ( err ) {}
                this.micAudioHandler();
            }
        },
        micAudioHandler () {
            const audioContext = new ( window.AudioContext || window.webkitAudioContext )();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array( bufferLength );

            navigator.mediaDevices.getUserMedia( { audio: true } ).then( ( stream ) => {
                const mic = audioContext.createMediaStreamSource( stream );
                mic.connect( analyser );
                analyser.getByteFrequencyData( dataArray );
                let prevSpectrum = null;
                let threshold = 10; // Adjust as needed
                this.beatDetected = false;
                this.micAnalyzer = setInterval( () => {
                    analyser.getByteFrequencyData( dataArray );
                    // Convert the frequency data to a numeric array
                    const currentSpectrum = Array.from( dataArray );

                    if ( prevSpectrum ) {
                        // Calculate the spectral flux
                        const flux = this.calculateSpectralFlux( prevSpectrum, currentSpectrum );

                        if ( flux > threshold && !this.beatDetected ) {
                            // Beat detected
                            this.beatDetected = true;
                            this.animateBeat();
                        }
                    }
                    prevSpectrum = currentSpectrum;
                }, 20 );
            } );
        },
        animateBeat () {
            $( '.beat-manual' ).stop();
            const duration = Math.ceil( 60 / this.playingSong.bpm * 500 ) - 50;
            $( '.beat-manual' ).fadeIn( 50 );
            setTimeout( () => {
                $( '.beat-manual' ).fadeOut( duration );
                setTimeout( () => {
                    $( '.beat-manual' ).stop();
                    this.beatDetected = false;
                }, duration );
            }, 50 );
        },
        calculateSpectralFlux( prevSpectrum, currentSpectrum ) {
            let flux = 0;
        
            for ( let i = 0; i < prevSpectrum.length; i++ ) {
                const diff = currentSpectrum[ i ] - prevSpectrum[ i ];
                flux += Math.max( 0, diff );
            }
        
            return flux;
        }
    },
    mounted() {
        this.connect();
        if ( this.visualizationSettings === 'mic' ) {
            this.micAudioHandler();
        }
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
