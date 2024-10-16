<template>
    <div>
        <div id="search-bar" :class="showsSearch ? 'search-shown' : ''">
            <div id="search-box-wrapper">
                <input type="text" v-model="searchText" id="search-box" placeholder="Type to search..." @keyup="e => { keyHandler( e ) }">
                <div class="symbol-wrapper" id="search-symbol-wrapper">
                    <span class="material-symbols-outlined search-symbol" @click="search()">search</span>
                </div>
                <div :class="'search-result-wrapper' + ( searchText.length > 0 ? ' show-search-results' : '' )">
                    <div v-for="result in searchResults" v-bind:key="result.id" 
                        :class="'search-result' + ( selectedProduct === result.id ? ' prod-selected' : '' )"
                        @mouseenter="removeSelection()" @click="select( result )">
                        <div :style="'background-image: url(' + result.attributes.artwork.url.replace( '{w}', '500' ).replace( '{h}', '500' ) + ');'" class="search-product-image"></div>
                        <div class="search-product-name"><p><b>{{ result.attributes.name }}</b> <i>by {{ result.attributes.artistName }}</i></p></div>
                    </div>
                    <div v-if="searchResults.length === 0 && searchText.length < 3">
                        <p>No results to show</p>
                    </div>
                    <div v-else-if="searchText.length < 3">
                        <p>Enter at least three characters to start searching</p>
                    </div>
                </div>
            </div>
            <div class="symbol-wrapper">
                <span class="material-symbols-outlined search-symbol" @click="controlSearch( 'hide' )" id="close-icon">close</span>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
    import MusicKitJSWrapper from '@/scripts/music-player';
    import type { AppleMusicSongData } from '@/scripts/song';
    import { useUserStore } from '@/stores/userStore';
    import { ref, type Ref } from 'vue';

    const showsSearch = ref( false );
    const searchText = ref( '' );
    const selectedProduct = ref( '' );
    let selectedProductIndex = -1;
    const player = new MusicKitJSWrapper();

    const updateSearchResults = () => {
        if ( searchText.value.length > 2 ) {
            player.findSongOnAppleMusic( searchText.value ).then( data => {
                searchResults.value = data.data.results.songs.data ?? [];
                selectedProductIndex = -1;
                selectedProduct.value = '';
            } );
        }
    }

    const searchResults: Ref<AppleMusicSongData[]> = ref( [] );
    const userStore = useUserStore();

    const controlSearch = ( action: string ) => {
        if ( action === 'show' ) {
            userStore.setKeyboardUsageStatus( true );
            showsSearch.value = true;
            setTimeout( () => {
                const searchBox = document.getElementById( 'search-box' ) as HTMLInputElement;
                searchBox.focus();
            }, 500 );
        } else if ( action === 'hide' ) {
            userStore.setKeyboardUsageStatus( false );
            showsSearch.value = false;
        }
        searchText.value = '';
        removeSelection();
    }

    const removeSelection = () => {
        selectedProduct.value = '';
        selectedProductIndex = -1;
    }

    const keyHandler = ( e: KeyboardEvent ) => {
        if ( e.key === 'Escape' ) {
            controlSearch( 'hide' );
        } else if ( e.key === 'Enter' ) {
            e.preventDefault();
            if ( selectedProductIndex >= 0 ) {
                select( searchResults.value[ selectedProductIndex ] );
                controlSearch( 'hide' );
            } else {
                search();
            }
        } else if ( e.key === 'ArrowDown' ) {
            e.preventDefault();
            if ( selectedProductIndex < searchResults.value.length - 1 ) {
                selectedProductIndex += 1;
                selectedProduct.value = searchResults.value[ selectedProductIndex ].id;
            }
        } else if ( e.key === 'ArrowUp' ) {
            e.preventDefault();
            if ( selectedProductIndex > 0 ) {
                selectedProductIndex -= 1;
                selectedProduct.value = searchResults.value[ selectedProductIndex ].id;
            } else {
                removeSelection();
            }
        } else {
            updateSearchResults();
        }
    }

    const select = ( song: AppleMusicSongData ) => {
        emits( 'selected-song', song );
        controlSearch( 'hide' );
    }

    const search = () => {
        emits( 'selected-song', searchResults.value[ 0 ] );
        controlSearch( 'hide' );
    }

    const emits = defineEmits( [ 'selected-song' ] );
    

    defineExpose( {
        controlSearch
    } );
</script>

<style scoped>
    #search-bar {
        position: fixed;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        top: -15vh;
        background-color: var( --accent-background );
        height: 15vh;
        width: 100vw;
        left: 0;
        transition: all 1s;
        z-index: 50;
    }

    #search-bar.search-shown {
        top: 0;
    }

    #search-box {
        width: calc(100% - 20px);
        padding: 10px;
        font-size: 150%;
    }

    #search-box-wrapper {
        width: 60vw;
        position: relative;
        display: block;
    }

    @media only screen and (min-width: 1000px) {
        #search-box-wrapper {
            width: 45vw;
        }
    }

    @media only screen and (min-width: 1500px) {
        #search-box-wrapper {
            width: 30vw;
        }
    }

    #search-symbol-wrapper {
        position: absolute;
        right: 10px;
        top: 3px;
    }

    .symbol-wrapper {
        display: flex;
        height: 3rem;
        width: 3rem;
        align-items: center;
        justify-content: center;
    }

    .search-symbol {
        color: black;
        padding: 0;
        margin: 0;
        font-size: 200%;
        cursor: pointer;
        transition: all 0.5s;
    }

    .search-symbol:hover {
        font-size: 250%;
    }

    #close-icon {
        margin-left: 5px;
        color: var( --primary-color );
    }
</style>

<style scoped>
    .search-result-wrapper {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 2px;
        padding-bottom: 5px;
        left: 0;
        text-decoration: none;
        background-color: white;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        transform-origin: top;
        transform: scaleY( 0 );
        transition: all 0.5s;
        color: black;
    }

    .show-search-results {
        transform: scaleY( 1 );
    }

    .search-result {
        padding: 3px;
        display: flex;
        flex-direction: row;
        width: 98%;
        text-decoration: none;
        transition: all 0.5s;
        cursor: pointer;
    }

    .search-result:hover, .prod-selected {
        text-decoration: underline black;
    }

    .search-product-image {
        height: 4rem;
        width: 4rem;
        background-position: center;
        background-size: cover;
        margin-right: 20px;
        display: flex;
        align-items: center;
        flex-direction: row;
        justify-content: center;
    }

    .search-product-name {
        display: flex;
        flex-direction: row;
        align-items: center;
        text-decoration: none;
        color: black;
        font-weight: bold;
        padding: 0;
        margin: 0;
        width: calc( 100% - 4rem - 20px );
    }
</style>