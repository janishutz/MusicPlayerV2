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
                    this.queuePos = data.data.queuePos ?? 0;
                    getColourPalette( '/getSongCover?filename=' + data.data.playingSong.filename ).then( palette => {
                        this.colourPalette = palette;
                    } ).catch( () => {
                        this.colourPalette = [ { 'r': 255, 'g': 0, 'b': 0 }, { 'r': 0, 'g': 255, 'b': 0 }, { 'r': 0, 'g': 0, 'b': 255 } ]
                    } );
                } else if ( data.type === 'pos' ) {
                    this.pos = data.data;
                } else if ( data.type === 'isPlaying' ) {
                    this.isPlaying = data.data;
                } else if ( data.type === 'songQueue' ) {
                    this.songs = data.data;
                } else if ( data.type === 'playingSong' ) {
                    this.playingSong = data.data;
                    getColourPalette( '/getSongCover?filename=' + data.data.filename ).then( palette => {
                        this.colourPalette = palette;
                    } ).catch( () => {
                        this.colourPalette = [ { 'r': 255, 'g': 0, 'b': 0 }, { 'r': 0, 'g': 255, 'b': 0 }, { 'r': 0, 'g': 0, 'b': 255 } ]
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
    }, 
    mounted() {
        this.connect();
    }
} ).mount( '#app' );
