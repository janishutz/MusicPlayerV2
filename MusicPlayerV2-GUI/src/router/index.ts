import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { useUserStore } from '@/stores/userStore';

const router = createRouter( {
    history: createWebHistory( import.meta.env.BASE_URL ),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: {
                'authRequired': false,
                'title': 'Login'
            }
        },
        {
            path: '/app',
            name: 'app',
            component: () => import( '../views/AppView.vue' ),
            meta: {
                'authRequired': true,
                'title': 'App'
            }
        },
        {
            path: '/get',
            name: 'get',
            component: () => import( '../views/GetView.vue' ),
            meta: {
                'authRequired': false,
                'title': 'Get'
            }
        },
        {
            path: '/share/:name',
            name: 'share',
            component: () => import( '../views/RemoteView.vue' ),
            meta: {
                'authRequired': false,
                'title': 'Share'
            }
        },
        {
            path: '/fancy/:name',
            name: 'fancy',
            component: () => import( '../views/ShowcaseView.vue' ),
            meta: {
                'authRequired': false,
                'title': 'Fancy View'
            }
        },
        { 
            path: '/:pathMatch(.*)*', 
            name: 'NotFound', 
            component: () => import( '../views/404View.vue' ),
            meta: {
                title: '404 :: Page not found',
                transition: 'scale',
            }
        },
    ]
} );

// router.beforeResolve( ( to, _from, next ) => {
//     if ( to.name ) {
//         NProgress.start();
//     }
//     next();
// } );

router.beforeEach( ( to ) => {
    const userStore = useUserStore();
    const isUserAuthenticated = userStore.getUserAuthenticated;
    if ( !isUserAuthenticated && to.meta.authRequired ) {
        localStorage.setItem( 'redirect', to.fullPath );
        return { name: 'home' };
    }
} );

router.afterEach( ( to ) => {
    window.scrollTo( { top: 0, behavior: 'smooth' } );
    document.title = to.meta.title ? to.meta.title + ' - MusicPlayer' : 'MusicPlayer';
    // NProgress.done();
} );

export default router;
