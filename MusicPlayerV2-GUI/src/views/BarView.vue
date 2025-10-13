<script setup lang="ts">
    import {
        type Ref,
        computed, ref
    } from 'vue';

    interface FullConfig {
        'offering': BarConfig,
        'ages': Ages
    }

    interface Ages {
        '18+': string,
        '16-18': string
    }

    interface BarConfig {
        [id: string]: Offer;
    }

    interface Offer {
        'name': string;
        'price': number; // In cents
        'id': string;
    }

    interface Selection {
        [id: string]: number;
    }

    const ages: Ref<Ages> = ref( {
        '18+': '',
        '16-18': '',
        'below': ''
    } );
    const offering: Ref<BarConfig> = ref( {} );
    const selection: Ref<Selection> = ref( {} );

    fetch( '/bar-config.json' ).then( res => {
        if ( res.status === 200 ) {
            res.json().then( json => {
                const data: FullConfig = json;

                offering.value = data.offering;
                ages.value = data.ages;
                reset();
            } );
        } else {
            alert( 'Failed to load' );
        }
    } );

    const reset = () => {
        const keys = Object.keys( offering.value );

        keys.forEach( val => {
            selection.value[ val ] = 0;
        } );
    };

    const total = computed( () => {
        const keys = Object.keys( selection.value );

        let totalPrice = 0;

        for ( let i = 0; i < keys.length; i++ ) {
            const o = selection.value[ keys[ i ] ];

            totalPrice += o * offering.value[ keys[ i ] ].price;
        }

        return totalPrice / 100;
    } );

    const changeValue = ( id: string, amount: number ) => {
        selection.value[ id ] += amount;

        if ( selection.value[ id ] < 0 ) {
            selection.value[ id ] = 0;
        }
    };
</script>

<template>
    <div class="bar-utility">
        <h1>Bar utility</h1>
        <p>Check ages! (18+: {{ ages[ '18+' ] }}, 16-18: {{ ages[ '16-18' ] }})</p>
        <button @click="reset()">
            Reset
        </button>
        <p>Total: CHF {{ total }}</p>
        <table class="offering-wrapper">
            <tbody>
                <tr v-for="offer in offering" :key="offer.id" class="offering">
                    <td>
                        <p>{{ offer.name }} (CHF {{ offer.price / 100 }})</p>
                    </td>
                    <td>
                        <div>
                            <button class="inc-dec" @click="changeValue( offer.id, 1 )">
                                +
                            </button>
                            <p>{{ selection[ offer.id ] }}</p>
                            <button class="inc-dec" @click="changeValue( offer.id, -1 )">
                                -
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>
.bar-utility {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    >.offering-wrapper {
        .offering {
            >td {
                padding: 5px;
                p {
                    margin: 0;
                    margin-right: 15px;
                    text-align: start;
                }

                >div {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: row;

                    p {
                        margin-left: 5px;
                        margin-right: 5px;
                    }

                    >.inc-dec {
                        user-select: none;
                        cursor: pointer;
                        background: none;
                        border: solid var( --primary-color ) 1px;
                        border-radius: 20px;
                        width: 2rem;
                        height: 2rem;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-size: 1.5rem;
                        color: var( --primary-color );
                        touch-action: manipulation;
                    }
                }
            }
        }
    }
}
</style>
