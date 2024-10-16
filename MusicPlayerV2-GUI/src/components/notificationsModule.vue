<!-- eslint-disable no-undef -->
<template>
    <div id="notifications">
        <div class="message-box" :class="[ location, size ]" :style="'z-index: ' + ( messageType === 'hide' ? '-1' : '1000' )">
            <div class="message-container" :class="messageType">
                <button @click="handleNotifications();" class="close-notification"><span class="material-symbols-outlined close-notification-icon">close</span></button>
                <span class="material-symbols-outlined types hide" v-if="messageType == 'hide'">question_mark</span>
                <span class="material-symbols-outlined types" v-else-if="messageType == 'ok'" style="background-color: green;">done</span>
                <span class="material-symbols-outlined types" v-else-if="messageType == 'error'" style="background-color: red;">close</span>
                <span class="material-symbols-outlined types progress-spinner" v-else-if="messageType == 'progress'" style="background-color: blue;">progress_activity</span>
                <span class="material-symbols-outlined types" v-else-if="messageType == 'info'" style="background-color: lightblue;">info</span>
                <span class="material-symbols-outlined types" v-else-if="messageType == 'warning'" style="background-color: orangered;">warning</span>
                <p class="message" @click="notificationAction()">{{ notifications[ currentDID ] ? notifications[ currentDID ].message : '' }}</p>
                <div :class="'countdown countdown-' + messageType" :style="'width: ' + ( 100 - ( currentTime - notificationDisplayStartTime ) / ( notifications[ currentDID ] ? notifications[ currentDID ].showDuration : 1 ) / 10 ) + '%'"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import router from '@/router';
    import { onUnmounted, ref, type Ref } from 'vue';

    defineProps( {
        location: {
            type: String,
            'default': 'topleft',
        },
        size: {
            type: String,
            'default': 'default',
        }
        // Size options: small, default (default option), big, bigger, huge
    } );

    interface Notification {
        message: string;
        showDuration: number;
        messageType: string;
        priority: string;
        id: number;
        redirect?: string;
        openInNewTab?: boolean;
    }

    interface NotificationList {
        [ key: string ]: Notification
    }

    const notifications: Ref<NotificationList> = ref( {} );
    const queue: Ref<number[]> = ref( [] );
    const currentDID: Ref<number> = ref( 0 );
    const messageType: Ref<string> = ref( 'hide' );
    const currentID = ref( { 'critical': 0, 'medium': 1000, 'low': 10000 } );
    const notificationDisplayStartTime: Ref<number> = ref( 0 );
    const currentTime: Ref<number> = ref( 0 );
    let progressBar = 0;
    let notificationTimeout = 0;
    const notificationAction = () => {
        if ( notifications.value[ currentDID.value ] ) {
            if ( notifications.value[ currentDID.value ].redirect ) {
                if ( notifications.value[ currentDID.value ].openInNewTab ) {
                    window.open( notifications.value[ currentDID.value ].redirect ?? '' );
                } else {
                    router.push( notifications.value[ currentDID.value ].redirect ?? '' );
                }
            }
        }
    };

    /**
     * Create a notification that will be displayed using the internal notification scheduler
     * @param {string} message The message to show. Can only be plain text (no HTML)
     * @param {number} showDuration The duration in seconds for which to show the notification
     * @param {string} msgType Type of notification to show. Will dictate how it looks: 'ok', 'error', 'info', 'warn', 'progress'
     * @param {string} priority The priority of the message: 'low', 'normal', 'critical'
     * @returns {number}
     */
    const createNotification = ( message: string, showDuration: number, msgType: string, priority: string, redirect?: string, openInNewTab?: boolean ): number => {
        /* 
                Takes a notification options array that contains: message, showDuration (in seconds), msgType (ok, error, progress, info) and priority (low, normal, critical).
                Returns a notification ID which can be used to cancel the notification. The component will throttle notifications and display
                one at a time and prioritize messages with higher priority. Use vue refs to access these methods.
            */
        let id = 0;

        if ( priority === 'critical' ) {
            currentID.value[ 'critical' ] += 1;
            id = currentID.value[ 'critical' ];
        } else if ( priority === 'normal' ) {
            currentID.value[ 'medium' ] += 1;
            id = currentID.value[ 'medium' ];
        } else if ( priority === 'low' ) {
            currentID.value[ 'low' ] += 1;
            id = currentID.value[ 'low' ];
        }
        notifications.value[ id ] = { 'message': message, 'showDuration': showDuration, 'messageType': msgType, 'priority': priority, 'id': id, redirect: redirect, openInNewTab: openInNewTab };
        queue.value.push( id );
        console.log( 'scheduled notification: ' + id + ' (' + message + ')' );
        if ( ( new Date().getTime() - notificationDisplayStartTime.value ) / 1000 >= ( notifications.value[ currentDID.value ] ? notifications.value[ currentDID.value ].showDuration : 0 ) || messageType.value === 'hide' ) {
            handleNotifications();
        }
        return id;
    }

    /**
     * Update a notification's message after creating it
     * @param {number} id The notification ID returned by createNotification
     * @param {string} message The new message
     * @returns {void}
     */
    const updateNotification = ( id: number, message: string ): void => {
        if ( notifications.value[ id ] ) {
            notifications.value[ id ].message = message;
        }
    }


    /**
     * Delete a previously created notification
     * @param {string} id The notification ID returned by createNotification
     * @returns {undefined}
     */
    const cancelNotification = ( id: number ): undefined => {
        try { 
            delete notifications.value[ id ];
        } catch ( error ) {
            console.log( 'notification to be deleted is nonexistent or currently being displayed' );
        }
        try {
            queue.value.splice( queue.value.indexOf( id ), 1 );
        } catch {
            console.debug( 'queue empty' );
        }
        if ( currentDID.value == id ) {
            try {
                clearTimeout( notificationTimeout );
            } catch (err) { /* empty */ }
            handleNotifications();
        }
    }

    const handleNotifications = () => {
        notificationDisplayStartTime.value = new Date().getTime();
        queue.value.sort();
        if ( queue.value.length > 0 ) {
            if ( currentDID.value !== 0 ) {
                delete notifications.value[ currentDID.value ];
            }
            currentDID.value = notifications.value[ queue.value[ 0 ] ][ 'id' ];
            messageType.value = notifications.value[ queue.value[ 0 ] ].messageType;
            queue.value.reverse();
            queue.value.pop();
            progressBar = setInterval( progressBarHandler, 25 );
            notificationTimeout = setTimeout( () => {
                handleNotifications();
            }, notifications.value[ currentDID.value ].showDuration * 1000 );
        } else {
            try {
                clearInterval( progressBar );
            } catch (err) { /* empty */ }
            messageType.value = 'hide';
        }
    }

    const progressBarHandler = () => {
        currentTime.value = new Date().getTime();
    }

    onUnmounted( () => {
        try {
            clearInterval( progressBar );
        } catch (err) { /* empty */ }
        try {
            clearInterval( notificationTimeout );
        } catch (err) { /* empty */ }
    } );

    defineExpose( {
        createNotification,
        cancelNotification,
        updateNotification
    } );
</script>

<style scoped>
    .message-box {
        position: fixed;
        z-index: -100;
        color: white;
        transition: all 0.5s;
        width: 95vw;
        right: 2.5vw;
        top: 1vh;
        height: 10vh;
    }

    .close-notification {
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        color: white;
        border: none;
        cursor: pointer;
        padding: 0;
        margin: 0;
    }

    .close-notification-icon {
        font-size: 1.75rem;
    }

    .countdown {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 5px;
    }
    
    .message-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
        opacity: 1;
        transition: all 0.5s;
        cursor: default;
    }
    
    .types {
        color: white;
        border-radius: 100%;
        margin-right: auto;
        margin-left: 5%;
        padding: 1.5%;
        font-size: 200%;
    }
    
    .message {
        margin-right: calc( 5% + 30px );
        text-align: end;
        height: 90%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }
    
    .ok {
        background-color: rgb(1, 71, 1);
    }

    .countdown-ok {
        background-color: green;
    }
    
    .error {
        background-color: rgb(114, 1, 1);
    }

    .countdown-error {
        background-color: red;
    }
    
    .info {
        background-color: rgb(44, 112, 151);
    }

    .countdown-info {
        background-color: blue;
    }
    
    .warning {
        background-color: orange;
    }

    .countdown-warning {
        background-color: orangered;
    }
    
    .hide {
        opacity: 0;
    }
    
    .progress {
        z-index: 100;
        background-color: rgb(0, 0, 99);
    }
    
    .countdown-ok {
        background: none;
    }

    .progress-spinner {
        animation: spin 2s infinite linear;
    }
    
    @keyframes spin {
        from {
            transform: rotate( 0deg );
        }
        to {
            transform: rotate( 720deg );
        }
    }

    @media only screen and (min-width: 750px) {

        .default {
            height: 10vh;
            width: 32vw;
        }

        .small {
            height: 7vh;
            width: 27vw;
        }

        .big {
            height: 12vh;
            width: 38vw;
        }

        .bigger {
            height: 15vh;
            width: 43vw;
        }

        .huge {
            height: 20vh;
            width: 50vw;
        }

        .topleft {
            top: 3vh;
            left: 0.5vw;
        }

        .topright {
            top: 3vh;
            right: 0.5vw;
        }

        .bottomright {
            bottom: 3vh;
            right: 0.5vw;
        }

        .bottomleft {
            bottom: 3vh;
            right: 0.5vw;
        }
    }


    @media only screen and (min-width: 1500px) {
        .default {
            height: 10vh;
            width: 15vw;
        }

        .small {
            height: 7vh;
            width: 11vw;
        }

        .big {
            height: 12vh;
            width: 17vw;
        }

        .bigger {
            height: 15vh;
            width: 20vw;
        }

        .huge {
            height: 20vh;
            width: 25vw;
        }
    }
</style>