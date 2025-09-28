import App from './App.vue';
import {
    createApp
} from 'vue';
import {
    createPinia
} from 'pinia';
import router from './router';
import sdk from '@janishutz/login-sdk-browser';


const app = createApp( App );

app.use( createPinia() );
app.use( router );

// localStorage.setItem( 'url', 'http://localhost:8082' );
localStorage.setItem( 'url', 'https://music-api.janishutz.com' );
sdk.setUp(
    'jh-music',
    String( localStorage.getItem( 'url' ) ),
    '/app',
    false // Set to false for deploy to actual backend
);

app.mount( '#app' );
