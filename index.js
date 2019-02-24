process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname+"/google-credentials.json";

const mqtt = require('mqtt');
const Lame = require("node-lame").Lame;
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const toml = require('toml');
const snipsConfig = toml.parse(fs.readFileSync('/etc/snips.toml', 'utf-8'));
const exec = require('child_process').exec;

var mqttHostname = "mqtt://localhost";
var mqttOptions = {};

if( snipsConfig['snips-common']['mqtt'] ) mqttHostname = "mqtt://"+snipsConfig['snips-common']['mqtt'];
if( snipsConfig['snips-common']['mqtt_username'] ) mqttOptions['username'] = snipsConfig['snips-common']['mqtt_username'];
if( snipsConfig['snips-common']['mqtt_password'] ) mqttOptions['password'] = snipsConfig['snips-common']['mqtt_password'];

var clientMQTT  = mqtt.connect(mqttHostname, mqttOptions);

var audioEncoding = 'MP3';
exec('lame --help', (error, stdout, stderr) => {
	if(error) {
		console.log('[Bobby Snips TTS Log] LAME not found');
		audioEncoding = 'LINEAR16';
	}
});

clientMQTT.on('connect', function () {
	console.log("[Bobby Snips TTS Log] Connected to MQTT broker " + mqttHostname);
	clientMQTT.subscribe('hermes/tts/say');
});

clientMQTT.on('message', function (topic, message) {
	if( topic == 'hermes/tts/say' ){
		var jsonMessage = JSON.parse(message);
		SpeakGoogle( jsonMessage );
	}
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
		audioConfig: {audioEncoding: audioEncoding},
	};
	var cancelSpeakGoogle = false;
	var timeOfflineSpeak = setTimeout( function(){
		cancelSpeakGoogle = true;
		SpeakOffline( jsonMsg );
	}, 2000 );

	client.synthesizeSpeech(request, (err, response) => {
		if (err) {
			console.error('[Bobby Snips TTS Log] ERROR ', err);
			if( !cancelSpeakGoogle ){
				clearTimeout(timeOfflineSpeak);
				SpeakOffline( jsonMsg );
			}
			return;
		}
		else{
			if( audioEncoding == 'MP3' ){
				console.log('[Bobby Snips TTS Log] '+hash+' / MP3 Time '+(Date.now()-debut)+'ms');
				// fs.writeFile('output.mp3', response.audioContent, 'binary');
				var decoder = new Lame({"output": "buffer"}).setBuffer(response.audioContent);
				decoder.decode().then(() => {
					clearTimeout(timeOfflineSpeak);
					if( !cancelSpeakGoogle ){
						clientMQTT.publish("hermes/audioServer/default/playBytes/{}"+hash, decoder.getBuffer());
						clientMQTT.publish("hermes/tts/sayFinished", '{id:"'+jsonMsg.id+'", sessionId: "'+jsonMsg.sessionId+'"}');
						// fs.writeFile('output.wav', decoder.getBuffer(), 'binary');
						console.log('[Bobby Snips TTS Log] '+hash+' / WAV Time '+(Date.now()-debut)+'ms');
					}
				}).catch((error) => {
					console.error('[Bobby Snips TTS Log] ERROR ', error);
					if( !cancelSpeakGoogle ){
						clearTimeout(timeOfflineSpeak);
						SpeakOffline( jsonMsg );
					}
				});
			}
			else{
				clearTimeout(timeOfflineSpeak);
				if( !cancelSpeakGoogle ){
					clientMQTT.publish("hermes/audioServer/default/playBytes/{}"+hash, response.audioContent);
					clientMQTT.publish("hermes/tts/sayFinished", '{id:"'+jsonMsg.id+'", sessionId: "'+jsonMsg.sessionId+'"}');
					console.log('[Bobby Snips TTS Log] '+hash+' / WAV Time '+(Date.now()-debut)+'ms');
				}
			}
		}
	});
}

function SpeakOffline( jsonMsg ) {
	var debut = Date.now();
	var hash = Math.random().toString(36).substr(2);
	jsonMsg.lang = "fr-FR";
	exec('pico2wave -l ' + jsonMsg.lang + ' -w /tmp/' + hash + '.wav " ' + jsonMsg.text + '"', (error, stdout, stderr) => {
	  if(error) {
			console.error('[Bobby Snips TTS Log] ERROR ', error);
			return;
		}
		else{
			fs.readFile('/tmp/' + hash + '.wav', function (err, data ) {
				clientMQTT.publish("hermes/audioServer/default/playBytes/{}"+hash, data);
				clientMQTT.publish("hermes/tts/sayFinished", '{id:"'+jsonMsg.id+'", sessionId: "'+jsonMsg.sessionId+'"}');
				console.log('[Bobby Snips TTS Log] '+hash+' / WAV Time '+(Date.now()-debut)+'ms');
				exec('rm -f /tmp/' + hash + '.wav');
			});
		}
	});
}
