<template>
    <div class="playlists">
        <h3 style="width: fit-content;">
            Your playlists
        </h3>
        <div v-if="( $props.playlists ? $props.playlists.length < 1 : true ) && $props.isLoggedIn">
            Loading...
            <!-- TODO: Make prettier -->
        </div>
        <div v-else-if="!$props.isLoggedIn" class="not-logged-in">
            <p>
                You are not logged into Apple Music. We therefore can't show you your playlists.
                <a href="" title="Refreshes the page, allowing you to log in">Change that</a>
            </p>
            <p>Use the button below to load songs from your local disk</p>
            <input
                id="pl-loader"
                class="pl-loader-button"
                type="file"
                multiple="true"
                accept="audio/*"
            ><br>
            <button id="load-button" class="pl-loader-button" @click="loadPlaylistFromDisk()">
                Load
            </button>
            <p v-if="!hasSelectedSongs">
                Please select at least one song to proceed!
            </p>
        </div>
        <div class="playlist-wrapper">
            <div
                v-for="pl in $props.playlists"
                :key="pl.id"
                class="playlist"
                @click="selectPlaylist( pl.id )"
            >
                {{ pl.attributes.name }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type {
        ReadFile
    } from '@/scripts/song';
    import {
        ref
    } from 'vue';

    const hasSelectedSongs = ref( true );

    defineProps( {
        'playlists': {
            'default': [],
            'type': Array<any>,
            'required': true,
        },
        'isLoggedIn': {
            'default': false,
            'type': Boolean,
            'required': true,
        }
    } );

    const loadPlaylistFromDisk = () => {
        const fileURLList: ReadFile[] = [];
        const allFiles = ( document.getElementById( 'pl-loader' ) as HTMLInputElement ).files ?? [];

        if ( allFiles.length > 0 ) {
            hasSelectedSongs.value = true;

            for ( let file = 0; file < allFiles.length; file++ ) {
                fileURLList.push( {
                    'url': URL.createObjectURL( allFiles[ file ] ),
                    'filename': allFiles[ file ].name
                } );
            }

            emits( 'custom-playlist', fileURLList );
        } else {
            hasSelectedSongs.value = false;
        }
    };

    const emits = defineEmits( [
        'selected-playlist',
        'custom-playlist'
    ] );

    const selectPlaylist = ( id: string ) => {
        emits( 'selected-playlist', id );
    };
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

    .pl-loader-button {
        background-color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        margin: 5px;
        font-size: 1rem;
        cursor: pointer;
    }

    #load-button {
        font-size: 1.5rem;
    }

    .not-logged-in {
        width: 80%;
    }
</style>
