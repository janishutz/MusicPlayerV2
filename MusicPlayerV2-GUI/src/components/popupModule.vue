<!-- eslint-disable no-undef -->
<template>
    <div id="popup-backdrop">
        <div class="popup-container">
            <div class="popup" :class="size">
                <div class="close-wrapper"><span class="material-symbols-outlined close-button" @click="closePopup( 'cancel' );" title="Close this popup">close</span></div>
                <div class="message-container">
                    <div v-if="contentType === 'string'" class="options">
                        <h3>{{ data.message }}</h3>
                        <div class="button-wrapper">
                            <button @click="closePopup( 'ok' )" title="Close popup" class="buttons fancy-button">Ok</button>
                        </div>
                    </div>
                    <div v-else-if="contentType === 'html'" v-html="data.message" class="options"></div>
                    <div v-else-if="contentType === 'code'" class="options">
                        <h3>{{ data.message }}</h3>
                        <button @click="copy()" id="code-copy" class="buttons fancy-button">Copy</button>
                        <pre>
<code>
{{ data.options.code }}
</code>
                        </pre>
                    </div>
                    <div v-else-if="contentType === 'long-text'" class="options">
                        <h3>{{ data.message }}</h3>
                        <p>{{ data.options.note }}</p>
                        <textarea cols="80" rows="10" v-model="data.selected" id="text-input"></textarea>
                        <div class="button-wrapper">
                            <button @click="closePopup( 'ok' )" title="Save changes" class="buttons fancy-button">{{ data.options.display.save ?? 'Save' }}</button>
                            <button @click="closePopup( 'cancel' )" title="Cancel changes" class="buttons fancy-button">{{ data.options.display.cancel ?? 'Cancel' }}</button>
                        </div>
                    </div>
                    <div v-else-if="contentType === 'text'" class="options">
                        <h3>{{ data.message }}</h3>
                        <input type="text" v-model="data.selected">
                        <p>{{ info }}</p>
                        <div class="button-wrapper">
                            <button @click="closePopup( 'ok' )" title="Save changes" class="buttons fancy-button">{{ data.options.display.save ?? 'Save' }}</button>
                            <button @click="closePopup( 'cancel' )" title="Cancel changes" class="buttons fancy-button">{{ data.options.display.cancel ?? 'Cancel' }}</button>
                        </div>
                    </div>
                    <div v-else-if="contentType === 'number'" class="options">
                        <h3>{{ data.message }}</h3>
                        <input type="number" v-model="data.selected">
                        <div class="button-wrapper">
                            <button @click="closePopup( 'ok' )" title="Save changes" class="buttons fancy-button">{{ data.options.display.save ?? 'Save' }}</button>
                            <button @click="closePopup( 'cancel' )" title="Cancel changes" class="buttons fancy-button">{{ data.options.display.cancel ?? 'Cancel' }}</button>
                        </div>
                    </div>
                    <div v-else-if="contentType === 'settings'" class="options">
                        <h3>{{ data.message }}</h3>
                        <settings v-model:settings="data.options"></settings>
                        <div class="button-wrapper">
                            <button @click="submitSettings( 'ok' )" title="Save changes" class="buttons fancy-button">Save</button>
                            <button @click="closePopup( 'cancel' )" title="Cancel changes" class="buttons fancy-button">Cancel</button>
                        </div>
                    </div>
                    <div v-else-if="contentType === 'confirm'" class="confirm options">
                        <h3>{{ data.message }}</h3>
                        <div class="button-wrapper">
                            <button @click="closePopup( 'ok' )" title="Save changes" class="buttons fancy-button">{{ data.options.ok ?? 'Ok' }}</button>
                            <button @click="closePopup( 'cancel' )" title="Cancel changes" class="buttons fancy-button">{{ data.options.display.cancel ?? 'Cancel' }}</button>
                        </div>
                    </div>
                    <div v-else-if="contentType === 'dropdown'" class="options">
                        <h3>{{ data.message }}</h3>
                        <select id="select" v-model="data.selected">
                            <option v-for="selectOption in data.options" :key="selectOption.value" :value="selectOption.value">{{ selectOption.displayName }}</option>
                        </select>
                        <div class="button-wrapper">
                            <button @click="closePopup( 'ok' )" title="Save changes" class="buttons fancy-button">{{ data.options.display.save ?? 'Save' }}</button>
                            <button @click="closePopup( 'cancel' )" title="Cancel changes" class="buttons fancy-button">{{ data.options.display.cancel ?? 'Cancel' }}</button>
                        </div>
                    </div>
                    <div v-else-if="contentType === 'selection'" class="options selection">
                        <h3>{{ data.message }}</h3>
                        <div v-for="selectOption in data.options.selections" :key="selectOption.value" class="select-button-wrapper">
                            <button class="select-button" @click="closePopupAdvanced( 'ok', selectOption.value )">{{ selectOption.displayName }}</button>
                        </div>
                    </div>
                    <div v-else-if="contentType === 'iframe'" class="options iframe-wrapper">
                        <iframe :src="data.options.link" frameborder="0" class="popup-iframe"></iframe>
                    </div>
                    <div v-else-if="contentType === 'editor'" class="options">
                        <!-- Create the toolbar container -->
                        <h3>{{ data.message }}</h3>
                        <p v-if="data.options.note" v-html="data.options.note"></p>
                        <!-- Optional toggles (added via options object) -->
                        <table class="editor-options">
                            <tr v-for="element in data.options.settings" :key="element.id">
                                <td>
                                    {{ element.displayName }}
                                </td>
                                <td>
                                    <input type="text" v-if="element.type === 'text'" v-model="data.selected[ element.id ]">
                                    <input type="number" v-else-if="element.type === 'number'" v-model="data.selected[ element.id ]">
                                    <input type="email" v-else-if="element.type === 'email'" v-model="data.selected[ element.id ]">
                                    <select v-else-if="element.type === 'dropdown'" v-model="data.selected[ element.id ]">
                                        <option v-for="el in element.options" :key="el.value" :value="el.value">{{ el.displayName }}</option>
                                    </select>
                                </td>
                            </tr>
                        </table>
                        <div id="quill-toolbar">
                            <span class="ql-formats">
                                <select class="ql-font" title="Fonts">
                                    <option selected="" title="Default"></option>
                                    <option value="serif" title="Serif"></option>
                                    <option value="monospace" title="Monospace"></option>
                                </select>
                                <select class="ql-size" title="Font size">
                                    <option value="small" title="Small"></option>
                                    <option selected="" title="Default"></option>
                                    <option value="large" title="Large"></option>
                                    <option value="huge" title="Huge"></option>
                                </select>
                            </span>
                            <span class="ql-formats">
                                <button class="ql-bold" title="Bold"></button>
                                <button class="ql-italic" title="Italic"></button>
                                <button class="ql-underline" title="Underlined"></button>
                                <button class="ql-strike" title="Strikethrough"></button>
                            </span>
                            <span class="ql-formats">
                                <select class="ql-color" title="Text colour"></select>
                                <select class="ql-background" title="Background colour"></select>
                            </span>
                            <span class="ql-formats">
                                <button class="ql-list" value="ordered" title="Ordered list"></button>
                                <button class="ql-list" value="bullet" title="Bullet points"></button>
                                <select class="ql-align" title="Alignment">
                                    <option selected="" title="left"></option>
                                    <option value="center" title="center"></option>
                                    <option value="right" title="right"></option>
                                    <option value="justify" title="block"></option>
                                </select>
                            </span>
                            <span class="ql-formats">
                                <button class="ql-link" title="Insert link"></button>
                                <button class="ql-image" title="Insert image"></button>
                            </span>
                        </div>

                        <!-- Create the editor container -->
                        <div id="quill-editor">
                        </div>

                        <div class="message-iframe" v-if="data.selected.oldMsg" style="height: 60vh;">
                            <p>Attached message: </p>
                            <iframe :srcdoc="data.selected.oldMsg" frameborder="0" class="message-iframe"></iframe>
                        </div>

                        <div class="button-wrapper">
                            <button @click="closePopupEditor()" :title="data.options.saveButtonHint" class="buttons fancy-button">{{ data.options.saveButtonDisplay }}</button>
                            <button @click="closePopup( 'cancel' )" title="Cancel changes" class="buttons fancy-button">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- Options to be passed in: html, settings (for settings component), strings, confirm, dropdowns, selection -->


<script>
import settings from '@/components/settingsOptions.vue';
import hljs from 'highlight.js';
import beautify from 'json-beautify';
import Quill from 'quill';
import( 'quill/dist/quill.snow.css' );

export default {
    name: 'popupsHandler',
    components: {
        settings,
    },
    props: {
        size: {
            type: String,
            'default': 'normal',
        },
    },
    data () {
        return {
            contentType: 'dropdown',
            data: {
                options: {
                    display: '',
                },
            },
            info: '',
            editor: null,
        };
    },
    methods: {
        closePopup( message ) {
            if ( this.data.options.disallowedCharacters ) {
                for ( let letter in this.data.selected ) {
                    if ( this.data.options.disallowedCharacters.includes( this.data.selected[ letter ] ) ) {
                        this.info = `Illegal character "${ this.data.selected[ letter ] }"`;
                        return false;
                    }
                }
            }
            // eslint-disable-next-line no-undef
            $( '#popup-backdrop' ).fadeOut( 300 );
            if ( message ) {
                this.$emit( 'data', { 'data': this.data.selected, 'status': message } );
            }
        },
        closePopupEditor () {
            this.data.selected;
            this.data.selected.mail = document.getElementsByClassName( 'ql-editor' )[ 0 ].innerHTML + ( this.data.selected.oldMsg ?? '' );
            this.closePopup( 'editor' );
        },
        selectTicket ( option ) {
            let total = 0;
            for ( let i in this.data.options.count ) {
                total += this.data.options.count[ i ];
            }

            if ( total < this.data.options.max ) {
                this.data.options.count[ option ] += 1;
            }
        },
        deselectTicket ( option ) {
            if ( this.data.options.count[ option ] > 0 ) {
                this.data.options.count[ option ] -= 1;
            }
        },
        submitTicket () {
            // eslint-disable-next-line no-undef
            $( '#popup-backdrop' ).fadeOut( 300 );
            this.$emit( 'ticket', { 'data': this.data.options.count, 'component': this.data.options.id } );
        },
        closePopupAdvanced ( message, data ) {
            this.data[ 'selected' ] = data;
            this.closePopup( message );
        },
        submitSettings () {
            // eslint-disable-next-line no-undef
            $( '#popup-backdrop' ).fadeOut( 300 );
            const dat = this.data.options;
            let ret = {};
            for ( let setting in dat ) {
                if ( dat[ setting ][ 'type' ] !== 'link' ) {
                    ret[ setting ] = dat[ setting ][ 'value' ];
                }
            }
            this.$emit( 'data', { 'data': ret, 'status': 'settings' } );
        },
        openPopup ( message, options, dataType, selected ) {
            this.data = { 
                'message': message ?? 'No message defined on method call!!', 
                'options': options ?? { '1': { 'value': 'undefined', 'displayName': 'No options specified in call' } }, 
                'selected': selected ?? '' 
            };
            this.contentType = dataType ?? 'string';
            // eslint-disable-next-line no-undef
            $( '#popup-backdrop' ).fadeIn( 300 );
            if ( dataType === 'code' ) {
                if ( options.lang === 'json' ) {
                    this.data.options.code = beautify( options.code, null, 2, 50 );
                }
                setTimeout( () => {
                    hljs.highlightAll();
                }, 200 );
            } else if ( dataType === 'editor' ) {
                setTimeout( () => {
                    if ( !document.getElementById( 'quill-editor' ).classList.contains( 'ql-container' ) ) {
                        this.editor = new Quill( '#quill-editor', {
                            modules: { toolbar: '#quill-toolbar' },
                            theme: 'snow',
                        } );
                        if ( this.data.selected === '' ) {
                            this.data.selected = {};
                        }
                        setTimeout( () => {
                            if ( selected.message ) {
                                console.log( selected.message );
                                document.getElementsByClassName( 'ql-editor' )[ 0 ].innerHTML = selected.message;
                            }
                        }, 500 );
                    }
                }, 200 );
            }
        },
        copy() {
            const codeCopy = document.getElementById( 'code-copy' )
            codeCopy.innerHTML = 'Copied!';
            navigator.clipboard.writeText( this.data.options.code );
            setTimeout( () => {
                codeCopy.innerHTML = 'Copy';
            }, 2000 );
        }
    },
};
</script>

<style scoped>
    .message-iframe {
        width: 100%;
        height: 50vh;
        margin-top: 1%;
    }

    pre {
        width: 100%;
    }

    code {
        text-align: left;
    }
 
    #popup-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10;
        width: 100vw;
        height: 100vh;
        background-color: rgba( 0, 0, 0, 0.6 );
        display: none;
    }

    .popup-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    #text-input {
        width: 90%;
        resize: vertical;
    }

    .button-wrapper {
        width: 100%;
        margin-top: 3%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
    }

    .close-wrapper {
        width: 100%;
        height: 5%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        flex-direction: column;
    }

    .close-button {
        margin-right: 1vw;
        margin-top: 2vw;
        font-size: 200%;
        cursor: pointer;
    }

    .popup {
        border: none;
        border-radius: 20px;
        background-color: white;
        width: 90vw;
        height: 80vh;
    }

    .popup-iframe {
        width: 100%;
        height: 100%;
    }

    .iframe-wrapper {
        height: 100%;
    }

    .message-container {
        height: 90%;
        width: 90%;
        margin-left: 5%;
        overflow: scroll;
    }

    .options {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        overflow: visible;
        min-height: 100%;
        width: 100%;
    }

    .options .buttons {
        padding: 1% 2%;
        margin: 5px;
        display: inline-block;
    }

    .options .buttons:hover {
        background-color: darkgreen;
    }

    .select-button-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .select-button {
        background-color: rgba( 0, 0, 0, 0 ) !important;
        color: black !important;
        padding: 3vh 2vw !important;
        border: solid black 1px;
        border-radius: 5px;
        transition: all 0.5s ease-in-out;
        margin-bottom: 1vh;
        width: 90%;
        cursor: pointer;
    }

    .select-button:hover {
        background-color: gray !important;
    }

    .controls {
        user-select: none;
        cursor: pointer;
        font-size: 100%;
        font-weight: bold;
        border: solid var( --primary-color ) 1px;
        border-radius: 100%;
    }

    @media only screen and (min-width: 999px) {
        .small {
            width: 40%;
            height: 40%;
        }

        .normal {
            width: 50%;
            height: 50%;
        }

        .big {
            width: 60%;
            height: 60%;
        }

        .bigger {
            width: 70%;
            height: 70%;
        }

        .huge {
            width: 80%;
            height: 80%;
        }
    }

    #quill-editor, #quill-toolbar {
        width: 90%;
    }

    #quill-editor {
        min-height: 20vh;
    }

    .editor-options {
        width: 80%;
    }
</style>