<template>
    <div style="width: 100%; height: 100%;">
        <progress :id="'progress-slider-' + name" class="progress-slider" :value="sliderProgress" max="1000" @mousedown="( e ) => { setPos( e ) }" 
            :class="active ? '' : 'slider-inactive'"></progress>
        <div v-if="active" id="slider-knob" @mousedown="( e ) => { startMove( e ) }"
            :style="'left: ' + ( parseInt( originalPos ) + parseInt( sliderPos ) ) + 'px;'">
            <div id="slider-knob-style"></div>
        </div>
        <div v-else id="slider-knob" class="slider-inactive" style="left: 0;">
            <div id="slider-knob-style"></div>
        </div>
        <div id="drag-support" @mousemove="e => { handleDrag( e ) }" @mouseup="() => { stopMove(); }"></div>
    </div>
</template>

<style scoped>
    .progress-slider {
        width: 100%;
        margin: 0;
        position: absolute;
        left: 0;
        bottom: 0;
        height: 5px;
        cursor: pointer;
        background-color: #baf4c9;
    }

    .progress-slider::-webkit-progress-value {
        background-color: #baf4c9;
    }

    #slider-knob {
        height: 20px;
        width: 10px;
        display: flex;
        justify-content: flex-start;
        align-items: flex-end;
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 2;
        cursor: grab;
    }

    #slider-knob-style {
        background-color: #baf4c9;
        height: 15px;
        width: 5px;
    }

    #drag-support {
        display: none;
        opacity: 0;
        height: 100vh;
        width: 100vw;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10;
        cursor: grabbing;
    }

    .drag-support-active {
        display: block !important;
    }

    .slider-inactive {
        cursor: default !important;
    }
</style>

<script>
export default {
    props: {
        style: {
            type: Object,
        },
        position: {
            type: Number,
            default: 0,
        },
        duration: {
            type: Number,
            default: 100
        },
        active: {
            type: Boolean,
            default: true,
        },
        name: {
            type: String,
            default: '1',
        }
    },
    data () {
        return {
            offset: 0,
            isDragging: false,
            sliderPos: 0,
            originalPos: 0,
            sliderProgress: 0,
        }
    },
    methods: {
        handleDrag( e ) {
            if ( this.isDragging ) {
                if ( 0 < this.originalPos + e.screenX - this.offset && this.originalPos + e.screenX - this.offset < document.getElementById( 'progress-slider-' + this.name ).clientWidth - 5 ) {
                    this.sliderPos = e.screenX - this.offset;
                    this.calcProgressPos();
                }
            }
        },
        startMove( e ) {
            this.offset = e.screenX;
            this.isDragging = true;
            document.getElementById( 'drag-support' ).classList.add( 'drag-support-active' );
        },
        stopMove() {
            this.originalPos += parseInt( this.sliderPos );
            this.isDragging = false;
            this.offset = 0;
            this.sliderPos = 0;
            document.getElementById( 'drag-support' ).classList.remove( 'drag-support-active' );
            this.calcPlaybackPos();
        },
        setPos ( e ) {
            if ( this.active ) {
                this.originalPos = e.offsetX;
                this.calcProgressPos();
                this.calcPlaybackPos();
            }
        },
        calcProgressPos() {
            this.sliderProgress = Math.ceil( ( this.originalPos + parseInt( this.sliderPos ) ) / ( document.getElementById( 'progress-slider-' + this.name ).clientWidth - 5 ) * 1000 );
        },
        calcPlaybackPos() {
            this.$emit( 'pos', Math.round( ( this.originalPos + parseInt( this.sliderPos ) ) / ( document.getElementById( 'progress-slider-' + this.name ).clientWidth - 5 ) * this.duration ) );
        }
    },
    watch: {
        position() {
            if ( !this.isDragging ) {
                this.sliderProgress = Math.ceil( this.position / this.duration * 1000 + 2 );
                this.originalPos = Math.ceil( this.position / this.duration * ( document.getElementById( 'progress-slider-' + this.name ).scrollWidth - 5 ) );
            }
        }
    }
}
</script>