// Path to google app credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname+"/google-credentials.json";

// Default Lang
// Available Snips language: en, fr, it, es, de, ja, ko
var defaultLang = "fr";

// pico2wave Voice Config
// Available Voices: en-US, en-GB, de-DE, es-ES, fr-FR, it-IT
var voicePico = [];
voicePico['en'] = "en-GB";
voicePico['fr'] = "fr-FR";
voicePico['it'] = "it-IT";
voicePico['es'] = "es-ES";
voicePico['de'] = "de-DE";
voicePico['ja'] = "en-US";
voicePico['ko'] = "en-US";

// Google Voice Config
// Available Voices: node listVoices.js
var voiceGoogle = [];
voiceGoogle['en'] = {voiceName: "en-US-Standard-B", voiceType: "MALE"};
voiceGoogle['fr'] = {voiceName: "fr-CA-Standard-D", voiceType: "MALE"};
voiceGoogle['it'] = {voiceName: "it-IT-Standard-A", voiceType: "FEMALE"};
voiceGoogle['es'] = {voiceName: "es-ES-Standard-A", voiceType: "FEMALE"};
voiceGoogle['de'] = {voiceName: "de-DE-Standard-B", voiceType: "MALE"};
voiceGoogle['ja'] = {voiceName: "ja-JP-Standard-A", voiceType: "FEMALE"};
voiceGoogle['ko'] = {voiceName: "ko-KR-Standard-C", voiceType: "MALE"};

// Timeout before offline Speak for Cloud TTS call (in ms)
var timeoutCloudTTS = 2500;

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
  clientMQTT.subscribe('hermes/audioServer/+/playFinished');
});

clientMQTT.on('message', function (topic, message) {
  var regExpFinished = /hermes\/audioServer\/.*\/playFinished/g;
  if( topic == 'hermes/tts/say' ){
		speakGoogle( JSON.parse(message) );
	}
  else if( regExpFinished.test(topic) ){
    sayFinished( JSON.parse(message) );
  }
});

var waitFinished = [];
function sayFinished( jsonMsg ) {
  if( waitFinished[jsonMsg.id] ){
    clientMQTT.publish("hermes/tts/sayFinished", '{"id":"'+waitFinished[jsonMsg.id].id+'", "sessionId":"'+waitFinished[jsonMsg.id].sessionId+'"}');
    waitFinished.splice(jsonMsg.id, 1);
  }
}

function speakGoogle( jsonMsg ) {
	var debut = Date.now();
	var hash = Math.random().toString(36).substr(2);
  if( jsonMsg.lang ){
    var voiceName = voiceGoogle[jsonMsg.lang.substr(0,2)].voiceName;
    var voiceType = voiceGoogle[jsonMsg.lang.substr(0,2)].voiceType;
  }
  else{
    var voiceName = voiceGoogle[defaultLang].voiceName;
    var voiceType = voiceGoogle[defaultLang].voiceType;
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
		speakOffline( jsonMsg );
	}, timeoutCloudTTS );

	client.synthesizeSpeech(request, (err, response) => {
		if (err) {
			console.error('[Bobby Snips TTS Log] ERROR ', err);
			if( !cancelSpeakGoogle ){
				clearTimeout(timeOfflineSpeak);
				speakOffline( jsonMsg );
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
            waitFinished[hash] = { id: jsonMsg.id, sessionId: jsonMsg.sessionId };
						clientMQTT.publish("hermes/audioServer/"+jsonMsg.siteId+"/playBytes/"+hash, decoder.getBuffer());
						// fs.writeFile('output.wav', decoder.getBuffer(), 'binary');
						console.log('[Bobby Snips TTS Log] '+hash+' / WAV Time '+(Date.now()-debut)+'ms');
					}
				}).catch((error) => {
					console.error('[Bobby Snips TTS Log] ERROR ', error);
					if( !cancelSpeakGoogle ){
						clearTimeout(timeOfflineSpeak);
						speakOffline( jsonMsg );
					}
				});
			}
			else{
				clearTimeout(timeOfflineSpeak);
				if( !cancelSpeakGoogle ){
          waitFinished[hash] = { id: jsonMsg.id, sessionId: jsonMsg.sessionId };
          clientMQTT.publish("hermes/audioServer/"+jsonMsg.siteId+"/playBytes/"+hash, response.audioContent);
					console.log('[Bobby Snips TTS Log] '+hash+' / WAV Time '+(Date.now()-debut)+'ms');
				}
			}
		}
	});
}

function speakOffline( jsonMsg ) {
	var debut = Date.now();
	var hash = Math.random().toString(36).substr(2);
  if( jsonMsg.lang ){
    var voiceLang = voicePico[jsonMsg.lang.substr(0,2)];
  }
  else{
    var voiceLang = voicePico[defaultLang];
  }
	exec('pico2wave -l ' + voiceLang + ' -w /tmp/' + hash + '.wav " ' + jsonMsg.text + '"', (error, stdout, stderr) => {
	  if(error) {
			console.error('[Bobby Snips TTS Log] ERROR ', error);
			return;
		}
		else{
			fs.readFile('/tmp/' + hash + '.wav', function (err, data ) {
        waitFinished[hash] = { id: jsonMsg.id, sessionId: jsonMsg.sessionId };
				clientMQTT.publish("hermes/audioServer/"+jsonMsg.siteId+"/playBytes/"+hash, data);
				console.log('[Bobby Snips TTS Log] '+hash+' / WAV Time '+(Date.now()-debut)+'ms');
				exec('rm -f /tmp/' + hash + '.wav');
			});
		}
	});
}
