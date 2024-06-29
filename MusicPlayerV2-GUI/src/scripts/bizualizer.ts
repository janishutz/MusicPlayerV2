import ColorThief from 'colorthief';
const colorThief = new ColorThief();

const getImageData = (): Promise<number[][]> => {
    return new Promise( ( resolve ) => {
        const img = ( document.getElementById( 'current-image' ) as HTMLImageElement );
        console.log( img );
        if ( img.complete ) {
            resolve( colorThief.getPalette( img ) );
        } else {
            img.addEventListener( 'load', () => {
                resolve( colorThief.getPalette( img ) );
            } );
        }
    } );
}

const createBackground = () => {
    return new Promise( ( resolve ) => {
        getImageData().then( palette => {
            console.log( palette );
            const colourDetails: number[][] = [];
            const colours: string[] = [];
            let differentEnough = true;
            if ( palette[ 0 ] ) {
                for ( const i in palette ) {
                    for ( const colour in colourDetails ) {
                        const colourDiff = ( Math.abs( colourDetails[ colour ][ 0 ] - palette[ i ][ 0 ] ) / 255
                            + Math.abs( colourDetails[ colour ][ 1 ] - palette[ i ][ 1 ] ) / 255
                            + Math.abs( colourDetails[ colour ][ 2 ] - palette[ i ][ 2 ] ) / 255 ) / 3 * 100;
                        if ( colourDiff > 15 ) {
                            differentEnough = true;
                        }
                    }
                    if ( differentEnough ) {
                        colourDetails.push( palette[ i ] );
                        colours.push( 'rgb(' + palette[ i ][ 0 ] + ',' + palette[ i ][ 1 ] + ',' + palette[ i ][ 2 ] + ')' );
                    }
                    differentEnough = false;
                }
            }
            let outColours = 'conic-gradient(';
            if ( colours.length < 3 ) {
                for ( let i = 0; i < 3; i++ ) {
                    if ( colours[ i ] ) {
                        outColours += colours[ i ] + ',';
                    } else {
                        if ( i === 0 ) {
                            outColours += 'blue,';
                        } else if ( i === 1 ) {
                            outColours += 'green,';
                        } else if ( i === 2 ) {
                            outColours += 'red,';
                        }
                    }
                }
            } else if ( colours.length < 11 ) {
                for ( const i in colours ) {
                    outColours += colours[ i ] + ',';
                }
            } else {
                for ( let i = 0; i < 10; i++ ) {
                    outColours += colours[ i ] + ',';
                }
            }
            outColours += colours[ 0 ] ?? 'blue' + ')';
            resolve( outColours );
        } );
    } );
}

let callbackFun = () => {}
const subscribeToBeatUpdate = ( cb: () => void ) => {
    callbackFun = cb;
    micAudioHandler();
}

const unsubscribeFromBeatUpdate = () => {
    callbackFun = () => {}
    try {
        clearInterval( micAnalyzer );
    } catch ( e ) { /* empty */ }
}

const coolDown = () => {
    beatDetected = false;
}

let micAnalyzer = 0;
let beatDetected = false;
const micAudioHandler = () => {
    const audioContext = new ( window.AudioContext || window.webkitAudioContext )();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array( bufferLength );
    beatDetected = false;

    navigator.mediaDevices.getUserMedia( { audio: true } ).then( ( stream ) => {
        const mic = audioContext.createMediaStreamSource( stream );
        mic.connect( analyser );
        analyser.getByteFrequencyData( dataArray );
        let prevSpectrum: number[] = [];
        const threshold = 10; // Adjust as needed
        micAnalyzer = setInterval( () => {
            analyser.getByteFrequencyData( dataArray );
            // Convert the frequency data to a numeric array
            const currentSpectrum = Array.from( dataArray );

            if ( prevSpectrum ) {
                // Calculate the spectral flux
                const flux = calculateSpectralFlux( prevSpectrum, currentSpectrum );

                if ( flux > threshold && !beatDetected ) {
                    // Beat detected
                    beatDetected = true;
                    callbackFun();
                }
            }
            prevSpectrum = currentSpectrum;
        }, 20 );
    } );
}

const calculateSpectralFlux = ( prevSpectrum: number[], currentSpectrum: number[] ) => {
    let flux = 0;

    for ( let i = 0; i < prevSpectrum.length; i++ ) {
        const diff = currentSpectrum[ i ] - prevSpectrum[ i ];
        flux += Math.max( 0, diff );
    }

    return flux;
}

export default {
    createBackground,
    subscribeToBeatUpdate,
    unsubscribeFromBeatUpdate,
    coolDown,
}