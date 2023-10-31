// eslint-disable-next-line no-undef
const { createApp } = Vue;

createApp( {
    data() {
        return {
            hasLoaded: false,
            songs: {},
            playingSong: {},
            isPlaying: false,
        };
    },
    methods: {
        connect() {
            let source = new EventSource( '/clientDisplayNotifier', { withCredentials: true } );
            let self = this;

            source.onmessage = ( e ) => {
                let data;
                try {
                    data = JSON.parse( e.data );
                } catch ( err ) {
                    data = { 'type': e.data };
                }
                if ( data.type === 'basics' ) {
                    console.log( 'basics' );
                    console.log( data.data );
                } else if ( data.type === 'pos' ) {

                } else if ( data.type === 'isPlaying' ) {
                    
                } else if ( data.type === 'songQueue' ) {
                    
                } else if ( data.type === 'currentlyPlaying' ) {
                    
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
