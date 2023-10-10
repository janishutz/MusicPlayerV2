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
            }
        },
        methods: {
            loadSongs() {
                fetch( 'http://localhost:8081/openSongs' )
            }
        }
    }
</script>