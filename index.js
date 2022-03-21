
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


const checkMotorId = x => {
  
    // Première initialisation du couple Iphone / Moteur
    if (!localStorage.getItem('motorID')) {
      localStorage.setItem('motorID', x);
    } else {
      // Pas le bon couple Iphone / Moteur
      if (localStorage.getItem('motorID') != x) {
        document.getElementsByClassName('iphone_container')[0].classList.add('red_shadow')
        setTimeout(() => {
            alert('Mauvais couple Iphone / Moteur')
        }, 10);
      }
    }
  }

const displayMotorData = (data) => {
    for (const x in data) {
        document.getElementById(x).textContent = data[x]
    }
}

const processMotorData = (data) => {
    //Check format
    motorData = data.split(':')
    if (motorData.length < 5) {
        console.log('ERRROR')
    }

    if (motorData[1] < 10) {
        document.getElementsByClassName('iphone_container')[0].classList.add('red_shadow')
    } else {
        document.getElementsByClassName('iphone_container')[0].classList.remove('red_shadow')
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

let last_msg = ''
function onSend(msg) {
    init();
    last_msg = msg;


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
    console.log("**************")
    console.log(last_msg)
    console.log(response)
      switch (last_msg) {
          case 'getMotorId':
              checkMotorId(response)
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
                msgActions(res);
            }
        }

        mediaStream.connect(recorder);
        recorder.connect(context.destination);
    }).catch(function (e) {
        console.error(e);
    });

});

captureStop.addEventListener("click", function () {
    console.log('captureStart')
    if (recorder) {
        recorder.disconnect(context.destination);
        mediaStream.disconnect(recorder);
        recorder = null;
    }

});



let count_motorID = 0
let count_motorData = 0

setTimeout(() => {
    console.log('1sec later ...')

    console.log('then click ...')
    captureStart.click();

    
    console.log('sound ...')

    let handleMotorID = setInterval(() => {
        if (localStorage.getItem('motorID')) {
            clearInterval(handleMotorID)
            let handMotorData = setInterval(() => {
                if (count_motorData > 99) {
                    clearInterval(handMotorData)
                    alert('Demo finish !')
                }
                onSend('getMotorData');
                count_motorData += 1
            }, 10 * 1000) // 10 sec
            break;
        } else if (count_motorID > 10) {
            clearInterval(handleMotorID)
            document.getElementsByClassName('iphone_container')[0].classList.add('red_shadow')
            setTimeout(() => {
                alert('Moteur HS')
            }, 10);
        }
        onSend('getMotorId');
        count_motorID += 1
    }, 10 * 1000) // 10 sec


}, 1000)
// onSend();

// setInterval(onSend, 1000);