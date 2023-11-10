<template>
    <div class="player">
        <div class="controls">
            <span class="material-symbols-outlined control-icon" :class="audioLoaded ? 'active': 'inactive'" @click="control( 'previous' )">skip_previous</span>
            <span class="material-symbols-outlined control-icon" :class="audioLoaded ? 'active': 'inactive'" @click="control( 'replay10' )">replay_10</span>
            <span class="material-symbols-outlined control-icon play-pause" v-if="!isPlaying && audioLoaded" @click="control( 'play' )">play_arrow</span>
            <span class="material-symbols-outlined control-icon play-pause" v-else-if="isPlaying && audioLoaded" @click="control( 'pause' )">pause</span>
            <span class="material-symbols-outlined control-icon play-pause" style="cursor: default;" v-else>play_disabled</span>
            <span class="material-symbols-outlined control-icon" :class="audioLoaded ? 'active': 'inactive'" @click="control( 'forward10' )">forward_10</span>
            <span class="material-symbols-outlined control-icon" :class="audioLoaded ? 'active': 'inactive'" @click="control( 'next' )" style="margin-right: 1vw;">skip_next</span>
            <span class="material-symbols-outlined control-icon" :class="hasLoadedSongs ? 'active': 'inactive'" v-if="!isShuffleEnabled" @click="control( 'shuffleOn' )">shuffle</span>
            <span class="material-symbols-outlined control-icon" :class="hasLoadedSongs ? 'active': 'inactive'" v-else @click="control( 'shuffleOff' )">shuffle_on</span>
            <span class="material-symbols-outlined control-icon" :class="hasLoadedSongs ? 'active': 'inactive'" v-if="repeatMode === 'off'" @click="control( 'repeatOne' )">repeat</span>
            <span class="material-symbols-outlined control-icon" :class="hasLoadedSongs ? 'active': 'inactive'" v-else-if="repeatMode === 'one'" @click="control( 'repeatAll' )">repeat_one_on</span>
            <span class="material-symbols-outlined control-icon" :class="hasLoadedSongs ? 'active': 'inactive'" v-else-if="repeatMode === 'all'" @click="control( 'repeatOff' )">repeat_on</span>
            <div class="control-icon" id="settings">
                <span class="material-symbols-outlined">info</span>
                <div id="showIP">
                    <h4>IP to connect to:</h4><br>
                    <p>{{ localIP }}:8081</p>
                </div>
            </div>
        </div>
        <div class="song-info">
            <audio v-if="audioLoaded" :src="'http://localhost:8081/getSongFile?filename=' + playingSong.filename" id="music-player"></audio>
            <div class="song-info-wrapper">
                <div v-if="audioLoaded" @click="showFancyView()" style="cursor: pointer;">
                    <span class="material-symbols-outlined image" v-if="!playingSong.hasCoverArt">music_note</span>
                    <img v-else-if="playingSong.hasCoverArt && playingSong.coverArtOrigin === 'api'" :src="playingSong.coverArtURL" class="image">
                    <img v-else :src="'http://localhost:8081/getSongCover?filename=' + playingSong.filename" class="image">
                </div>
                <span class="material-symbols-outlined image" v-else>music_note</span>
                <div class="name">
                    <h3>{{ playingSong.title ?? 'No song selected' }}</h3>
                    <p>{{ playingSong.artist }}</p>
                </div>
                <div class="image"></div>
            </div>
            <div class="playback-pos-info">
                <div style="margin-right: auto;">{{ playbackPosBeautified }}</div>
                <div @click="toggleShowMode()" style="cursor: pointer;">{{ durationBeautified }}</div>
            </div>
            <sliderView :active="audioLoaded" :position="playbackPos" :duration="playingSong.duration" @pos="( p ) => { setPos( p ) }"
                name="player"></sliderView>
        </div>
        <FancyView v-if="isShowingFancyView" :song="playingSong" @control="instruction => { control( instruction ) }" :isPlaying="isPlaying"
            :shuffle="isShuffleEnabled" :repeatMode="repeatMode" :durationBeautified="durationBeautified" 
            :playbackPos="playbackPos" :playbackPosBeautified="playbackPosBeautified"
            @posUpdate="pos => { setPos( pos ) }"></FancyView>
        <Notifications ref="notifications" size="bigger" location="topright"></Notifications>
    </div>
</template>

<style scoped>
    .song-info {
        background-color: #8e9ced;
        height: 13vh;
        width: 50%;
        margin-left: auto;
        margin-right: auto;
        position: relative;
    }

    .image {
        width: 7vh;
        height: 7vh;
        object-fit: cover;
        object-position: center;
        font-size: 7vh;
        margin-left: 1vh;
        margin-top: 1vh;
    }

    .name {
        margin-left: auto;
        margin-right: auto;
    }

    .song-info-wrapper {
        display: flex;
        flex-direction: row;
    }

    .song-info-wrapper h3 {
        margin: 0;
        margin-bottom: 0.5vh;
        margin-top: 1vh;
    }

    .controls {
        margin-left: 5%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .control-icon {
        cursor: pointer;
        font-size: 3vh;
        user-select: none;
    }

    .play-pause {
        font-size: 5vh;
    }

    .inactive {
        color: gray;
        cursor: default;
    }

    .player {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .playback-pos-info {
        display: flex;
        flex-direction: row;
        width: 98%;
        margin-left: 1%;
        position: absolute;
        bottom: 17px;
    }

    #showIP {
        background-color: rgb(63, 63, 63);
        display: none;
        position: absolute;
        min-height: 16vh;
        padding: 2vh;
        min-width: 20vw;
        z-index: 10;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        font-size: 70%;
        border-radius: 5px 10px 10px 10px;
    }

    #showIP h4, #showIP p {
        margin: 0;
    }

    #settings:hover #showIP {
        display: flex;
    }

    #showIP::before {
        content: " ";
        position: absolute;
        bottom: 100%; /* At the bottom of the tooltip */
        left: 0;
        margin-left: 3px;
        border-width: 10px;
        border-style: solid;
        border-color: transparent transparent rgb(63, 63, 63) transparent;
    }
</style>

<script>
import FancyView from './fancyView.vue';
import Notifications from './notifications.vue';
import SliderView from './sliderView.vue';
import { guess } from 'web-audio-beat-detector';

export default {
    data() {
        return {
            playingSong: {},
            audioLoaded: false,
            isPlaying: false,
            isShuffleEnabled: false,
            repeatMode: 'off',
            progressTracker: null,
            playbackPos: 0,
            playbackPosBeautified: '00:00',
            durationBeautified: '--:--',
            hasLoadedSongs: false,
            isShowingFancyView: false,
            notifier: null,
            isShowingRemainingTime: false,
            localIP: ''
        }
    },
    components: {
        SliderView,
        FancyView,
        Notifications,
    },
    methods: {
        play( song, autoplay, doCrossFade = false ) {
            this.playingSong = song;
            this.audioLoaded = true;
            this.init( doCrossFade, autoplay, song.filename );
        },
        // TODO: Make function that connects to status service and add various warnings.
        init( doCrossFade, autoplay, filename ) {
            this.control( 'reset' );
            // TODO: make it support cross-fade
            setTimeout( () => {
                if ( autoplay ) {
                    this.control( 'play' );
                    this.isPlaying = true;
                    this.sendUpdate( 'isPlaying' );
                    this.sendUpdate( 'pos' );
                }
                this.sendUpdate( 'playingSong' );
                const minuteCount = Math.floor( this.playingSong.duration / 60 );
                this.durationBeautified = minuteCount + ':';
                if ( ( '' + minuteCount ).length === 1 ) {
                    this.durationBeautified = '0' + minuteCount + ':';
                }
                const secondCount = Math.floor( this.playingSong.duration - minuteCount * 60 );
                if ( ( '' + secondCount ).length === 1 ) {
                    this.durationBeautified += '0' + secondCount;
                } else {
                    this.durationBeautified += secondCount;
                }
                let musicPlayer = document.getElementById( 'music-player' );
                musicPlayer.onended = () => {
                    if ( musicPlayer.currentTime >= this.playingSong.duration - 1 ) {
                        if ( this.repeatMode !== 'one' ) {
                            this.control( 'next' );
                        } else {
                            musicPlayer.currentTime = 0;
                            this.control( 'play' );
                            this.playbackPos = musicPlayer.currentTime;
                            this.sendUpdate( 'pos' );
                        }
                    }
                }
                if ( !this.playingSong.bpm ) {
                    const audioContext = new AudioContext();
                    fetch( 'http://localhost:8081/getSongFile?filename=' + filename ).then( res => {
                        res.arrayBuffer().then( buf => {
                            audioContext.decodeAudioData( buf, audioBuffer => {
                                guess( audioBuffer ).then( ( data ) => {
                                    this.playingSong.bpm = data.bpm;
                                    this.playingSong.accurateTempo = data.tempo;
                                    this.playingSong.bpmOffset = data.offset;
                                    this.sendUpdate( 'playingSong' );
                                } );
                            } );
                        } );
                    } );
                }
            }, 300 );
        },
        toggleShowMode() {
            this.isShowingRemainingTime = !this.isShowingRemainingTime;
            if ( !this.isShowingRemainingTime ) {
                const minuteCounts = Math.floor( this.playingSong.duration / 60 );
                this.durationBeautified = String( minuteCounts ) + ':';
                if ( ( '' + minuteCounts ).length === 1 ) {
                    this.durationBeautified = '0' + minuteCounts + ':';
                }
                const secondCounts = Math.floor( this.playingSong.duration - minuteCounts * 60 );
                if ( ( '' + secondCounts ).length === 1 ) {
                    this.durationBeautified += '0' + secondCounts;
                } else {
                    this.durationBeautified += secondCounts;
                }
            }
        },
        sendUpdate( update ) {
            let data = {};
            if ( update === 'pos' ) {
                data = this.playbackPos;
            } else if ( update === 'playingSong' ) {
                data = this.playingSong;
            } else if ( update === 'isPlaying' ) {
                data = this.isPlaying;
            }
            let fetchOptions = {
                method: 'post',
                body: JSON.stringify( { 'type': update, 'data': data } ),
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                },
            };
            fetch( 'http://localhost:8081/statusUpdate', fetchOptions ).catch( err => {
                console.error( err );
            } );
        },
        control( action ) {
            // https://css-tricks.com/lets-create-a-custom-audio-player/
            let musicPlayer = document.getElementById( 'music-player' );
            if ( musicPlayer ) {
                if ( action === 'play' ) {
                    this.$emit( 'update', { 'type': 'playback', 'status': true } );
                    musicPlayer.play();
                    this.isPlaying = true;
                    this.progressTracker = setInterval( () => {
                        this.playbackPos = musicPlayer.currentTime;
                        const minuteCount = Math.floor( this.playbackPos / 60 );
                        this.playbackPosBeautified = minuteCount + ':';
                        if ( ( '' + minuteCount ).length === 1 ) {
                            this.playbackPosBeautified = '0' + minuteCount + ':';
                        }
                        const secondCount = Math.floor( this.playbackPos - minuteCount * 60 );
                        if ( ( '' + secondCount ).length === 1 ) {
                            this.playbackPosBeautified += '0' + secondCount;
                        } else {
                            this.playbackPosBeautified += secondCount;
                        }

                        if ( this.isShowingRemainingTime ) {
                            const minuteCounts = Math.floor( ( this.playingSong.duration - this.playbackPos ) / 60 );
                            this.durationBeautified = '-' + String( minuteCounts ) + ':';
                            if ( ( '' + minuteCounts ).length === 1 ) {
                                this.durationBeautified = '-0' + minuteCounts + ':';
                            }
                            const secondCounts = Math.floor( ( this.playingSong.duration - this.playbackPos ) - minuteCounts * 60 );
                            if ( ( '' + secondCounts ).length === 1 ) {
                                this.durationBeautified += '0' + secondCounts;
                            } else {
                                this.durationBeautified += secondCounts;
                            }
                        }
                    }, 20 );
                    this.sendUpdate( 'pos' );
                    this.sendUpdate( 'isPlaying' );
                } else if ( action === 'pause' ) {
                    this.$emit( 'update', { 'type': 'playback', 'status': false } );
                    musicPlayer.pause();
                    this.sendUpdate( 'pos' );
                    try {
                        clearInterval( this.progressTracker );
                        clearInterval( this.notifier );
                    } catch ( err ) {};
                    this.isPlaying = false;
                    this.sendUpdate( 'isPlaying' );
                } else if ( action === 'replay10' ) {
                    musicPlayer.currentTime = musicPlayer.currentTime > 10 ? musicPlayer.currentTime - 10 : 0;
                    this.playbackPos = musicPlayer.currentTime;
                    this.sendUpdate( 'pos' );
                } else if ( action === 'forward10' ) {
                    if ( musicPlayer.currentTime < ( musicPlayer.duration - 10 ) ) {
                        musicPlayer.currentTime = musicPlayer.currentTime + 10;
                        this.playbackPos = musicPlayer.currentTime;
                        this.sendUpdate( 'pos' );
                    } else {
                        if ( this.repeatMode !== 'one' ) {
                            this.control( 'next' );
                        } else {
                            musicPlayer.currentTime = 0;
                            this.playbackPos = musicPlayer.currentTime;
                            this.sendUpdate( 'pos' );
                        }
                    }
                } else if ( action === 'reset' ) {
                    clearInterval( this.progressTracker );
                    this.playbackPos = 0;
                    musicPlayer.currentTime = 0;
                    this.sendUpdate( 'pos' );
                } else if ( action === 'next' ) {
                    this.$emit( 'update', { 'type': 'next' } );
                } else if ( action === 'previous' ) {
                    if ( this.playbackPos > 3 ) {
                        this.playbackPos = 0;
                        musicPlayer.currentTime = 0;
                        this.sendUpdate( 'pos' );
                    } else {
                        this.$emit( 'update', { 'type': 'previous' } );
                    }
                } else if ( action === 'shuffleOff' ) {
                    this.$emit( 'update', { 'type': 'shuffleOff' } );
                    this.isShuffleEnabled = false;
                } else if ( action === 'shuffleOn' ) {
                    this.$emit( 'update', { 'type': 'shuffle' } );
                    this.isShuffleEnabled = true;
                } else if ( action === 'repeatOne' ) {
                    this.repeatMode = 'one';
                } else if ( action === 'repeatAll' ) {
                    this.$emit( 'update', { 'type': 'repeat' } );
                    this.repeatMode = 'all';
                } else if ( action === 'repeatOff' ) {
                    this.$emit( 'update', { 'type': 'repeatOff' } );
                    this.repeatMode = 'off';
                } else if ( action === 'exitFancyView' ) {
                    this.isShowingFancyView = false;
                    this.$emit( 'update', { 'type': 'fancyView', 'status': false } );
                }
            } else if ( action === 'songsLoaded' ) {
                this.$refs.notifications.createNotification( 'Songs loaded successfully', 5, 'ok', 'default' );
                this.hasLoadedSongs = true;
            } else if ( action === 'shuffleOff' ) {
                this.$emit( 'update', { 'type': 'shuffleOff' } );
                this.isShuffleEnabled = false;
            } else if ( action === 'shuffleOn' ) {
                this.$emit( 'update', { 'type': 'shuffle' } );
                this.isShuffleEnabled = true;
            } else if ( action === 'repeatOne' ) {
                this.repeatMode = 'one';
            } else if ( action === 'repeatAll' ) {
                this.$emit( 'update', { 'type': 'repeat' } );
                this.repeatMode = 'all';
            } else if ( action === 'repeatOff' ) {
                this.$emit( 'update', { 'type': 'repeatOff' } );
                this.repeatMode = 'off';
            } else if ( action === 'exitFancyView' ) {
                this.isShowingFancyView = false;
                this.$emit( 'update', { 'type': 'fancyView', 'status': false } );
            }
        },
        setPos( pos ) {
            let musicPlayer = document.getElementById( 'music-player' );
            this.playbackPos = pos;
            musicPlayer.currentTime = pos;
            this.sendUpdate( 'pos' );
        },
        showFancyView() {
            this.$emit( 'update', { 'type': 'fancyView', 'status': true } );
            this.isShowingFancyView = true;
        },
    },
    created() {
        document.addEventListener( 'keydown', ( e ) => {
            if ( e.key === ' ' ) {
                e.preventDefault();
                if ( !this.isPlaying ) {
                    this.control( 'play' );
                } else {
                    this.control( 'pause' );
                }
            } else if ( e.key === 'ArrowRight' ) {
                e.preventDefault();
                this.control( 'next' );
            } else if ( e.key === 'ArrowLeft' ) {
                e.preventDefault();
                this.control( 'previous' );
            }
        } );
        fetch( 'http://localhost:8081/getLocalIP' ).then( res => {
            if ( res.status === 200 ) {
                res.text().then( ip => {
                    this.localIP = ip;
                } );
            }
        } );
    }
}
</script>