
console.log('TouchEvent before')
// document.createEvent('TouchEvent')
// console.log('TouchEvent after')

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

var context = null;
var recorder = null;

// the ggwave module instance
var ggwave = null;
var parameters = null;
var instance = null;

// instantiate the ggwave instance
// ggwave_factory comes from the ggwave.js module
ggwave_factory().then(function(obj) {
    ggwave = obj;
});

var txData = document.getElementById("txData");
var rxData = document.getElementById("rxData");
var captureStart = document.getElementById("captureStart");
var captureStop = document.getElementById("captureStop");

// helper function
function convertTypedArray(src, type) {
    var buffer = new ArrayBuffer(src.byteLength);
    var baseView = new src.constructor(buffer).set(src);
    return new type(buffer);
}

// initialize audio context and ggwave
function init() {
    console.log('Init')
    if (!context) {
        console.log('no context')
        context = new AudioContext({sampleRate: 48000});

        parameters = ggwave.getDefaultParameters();
        parameters.sampleRateInp = context.sampleRate;
        parameters.sampleRateOut = context.sampleRate;
        instance = ggwave.init(parameters);
    }
}

const displayMotorData = (data) => {

}

const processMotorData = (data) => {
    //Check format
    motorData = data.split(':')
    if (motorData.length < 5) {
        console.log('ERRROR')
    }

    return {
        'speed': motorData[0],
        'battery': motorData[1],
        'power': motorData[2],
        'charging': motorData[3],
        'message': motorData[4]
    }
}


//
// Tx
//

function onSend(msg) {
    init();
    


    // generate audio waveform
    var waveform = ggwave.encode(instance, msg, ggwave.TxProtocolId.GGWAVE_TX_PROTOCOL_AUDIBLE_FAST, 10)

    // play audio
    var buf = convertTypedArray(waveform, Float32Array);
    var buffer = context.createBuffer(1, buf.length, context.sampleRate);
    buffer.getChannelData(0).set(buf);
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
}

//
// Rx
//

const msgActions = (response) => {
    switch (last_msg) {
        case 'getMotorId':
            motor_id = response
            break;
        case 'getMotorData':
            displayMotorData(processMotorData(response))
        
        default:
            break;
    }
}

captureStart.addEventListener("click", function () {
    console.log('captureStart')
    init();

    let constraints = {
        audio: {
            // not sure if these are necessary to have
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false
        }
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function (e) {
        mediaStream = context.createMediaStreamSource(e);

        var bufferSize = 16*1024;
        var numberOfInputChannels = 1;
        var numberOfOutputChannels = 1;

        if (context.createScriptProcessor) {
            recorder = context.createScriptProcessor(
                    bufferSize,
                    numberOfInputChannels,
                    numberOfOutputChannels);
        } else {
            recorder = context.createJavaScriptNode(
                    bufferSize,
                    numberOfInputChannels,
                    numberOfOutputChannels);
        }

        recorder.onaudioprocess = function (e) {
            var source = e.inputBuffer;
            var res = ggwave.decode(instance, convertTypedArray(new Float32Array(source.getChannelData(0)), Int8Array));
            if (res) {
                console.log('Res')
                rxData.value = res;
            }
        }

        mediaStream.connect(recorder);
        recorder.connect(context.destination);
    }).catch(function (e) {
        console.error(e);
    });

    rxData.value = 'Listening ...';
    captureStart.hidden = true;
    captureStop.hidden = false;
});

captureStop.addEventListener("click", function () {
    console.log('captureStart')
    if (recorder) {
        recorder.disconnect(context.destination);
        mediaStream.disconnect(recorder);
        recorder = null;
    }

    rxData.value = 'Audio capture is paused! Press the "Start capturing" button to analyze audio from the microphone';
    captureStart.hidden = false;
    captureStop.hidden = true;
});

setTimeout(() => {
    console.log('1sec later ...')

    console.log('then click ...')
    captureStart.click();

    
    console.log('sound ...')
    onSend('getMotorId');
}, 1000)
// onSend();

// setInterval(onSend, 1000);