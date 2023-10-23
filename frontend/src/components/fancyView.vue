<template>
    <div class="fancy-view">
        <span class="material-symbols-outlined image" v-if="!song.hasCoverArt">music_note</span>
        <img v-else :src="'http://localhost:8081/getSongCover?filename=' + song.filename" class="image">
    </div>
</template>

<style scoped>
    .fancy-view {
        display: block;
        position: fixed;
        z-index: 20;
        height: 100vh;
        width: 100vw;
        top: 0;
        left: 0;
        background-color: var( --background-color );
    }
</style>

<script>
    export default {
        methods: {
            control ( instruction ) {

            }
        },
        props: {
            song: {
                type: Object,
            }
        }
    }
</script>