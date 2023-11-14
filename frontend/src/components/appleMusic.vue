<template>
    <div>
        <h1>AppleMusic</h1>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                devTokenAvailable: false,
                musicKit: null,
            }
        },
        methods: {
            prepare() {
                document.addEventListener( 'musickitloaded', function() {
                    fetch( 'http://localhost:8081/getAppleMusicDevToken' ).then( res => {
                        if ( res.status === 200 ) {
                            this.devTokenAvailable = true;
                            res.text().then( token => {
                                this.musicKit = MusicKit.configure({
                                    developerToken: token,
                                    app: {
                                        name: 'MusicPlayer',
                                        build: '2.1.0'
                                    }
                                } );
                                setTimeout( () => {
                                    this.musicKit.authorize();
                                }, 100 );
                            } );
                        }
                    } );
                });
            }
        },
        created() {
            window.addEventListener( 'DOMContentLoaded', () => {
                this.prepare();
            } );
        }
    }

</script>