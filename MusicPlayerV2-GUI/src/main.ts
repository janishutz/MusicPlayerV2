import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// localStorage.setItem( 'url', 'http://localhost:8082' );
localStorage.setItem( 'url', 'https://music-api.janishutz.com' );

app.mount('#app')
