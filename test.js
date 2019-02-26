const mqtt = require('mqtt');
const fs = require('fs');
const toml = require('toml');
const snipsConfig = toml.parse(fs.readFileSync('/etc/snips.toml', 'utf-8'));

var textToSpeech = [];
textToSpeech[0] = { lang: "en", text: "Hello Bobby" };
textToSpeech[1] = { lang: "fr", text: "Bonjour Bobby" };
textToSpeech[2] = { lang: "it", text: "Ciao Bobby" };
textToSpeech[3] = { lang: "es", text: "Hola Bobby" };
textToSpeech[4] = { lang: "de", text: "Hallo Bobby" };
textToSpeech[5] = { lang: "ja", text: "こんにちはボビー" };
textToSpeech[6] = { lang: "ko", text: "안녕, 바비" };
var i=0;

var mqttHostname = "mqtt://localhost";
var mqttOptions = {};

if( snipsConfig['snips-common']['mqtt'] ) mqttHostname = "mqtt://"+snipsConfig['snips-common']['mqtt'];
if( snipsConfig['snips-common']['mqtt_username'] ) mqttOptions['username'] = snipsConfig['snips-common']['mqtt_username'];
if( snipsConfig['snips-common']['mqtt_password'] ) mqttOptions['password'] = snipsConfig['snips-common']['mqtt_password'];

var clientMQTT  = mqtt.connect(mqttHostname, mqttOptions);

clientMQTT.on('connect', function () {
	console.log("[Bobby Snips TTS Test Log] Connected to MQTT broker " + mqttHostname);
	setInterval(function(){
		if(i == textToSpeech.length ) i = 0;
		console.log("[Bobby Snips TTS Test Log] Send Text to TTS "+textToSpeech[i].lang);
  	clientMQTT.publish("hermes/tts/say", '{"siteId": "default", "sessionId": "test-'+textToSpeech[i].lang+'", "text": "'+textToSpeech[i].text+'", "lang": "'+textToSpeech[i].lang+'", "id":"'+i+'"}');
		i++;
	}, 5000);
});
