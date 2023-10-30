// eslint-disable-next-line no-undef
const { createApp } = Vue;

createApp( {
    data() {
        return {
            hasLoaded: false,
            
        };
    },
    computed: {
        orderedVotes() {
            if ( this.sorting === 'oldest' ) {
                return Object.values( this.entries );
            } else if ( this.sorting === 'newest' ) {
                const ent = Object.keys( this.entries ).reverse();
                let ret = [];
                for ( let entry in ent ) {
                    ret.push( this.entries[ ent[ entry ] ] );
                }
                return ret;
            } else {
                let ent = Object.keys( this.entries ).sort( ( a, b ) => {
                    if ( this.sorting === 'nameUp' ) {
                        return this.entries[ a ].title.localeCompare( this.entries[ b ].title );
                    } else if ( this.sorting === 'nameDown' ) {
                        return this.entries[ b ].title.localeCompare( this.entries[ a ].title );
                    } else if ( this.sorting === 'mostVoted' ) {
                        return this.entries[ b ].count - this.entries[ a ].count;
                    } else if ( this.sorting === 'leastVoted' ) {
                        return this.entries[ a ].count - this.entries[ b ].count;
                    }
                } );
                let ret = [];
                for ( let entry in ent ) {
                    ret.push( this.entries[ ent[ entry ] ] );
                }
                return ret;
            }
        }
    },
    methods: {
        getData() {
            fetch( '/voting/get/' + location.pathname.substring( 8 ) ).then( response => {
                response.json().then( data => {
                    this.fingerprint();
                    this.entries = data;
                    let fetchOptions = {
                        method: 'post',
                        body: JSON.stringify( { 'fingerprint': this.userIdentifier } ),
                        headers: {
                            'Content-Type': 'application/json',
                            'charset': 'utf-8'
                        },
                    };
                    fetch( '/voting/getVotedOn/' + location.pathname.substring( 8 ), fetchOptions ).then( res => {
                        if ( res.status === 200 ) {
                            res.json().then( json => {
                                this.votedOn = JSON.parse( localStorage.getItem( 'itemsVotedOn' ) ?? '{}' );
                                for ( let el in json ) {
                                    if ( json[ el ] === 1 ) {
                                        this.votedOn[ json[ el ] ] = 'up';
                                    } else if ( json[ el ] === -1 ) {
                                        this.votedOn[ json[ el ] ] = 'down';
                                    }
                                }
                                localStorage.setItem( 'itemsVotedOn', JSON.stringify( this.votedOn ) );
                                this.hasLoadedVotes = true; 
                            } );
                        }
                    } );
                } );
            } );
            fetch( '/voting/getDetails/' + location.pathname.substring( 8 ) ).then( response => {
                response.json().then( data => {
                    this.votingDetails = data;
                    this.hasLoadedBasics = true;
                } );
            } );
        },
        save() {
            if ( this.newSuggestion.comment && this.newSuggestion.title ) {
                let alreadyExists = false;
                for ( let el in this.entries ) {
                    if ( this.entries[ el ][ 'title' ].toLocaleLowerCase() === this.newSuggestion.title.toLocaleLowerCase() ) {
                        alreadyExists = true;
                    } 
                }
                if ( !alreadyExists ) {
                    let fetchOptions = {
                        method: 'post',
                        body: JSON.stringify( this.newSuggestion ),
                        headers: {
                            'Content-Type': 'application/json',
                            'charset': 'utf-8'
                        },
                    };
                    fetch( '/voting/add/' + location.pathname.substring( 8 ), fetchOptions ).then( response => {
                        if ( response.status === 418 ) {
                            alert( 'One or more of the words in either your description or title is on our blocklist. Please make sure that you are not using any words that are NSFW, racist or similar.' );
                        } else if ( response.status !== 200 ) {
                            alert( 'there was an error updating' );
                        } else {
                            this.closePopup();
                            this.getData();
                        }
                    } );
                    this.closePopup();
                    this.getData();
                } else {
                    alert( 'An entry with this name exists already. Please vote on that entry.' );
                }
            } else {
                alert( 'Not all required fields are filled out!' );
            }
        },
        fingerprint() {
            // I am forced to do this because there are idiots in this world
            // https://stackoverflow.com/questions/27247806/generate-unique-id-for-each-device
            if ( !this.userIdentifier ) {
                const navigator_info = window.navigator;
                const screen_info = window.screen;
                let uid = navigator_info.mimeTypes.length;
                uid += navigator_info.userAgent.replace( /\D+/g, '' );
                uid += navigator_info.plugins.length;
                uid += screen_info.height || '';
                uid += screen_info.width || '';
                uid += screen_info.pixelDepth || '';
                this.userIdentifier = uid;
            }
        },
        vote( type, suggestionID ) {
            this.fingerprint();
            let voteType = type;
            let didDeactivate = false;
            if ( this.votedOn[ suggestionID ] === type ) {
                didDeactivate = true;
                if ( type === 'up' ) {
                    voteType = 'down';
                } else {
                    voteType = 'up';
                }
            } else if ( this.votedOn[ suggestionID ] ) {
                return;
            }
            let fetchOptions = {
                method: 'post',
                body: JSON.stringify( { 'voteType': voteType, 'id': suggestionID, 'fingerprint': this.userIdentifier } ),
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                },
            };
            fetch( '/voting/vote/' + location.pathname.substring( 8 ), fetchOptions ).then( response => {
                if ( response.status === 409 ) {
                    alert( 'You have already voted on this!' );
                } else if ( response.status !== 200 ) {
                    alert( 'there was an error updating' );
                } else {
                    this.votedOn[ suggestionID ] = didDeactivate ? undefined : voteType;
                    localStorage.setItem( 'itemsVotedOn', JSON.stringify( this.votedOn ) );
                    this.getData();
                }
            } );
        },
        closePopup() {
            // eslint-disable-next-line no-undef
            $( '#popup' ).fadeOut( 500 );
            // eslint-disable-next-line no-undef
            $( 'body' ).removeClass( 'menuOpen' );
            this.getData();
        },
        addSuggestion () {
            // eslint-disable-next-line no-undef
            $( '#popup' ).fadeIn( 500 );
            // eslint-disable-next-line no-undef
            $( 'body' ).addClass( 'menuOpen' );
        },
    }, 
    mounted() {
        this.getData();
    }
} ).mount( '#app' );
