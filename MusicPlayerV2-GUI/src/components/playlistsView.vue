<template>
    <div>
        <h3>Your playlists</h3>
        <div v-for="pl in $props.playlists" v-bind:key="pl.id">
            {{ pl.attributes.name }}
        </div>
    </div>
</template>

<script setup lang="ts">
    const props = defineProps( {
        'playlists': {
            'default': [],
            'type': Array<any>,
            'required': true,
        }
    } )
</script>