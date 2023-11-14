const app = Vue.createApp( {
    data() {
        return {
            musicKit: null,
            isLoggedIn: false,
        }
    },
    methods: {
        logInto() {
            if ( !this.musicKit.isAuthorized ) {
                this.musicKit.authorize().then( () => {
                    this.musicKit.play();
                    this.isLoggedIn();
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
                        this.musicKit = MusicKit.getInstance();
                        if ( this.musicKit.isAuthorized ) {
                            this.isLoggedIn = true;
                        }
                    } );
                }
            } );
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