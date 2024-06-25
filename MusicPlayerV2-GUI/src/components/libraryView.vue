<template>
    <div>
        <h1>Library</h1>
        <playlistsView :playlists="$props.playlists"></playlistsView>
    </div>
</template>

<script setup lang="ts">
    import playlistsView from '@/components/playlistsView.vue';

    defineProps( { 
        'playlists': {
            'default': [],
            'type': Array<any>,
            'required': true,
        } 
    } );
</script>