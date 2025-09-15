export type Origin = 'apple-music' | 'disk';

export interface Song {
    /**
     * The ID. Either the apple music ID, or if from local disk, an ID starting in local_
     */
    'id': string;

    /**
     * Origin of the song
     */
    'origin': Origin;

    /**
     * The cover image as a URL
     */
    'cover': string;

    /**
     * The artist of the song
     */
    'artist': string;

    /**
     * The name of the song
     */
    'title': string;

    /**
     * Duration of the song in milliseconds
     */
    'duration': number;

    /**
     * (OPTIONAL) The genres this song belongs to. Can be displayed on the showcase screen, but requires settings there
     */
    'genres'?: string[];

    /**
     * (OPTIONAL) This will be displayed in brackets on the showcase screens
     */
    'additionalInfo'?: string;
}

export interface SongTransmitted {
    'title': string;
    'artist': string;
    'duration': number;
    'cover': string;
    'additionalInfo'?: string;
}


export interface ReadFile {
    'url': string;
    'filename': string;
}

export interface SearchResult {
    'data': {
        'results': {
            'songs': {
                'data': AppleMusicSongData[],
                'href': string;
            }
        };
    }
}

export interface AppleMusicSongData {
    'id': string,
    'type': string;
    'href': string;
    'attributes': {
        'albumName': string;
        'artistName': string;
        'artwork': {
            'width': number,
            'height': number,
            'url': string
        },
        'name': string;
        'genreNames': string[];
        'durationInMillis': number;
    }
}

export interface SongMove {
    'songID': string;
    'newPos': number;
}

export interface SSEMap {
    [key: string]: ( data: any ) => void;
}
