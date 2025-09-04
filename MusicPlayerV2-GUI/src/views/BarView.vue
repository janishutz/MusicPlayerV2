<script setup lang="ts">
    import {
        computed,
        ref, type Ref
    } from 'vue';

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

    const offering: Ref<BarConfig> = ref( {} );
    const selection: Ref<Selection> = ref( {} );

    fetch( '/bar-config.json' ).then( res => {
        if ( res.status === 200 ) {
            res.json().then( json => {
                offering.value = json;
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

        return totalPrice;
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
                        <button class="inc-dec" @click="changeValue( offer.id, 1 )">
                            +
                        </button>
                        <p>{{ selection[ offer.id ] }}</p>
                        <button class="inc-dec" @click="changeValue( offer.id, -1 )">
                            -
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>
.bar-utility {
    >.offering-wrapper {
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;

        >.offering {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 5px;

            p {
                margin: 0;
            }

            >.inc-dec {
                background: none;
                border: solid var( --primary-color ) 1px;
                border-radius: 20px;
                width: 1.5rem;
                height: 1.5rem;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1rem;
            }
        }
    }
}
</style>
