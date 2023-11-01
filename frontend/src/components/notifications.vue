<!-- eslint-disable no-undef -->
<template>
    <div id="notifications" @click="handleNotifications();">
        <div class="message-box" :class="[ location, size ]">
            <div class="message-container" :class="messageType">
                <span class="material-symbols-outlined types hide" v-if="messageType == 'hide'">question_mark</span>
                <span class="material-symbols-outlined types" v-else-if="messageType == 'ok'" style="background-color: green;">done</span>
                <span class="material-symbols-outlined types" v-else-if="messageType == 'error'" style="background-color: red;">close</span>
                <span class="material-symbols-outlined types progress-spinner" v-else-if="messageType == 'progress'" style="background-color: blue;">progress_activity</span>
                <span class="material-symbols-outlined types" v-else-if="messageType == 'info'" style="background-color: lightblue;">info</span>
                <span class="material-symbols-outlined types" v-else-if="messageType == 'warning'" style="background-color: orangered;">warning</span>
                <p class="message">{{ message }}</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'notifications',
    props: {
        location: {
            type: String,
            'default': 'topleft',
        },
        size: {
            type: String,
            'default': 'default',
        }
        // Size options: small, default (default option), big, bigger, huge
    },
    data () {
        return {
            notifications: {},
            queue: [],
            message: '',
            messageType: 'hide',
            notificationDisplayTime: 0,
            notificationPriority: 'normal',
            currentlyDisplayedNotificationID: 0,
            currentID: { 'critical': 0, 'medium': 1000, 'low': 100000 },
            displayTimeCurrentNotification: 0,
            notificationScheduler: null,
        };
    },
    methods: {
        createNotification( message, showDuration, messageType, priority ) {
            /* 
                    Takes a notification options array that contains: message, showDuration (in seconds), messageType (ok, error, progress, info) and priority (low, normal, critical).
                    Returns a notification ID which can be used to cancel the notification. The component will throttle notifications and display
                    one at a time and prioritize messages with higher priority. Use vue refs to access these methods.
                */
            let id = 0;

            if ( priority === 'critical' ) {
                this.currentID[ 'critical' ] += 1;
                id = this.currentID[ 'critical' ];
            } else if ( priority === 'normal' ) {
                this.currentID[ 'medium' ] += 1;
                id = this.currentID[ 'medium' ];
            } else if ( priority === 'low' ) {
                this.currentID[ 'low' ] += 1;
                id = this.currentID[ 'low' ];
            }
            this.notifications[ id ] = { 'message': message, 'showDuration': showDuration, 'messageType': messageType, 'priority': priority, 'id': id };
            this.queue.push( id );
            console.log( 'scheduled notification: ' + id + ' (' + message + ')' );
            if ( this.displayTimeCurrentNotification >= this.notificationDisplayTime ) {
                this.handleNotifications();
            }
            return id;
        },
        cancelNotification ( id ) {
            /* 
                    This method deletes a notification and, in case the notification is being displayed, hides it.
                */
            try { 
                delete this.notifications[ id ];
            } catch ( error ) {
                console.log( 'notification to be deleted is nonexistent or currently being displayed' );
            }
            try {
                this.queue.splice( this.queue.indexOf( id ), 1 );
            } catch {
                console.debug( 'queue empty' );
            }
            if ( this.currentlyDisplayedNotificationID == id ) {
                this.handleNotifications();
            }
        },
        handleNotifications () {
            /* 
                    This methods should NOT be called in any other component than this one!
                */
            this.displayTimeCurrentNotification = 0;
            this.notificationDisplayTime = 0;
            this.message = '';
            this.queue.sort();
            if ( this.queue.length > 0 ) {
                this.message = this.notifications[ this.queue[ 0 ] ][ 'message' ];
                this.messageType = this.notifications[ this.queue[ 0 ] ][ 'messageType' ];
                this.priority = this.notifications[ this.queue[ 0 ] ][ 'priority' ];
                this.currentlyDisplayedNotificationID = this.notifications[ this.queue[ 0 ] ][ 'id' ];
                this.notificationDisplayTime = this.notifications[ this.queue[ 0 ] ][ 'showDuration' ];
                delete this.notifications[ this.queue[ 0 ] ];
                this.queue.reverse();
                this.queue.pop();
                $( '.message-box' ).css( 'z-index', 20 );
            } else {
                this.messageType = 'hide';
                $( '.message-box' ).css( 'z-index', -1 );
            }
        }
    },
    created () {
        this.notificationScheduler = setInterval( () => { 
            if ( this.displayTimeCurrentNotification >= this.notificationDisplayTime ) {
                this.handleNotifications();
            } else {
                this.displayTimeCurrentNotification += 0.5;
            }
        }, 500 );
    },
    unmounted ( ) {
        clearInterval( this.notificationScheduler );
    }
};
</script>

<style scoped>
    .message-box {
        position: fixed;
        z-index: -1;
        color: white;
        transition: all 0.5s;
        width: 95vw;
        right: 2.5vw;
        top: 1vh;
        height: 10vh;
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
        margin-right: 5%;
        text-align: end;
    }
    
    .ok {
        background-color: rgb(1, 71, 1);
    }
    
    .error {
        background-color: rgb(114, 1, 1);
    }
    
    .info {
        background-color: rgb(44, 112, 151);
    }
    
    .warning {
        background-color: orange;
    }
    
    .hide {
        opacity: 0;
    }
    
    .progress {
        z-index: 20;
        background-color: rgb(0, 0, 99);
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
            top: 3vh;
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