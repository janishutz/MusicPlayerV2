<template>
    <div style="width: 100%; height: 100%;">
        <progress :id="'progress-slider-' + name" class="progress-slider" :value="sliderProgress" max="1000" @mousedown="( e ) => { setPos( e ) }" 
            :class="active ? '' : 'slider-inactive'"></progress>
        <div v-if="active" id="slider-knob" @mousedown="( e ) => { startMove( e ) }"
            :style="'left: ' + ( originalPos + sliderPos ) + 'px;'">
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
        background-color: var( --slider-color );
    }

    .progress-slider::-webkit-progress-value {
        background-color: var( --slider-color );
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
        background-color: var( --slider-color );
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

<script setup lang="ts">
    import { ref, watch } from 'vue';

    const props = defineProps( {
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
    } );

    const offset = ref( 0 );
    const isDragging = ref( false );
    const sliderPos = ref( 0 );
    const originalPos= ref( 0 );
    const sliderProgress = ref( 0 );

    const handleDrag = ( e: MouseEvent ) => {
        if ( isDragging.value ) {
            if ( 0 < originalPos.value + e.screenX - offset.value && originalPos.value + e.screenX - offset.value < ( document.getElementById( 'progress-slider-' + props.name ) as HTMLProgressElement ).clientWidth - 5 ) {
                sliderPos.value = e.screenX - offset.value;
                calcProgressPos();
            }
        }
    }
    const startMove = ( e: MouseEvent ) => {
        offset.value = e.screenX;
        isDragging.value = true;
        ( document.getElementById( 'drag-support' ) as HTMLDivElement ).classList.add( 'drag-support-active' );
    }
    const stopMove = () => {
        originalPos.value += sliderPos.value;
        isDragging.value = false;
        offset.value = 0;
        sliderPos.value = 0;
        ( document.getElementById( 'drag-support' ) as HTMLDivElement ).classList.remove( 'drag-support-active' );
        calcPlaybackPos();
    }
    const setPos = ( e: MouseEvent ) => {
        if ( props.active ) {
            originalPos.value = e.offsetX;
            calcProgressPos();
            calcPlaybackPos();
        }
    }
    const calcProgressPos = () => {
        sliderProgress.value = Math.ceil( ( originalPos.value + sliderPos.value ) / ( ( document.getElementById( 'progress-slider-' + props.name ) as HTMLProgressElement ).clientWidth - 5 ) * 1000 );
    }
    const calcPlaybackPos = () => {
        emits( 'pos', Math.round( ( originalPos.value + sliderPos.value ) / ( ( document.getElementById( 'progress-slider-' + props.name ) as HTMLProgressElement ).clientWidth - 5 ) * props.duration ) );
    }
    watch( () => props.position, () => {
        if ( !isDragging.value ) {
            sliderProgress.value = Math.ceil( props.position / props.duration * 1000 + 2 );
            originalPos.value = Math.ceil( props.position / props.duration * ( ( document.getElementById( 'progress-slider-' + props.name ) as HTMLProgressElement ).scrollWidth - 5 ) );
        }
    } )

    const emits = defineEmits( [ 'pos' ] );
</script>