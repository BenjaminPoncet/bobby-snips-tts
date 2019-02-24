const mqtt = require('mqtt');
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
	console.log("[Bobby Snips TTS Test Log] Connected to MQTT broker " + mqttHostname);
  setInterval(function(){
    console.log("[Bobby Snips TTS Test Log] Send Text to TTS");
    clientMQTT.publish("hermes/tts/say", '{"siteId": "default", "sessionId": "123", "text": "Bonjour gros", "lang": "fr-FR", "id":"hermes/tts/sayFinished"}');
  },5000);
});
