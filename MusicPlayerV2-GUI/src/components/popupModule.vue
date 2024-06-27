<template>
    <div>
        <div :class="'popup-backdrop' + ( isShowingPopup ? '' : ' hidden' )" :style="'transform-origin: ' + transformOriginVertical + ';'">
            <div class="popup-main">
                <span class="material-symbols-outlined close-icon" @click="closePopup()">close</span>
                <h2>{{ popupContent.title }}</h2>
                <div v-if="popupContent.popupType === 'information' || popupContent.popupType === 'confirmation'" class="popup-content">
                    <p v-html="popupContent.subtitle"></p>
                </div>
                <div v-else class="popup-content">
                    <p v-if="isShowingIncomplete" class="incomplete-message">{{ popupContent.incompleteMessage ? popupContent.incompleteMessage : 'Some entries are not filled out. Please fill them out to proceed.' }}</p>
                    <p v-html="popupContent.subtitle"></p>
                    <div v-for="content in popupContent.data" v-bind:key="content.id" class="popup-content-wrapper">
                        <div v-if="content.dataType === 'text'">
                            <label :for="'text-' + content.id">{{ content.name }}</label><br>
                            <input type="text" :id="'text-' + content.id" v-model="data[ content.id ]" class="input">
                        </div>
                        <div v-else-if="content.dataType === 'number'">
                            <label :for="'number-' + content.id">{{ content.name }}</label><br>
                            <input type="number" :id="'number-' + content.id" v-model="data[ content.id ]" class="input">
                        </div>
                        <div v-else-if="content.dataType === 'checkbox'">
                            <label :for="'checkbox-' + content.id">{{ content.name }}</label><br>
                            <label class="switch">
                                <input type="checkbox" v-model="data[ content.id ]">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div v-else-if="content.dataType === 'textbox'">
                            <label :for="'textarea-' + content.id">{{ content.name }}</label><br>
                            <textarea :id="'textarea-' + content.id" v-model="data[ content.id ]" class="textarea"></textarea>
                        </div>
                        <div v-else-if="content.dataType === 'colour'">
                            <label :for="'colour-' + content.id">{{ content.name }}</label><br>
                            <input type="text" :id="'colour-' + content.id" v-model="data[ content.id ]" class="input">
                        </div>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <button @click="closePopup()" style="margin-right: 10px;" class="fancy-button" v-if="popupContent.popupType === 'confirmation'">Cancel</button>
                    <button @click="closePopupReturn()" class="fancy-button">Ok</button>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
    type PopupType = 'confirmation' | 'information' | 'input';

    interface PopupData {
        /**
         * What to display to the user in front of the input field
         */
        name: string;

        /**
         * The type of data to display
         */
        dataType: 'text' | 'number' | 'checkbox' | 'textbox' | 'colour';

        /**
         * ID that is used for internal usage only. May only contain alphanumerical characters, as well as dashes and underscores
         */
        id: string;
    }

    interface PopupContent {
        /**
         * The title shown in big letters at the top of the popup
         */
        title: string;

        /**
         * (OPTIONAL) The subtitle shown to the user in normal sized letters below title
         */
        subtitle?: string;

        /**
         * (OPTIONAL) The message to show, if the user has not filled out all fields
         */
        incompleteMessage?: string;

        /**
         * The type of popup (i.e. what it is for)
         */
        popupType: PopupType;

        /**
         * (REQUIRED ONLY when popupType === 'input') The input fields to show
         */
        data?: PopupData[];
    }

    interface Data {
        [key: string]: any;
    }

    import "@melloware/coloris/dist/coloris.css";
    import { ref, type Ref } from 'vue';
    import Coloris from '@melloware/coloris';

    Coloris.init();

    const isShowingPopup = ref( false );
    const transformOriginVertical = ref( '50% 50%' );
    const data: Ref<Data> = ref( {} );
    const isShowingIncomplete = ref( false );

    const popupContent: Ref<PopupContent> = ref( {
        title: 'Undefined popup title',
        popupType: 'information',
        subtitle: 'This popup was not configured correctly during development. Please send a bug-report at <a href="https://support.janishutz.com/index.php?a=add&category=7" target="_blank">support.janishutz.com</a> and inform us about where exactly you encountered this popup! We are sorry for the inconvenience'
    } );

    const closePopup = () => {
        isShowingPopup.value = false;
        Coloris.close();
    }

    const closePopupReturn = () => {
        for ( let el in popupContent.value.data ) {
            if ( !data.value[ popupContent.value.data[ parseInt( el ) ].id ] ) {
                isShowingIncomplete.value = true;
                return;
            }
        }
        closePopup();
        if ( popupContent.value.popupType === 'confirmation' ) {
            emit( 'update', true );
        } else {
            emit( 'update', data.value );
        }
    }

    const openPopup = ( popupConfig: PopupContent, transformOrigin?: string ) => {
        if ( transformOrigin ) {
            transformOriginVertical.value = transformOrigin;
        } else {
            transformOriginVertical.value = '50% 50%';
        }
        data.value = {};
        for ( let el in popupConfig.data ) {
            if ( !popupConfig.data[ parseInt( el ) ].id ) {
                console.warn( '[ popup ] Missing ID for input with name "' + popupConfig.data[ parseInt( el ) ].name + '"!' );
            } else if ( popupConfig.data[ parseInt( el ) ].dataType === 'colour' ) {
                Coloris( { el: '#colour-' + popupConfig.data[ parseInt( el ) ].id } );
            }
        }
        isShowingPopup.value = true;
        popupContent.value = popupConfig;
    }

    defineExpose( {
        openPopup,
    } );

    const emit = defineEmits( [ 'update' ] );
</script>


<style scoped>
    .popup-backdrop {
        width: 100vw;
        height: 100vh;
        position: fixed;
        background-color: var( --overlay-color );
        top: 0;
        left: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        transition: all 0.5s;
        transform: scale(1);
    }

    .incomplete-message {
        color: red;
        font-weight: 300;
        font-style: italic;
        margin-top: 0;
        font-size: 0.8rem;
    }

    .hidden {
        transform: scale(0);
    }

    .popup-main {
        width: 40%;
        height: 50%;
        background-color: var( --secondary-color );
        padding: 2.5%;
        border-radius: 20px;
        position: relative;
        overflow: scroll;
        display: block;
    }

    .close-icon {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 2rem;
        cursor: pointer;
        user-select: none;
    }

    .popup-content {
        position: unset;
        height: 60%;
        overflow: scroll;
    }

    .textarea {
        width: 80%;
        resize: vertical;
        min-height: 30px;
        border-radius: 10px;
        border: solid var( --primary-color ) 1px;
        padding: 5px;
    }

    .input {
        padding: 5px;
        border-radius: 10px;
        border: solid var( --primary-color ) 1px;
    }

    .popup-content-wrapper {
        margin-bottom: 10px;
    }
</style>

<style scoped>
/* https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_switch */
.switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
}

.switch input { 
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
}

input:checked + .slider {
    background-color: #2196F3;
}

input:focus + .slider {
    box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
    border-radius: 34px;
}

.slider.round:before {
    border-radius: 50%;
}
</style>