<template>
    <div class="media-pool">
        <div v-if="hasLoadedSongs">
            <div v-for="song in songQueue">{{ song }}</div>
        </div>
        <div v-else class="no-songs">
            <h3>No songs loaded</h3>
            <button @click="loadSongs()">Load songs</button>
        </div>
    </div>
</template>

<style>
    .media-pool {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .no-songs {
        height: 50vh;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }
</style>

<script>
    export default {
        name: 'HomeView',
        data() {
            return {
                hasLoadedSongs: false,
                songQueue: [],
                loadedDirs: [],
                allowedFiletypes: [ '.mp3', '.wav' ]
            }
        },
        methods: {
            getLoadedDirs () {

            },
            loadSongs() {
                fetch( 'http://localhost:8081/openSongs' ).then( res => {
                    if ( res.status === 200 ) {
                        res.json().then( json => {
                            this.hasLoadedSongs = true;
                            this.loadedDirs = json.data;
                            this.indexFiles();
                        } );
                    }
                } );
            },
            indexFiles () {
                for ( let dir in this.loadedDirs ) {
                    fetch( 'http://localhost:8081/indexDirs?dir=' + this.loadedDirs[ dir ] ).then( res => {
                        if ( res.status === 200 ) {
                            res.json().then( json => {
                                for ( let file in json ) {
                                    const fileType = json[ file ].slice( json[ file ].indexOf( '.' ), json[ file ].length );
                                    if ( this.allowedFiletypes.includes( fileType ) ) {
                                        this.songQueue.push( json[ file ] );
                                    }
                                }
                            } );
                        }
                    } );
                }
            }
        }
    }
</script>