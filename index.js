
function $(name) {
	return document.getElementById(name);
}
function chr8() {
	return Array.prototype.map.call(arguments, function(a){
		return String.fromCharCode(a&0xff)
	}).join('');
}
function chr16() {
	return Array.prototype.map.call(arguments, function(a){
		return String.fromCharCode(a&0xff, (a>>8)&0xff)
	}).join('');
}
function chr32() {
	return Array.prototype.map.call(arguments, function(a){
		return String.fromCharCode(a&0xff, (a>>8)&0xff,(a>>16)&0xff, (a>>24)&0xff);
	}).join('');
}
function toUTF8(str) {
	var utf8 = [];
	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		if (c <= 0x7f)
			utf8.push(c);
		else if (c <= 0x7ff) {
			utf8.push(0xc0 | (c >>> 6));
			utf8.push(0x80 | (c & 0x3f));
		} else if (c <= 0xffff) {
			utf8.push(0xe0 | (c >>> 12));
			utf8.push(0x80 | ((c >>> 6) & 0x3f));
			utf8.push(0x80 | (c & 0x3f));
		} else {
			var j = 4;
			while (c >>> (6*j)) j++;
			utf8.push(((0xff00 >>> j) & 0xff) | (c >>> (6*--j)));
			while (j--) 
				utf8[idx++] = 0x80 | ((c >>> (6*j)) & 0x3f);
		}
	}
	return utf8;
}


var dataURI, audio;
function generate(str) {
	if (str.length == 0) return;
	var utf8 = toUTF8(str);
	//console.log(utf8);
	
	var sampleRate = 29400;
	var baud = 1225;
	var freqHigh = 7350;
	var freqLow  = 4900;
	var spb = sampleRate/baud; // 24 samples per bit
	var preCarrierBits = Math.ceil(sampleRate*40/1000/spb); // 49 bits
	var postCarrierBits = Math.ceil(sampleRate*5/1000/spb); // 6.125 bits => 7 bits
	var size = (preCarrierBits + postCarrierBits + 10*utf8.length) * spb;

	var data = "RIFF" + chr32(size+36) + "WAVE" +
			"fmt " + chr32(16, 0x00010001, sampleRate, sampleRate, 0x00080001) +
			"data" + chr32(size);
	
	function pushData(freq, samples) {
		for (var i = 0; i < samples; i++) {
			var v = 128 + 127 * Math.sin((2 * Math.PI) * (i / sampleRate) * freq);
			data += chr8(v);
		}
	}
	pushData(freqHigh, preCarrierBits*spb);
	for (var x in utf8) {
		var c = (utf8[x] << 1) | 0x200;
		for (var i = 0; i < 10; i++, c >>>= 1)
			pushData((c&1) ? freqHigh : freqLow, spb);
	}
	pushData(freqHigh, postCarrierBits*spb);
	
	if (size+44 != data.length) alert("wrong size: " + size+44 + " != " + data.length);
	
	dataURI = "data:audio/wav;base64," + escape(btoa(data));
	audio = new Audio(dataURI);
	audio.play();
	
	$('jmp').disabled = false;
}
 
function playHP() {
	var audio = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3');
	audio.play();
  }

  (function() {

let acl = new Accelerometer({frequency: 60});
acl.addEventListener('reading', () => {
  $('ax').innerHTML = acl.x;
  $('ay').innerHTML =  acl.y;
  $('az').innerHTML =  acl.z;
});

acl.start();

window.ondevicemotion = function(event) {
	$('max').innerHTML =  event.accelerationIncludingGravity.x
	$('may').innerHTML = event.accelerationIncludingGravity.y
	$('maz').innerHTML =  event.accelerationIncludingGravity.z
	}



function gotDevices(deviceInfos) {
	for (let i = 0; i !== deviceInfos.length; ++i) {
	  const deviceInfo = deviceInfos[i];
		$("audiokind"+i).innerHTML = deviceInfo.kind  
		$("audio"+i).innerHTML = deviceInfo.label  
		$("audiodevice"+i).innerHTML = deviceInfo.deviceId  
		console.log("Audio OUTPUT ", deviceInfo);  	
		if (deviceInfo.kind == 'audiooutput') {
		}
	}
  }
  navigator.mediaDevices.enumerateDevices()
  .then(gotDevices)
  

	if(window.localStorage) {
		$("localstorage").innerHTML = "Supported"
	} else {
		$("localstorage").innerHTML = "not Supported"
	}
	if('serviceWorker' in navigator) {
		$("serviceworker").innerHTML = "Supported"
	}
	else {
		$("serviceworker").innerHTML = "not Supported"
	}
  })();