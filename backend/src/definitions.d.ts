export interface Room {
    playbackStatus: boolean;
    playbackStart: number;
    playlist: Song[];
    playlistIndex: number;
    roomName: string;
    roomToken: string;
}

export interface Song {
    title: string;
    artist: string;
    duration: number;
    cover: string;
    additionalInfo?: string;
}