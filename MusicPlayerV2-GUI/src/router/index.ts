import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

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
                'authRequired': false,
                'title': 'App'
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

// router.beforeEach( ( to ) => {
//     const userStore = useUserStore();
//     const isUserAuthenticated = userStore.getUserAuthenticated;
//     const isAdminAuthenticated = userStore.getAdminAuthenticated;

//     if ( to.meta.adminAuthRequired && !isAdminAuthenticated ) {
//         return { name: 'adminLogin' };
//     } else if ( to.name === 'adminLogin' && isAdminAuthenticated ) {
//         return { name: 'admin' };
//     } 
//     // else if ( isUserAuthenticated && to.name === 'login' ) {       
//     //     return { name: 'account' };
//     // } 
//     else if ( !isUserAuthenticated && to.name === 'checkout' ) {
//         localStorage.setItem( 'redirect', '/checkout' );
//         return { name: 'login' };
//     } else if ( !isUserAuthenticated && to.meta.authRequired ) {
//         localStorage.setItem( 'redirect', to.fullPath );
//         return { name: 'login' };
//     }

//     // TODO: Make titles adapt to languages as well
//     // TODO: Make multi-lang
// } );

router.afterEach( ( to ) => {
    window.scrollTo( { top: 0, behavior: 'smooth' } );
    document.title = to.meta.title ? to.meta.title + ' - MusicPlayer' : 'MusicPlayer';
    // NProgress.done();
} );

export default router;
