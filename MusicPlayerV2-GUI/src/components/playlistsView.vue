<template>
    <div class="playlists">
        <h3 style="width: fit-content;">Your playlists</h3>
        <div v-if="$props.playlists ? $props.playlists.length < 1 : true">
            loading...
            <!-- TODO: Make prettier -->
        </div>
        <div class="playlist-wrapper">
            <div v-for="pl in $props.playlists" v-bind:key="pl.id" class="playlist" @click="selectPlaylist( pl.id )">
                {{ pl.attributes.name }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    defineProps( {
        'playlists': {
            'default': [],
            'type': Array<any>,
            'required': true,
        }
    } );

    const emits = defineEmits( [ 'selected-playlist' ] );

    const selectPlaylist = ( id: string ) => {
        emits( 'selected-playlist', id );
    }
</script>

<style scoped>
    .playlists {
        width: 100%;
        height: 75vh;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .playlist-wrapper {
        width: 85%;
        overflow-y: scroll;
        overflow-x: hidden;
    }

    .playlist {
        width: 100%;
        padding: 15px;
        border: solid var( --primary-color ) 1px;
        border-radius: 5px;
        margin: 1px;
        cursor: pointer;
        user-select: none;
    }
</style>