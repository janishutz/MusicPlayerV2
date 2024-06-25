<template>
    <div>
        <h1>Library</h1>
        <playlistsView :playlists="$props.playlists" @selected-playlist="( id ) => selectPlaylist( id )"></playlistsView>
    </div>
</template>

<script setup lang="ts">
    import playlistsView from '@/components/playlistsView.vue';

    const emits = defineEmits( [ 'selected-playlist' ] );

    const selectPlaylist = ( id: string ) => {
        emits( 'selected-playlist', id );
    }

    defineProps( { 
        'playlists': {
            'default': [],
            'type': Array<any>,
            'required': true,
        } 
    } );
</script>