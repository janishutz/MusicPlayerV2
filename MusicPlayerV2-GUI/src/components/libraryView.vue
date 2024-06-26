<template>
    <div>
        <h1>Library</h1>
        <playlistsView :playlists="$props.playlists" @selected-playlist="( id ) => selectPlaylist( id )" :is-logged-in="$props.isLoggedIn" 
            @custom-playlist="( pl ) => selectCustomPlaylist( pl )"></playlistsView>
    </div>
</template>

<script setup lang="ts">
    import playlistsView from '@/components/playlistsView.vue';
    import type { ReadFile } from '@/scripts/song';

    const emits = defineEmits( [ 'selected-playlist', 'custom-playlist' ] );

    const selectPlaylist = ( id: string ) => {
        emits( 'selected-playlist', id );
    }

    const selectCustomPlaylist = ( playlist: ReadFile[] ) => {
        emits( 'custom-playlist', playlist );
    }

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
</script>