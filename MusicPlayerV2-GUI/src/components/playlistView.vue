<template>
    <div>
        <h1>Playlist</h1>
        <div class="playlist-box">
            <div class="song" v-for="song in $props.playlist" v-bind:key="song.id">
                <img :src="song.cover" alt="Song cover" class="song-cover">
                <h3 class="song-title">{{ song.title }}</h3>
                <p class="playing-in">playing in</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { Song } from '@/scripts/song';

    defineProps( { 
        'playlist': {
            default: [],
            required: true,
            type: Array<Song>
        }
    } );
</script>

<style scoped>
    .playlist-box {
        height: 80vh !important;
    }

    .song {
        border: solid var( --primary-color ) 1px;
        padding: 10px;
        margin: 5px;
        width: 50%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }

    .song-title {
        margin-left: 10px;
        margin-right: auto;
    }

    .song-cover {
        height: 70px;
    }
</style>