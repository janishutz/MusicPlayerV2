const getSubscriptions = ( uid: string ) => {
    return [ {
        'id': 'com.janishutz.MusicPlayer.subscription',
        'expires': new Date().getTime() + 200000,
        'status': true
    } ];
}

const configure = ( config: object ) => {

}

export default {
    getSubscriptions,
    configure
}