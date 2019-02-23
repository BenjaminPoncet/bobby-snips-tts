process.env.GOOGLE_APPLICATION_CREDENTIALS="/home/pi/bobby-snips-tts/google-credentials.json";

const mqtt = require('mqtt');
const Lame = require("node-lame").Lame;
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const toml = require('toml');
const snipsConfig = toml.parse(fs.readFileSync('/etc/snips.toml', 'utf-8'));

var mqttHostname = "mqtt://localhost";
var mqttOptions = {};

if( snipsConfig['snips-common']['mqtt'] ) mqttHostname = "mqtt://"+snipsConfig['snips-common']['mqtt'];
if( snipsConfig['snips-common']['mqtt_username'] ) mqttOptions['username'] = snipsConfig['snips-common']['mqtt_username'];
if( snipsConfig['snips-common']['mqtt_password'] ) mqttOptions['password'] = snipsConfig['snips-common']['mqtt_password'];

var clientMQTT  = mqtt.connect(mqttHostname, mqttOptions);

clientMQTT.on('connect', function () {
	console.log("[Bobby Snips TTS Log] Connected to MQTT broker " + mqttHostname);
	clientMQTT.subscribe('hermes/tts/say');
});

clientMQTT.on('message', function (topic, message) {
	var jsonMessage = JSON.parse(message);
	SpeakGoogle( jsonMessage );
});

function SpeakGoogle( jsonMsg ) {
	var debut = Date.now();
	var hash = Math.random().toString(36).substr(2);
	if( jsonMsg.lang == 'it-IT' ){
		var voiceName = "it-IT-Standard-A";
		var voiceType = "FEMALE";
	}
	else{
		var voiceName = "fr-CA-Standard-D";
		var voiceType = "MALE";
		jsonMsg.lang = "fr-CA";
	}
	var client = new textToSpeech.TextToSpeechClient();
	var request = {
		input: {text: jsonMsg.text},
		voice: {languageCode: jsonMsg.lang, ssmlGender: voiceType, name: voiceName},
		//audioConfig: {audioEncoding: 'LINEAR16'},
		audioConfig: {audioEncoding: 'MP3'},
	};

	client.synthesizeSpeech(request, (err, response) => {
		if (err) {
			console.error('[Bobby Snips TTS Log] ERROR ', err);
			return;
		}
		else{
			console.log('[Bobby Snips TTS Log] '+hash+' / MP3 Time '+(Date.now()-debut));
			// fs.writeFile('output.mp3', response.audioContent, 'binary');
			var decoder = new Lame({"output": "buffer"}).setBuffer(response.audioContent);
			decoder.decode().then(() => {
				clientMQTT.publish("hermes/audioServer/default/playBytes/{}"+hash, decoder.getBuffer());
				clientMQTT.publish("hermes/tts/sayFinished", '{id:"'+jsonMsg.id+'", sessionId: "'+jsonMsg.sessionId+'"}');
				// fs.writeFile('output.wav', decoder.getBuffer(), 'binary');
				console.log('[Bobby Snips TTS Log] '+hash+' / WAV Time '+(Date.now()-debut));
			}).catch((error) => {
				console.error('[Bobby Snips TTS Log] ERROR ', error);
			});
		}
	});
}
