process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname+"/google-credentials.json";

const textToSpeech = require('@google-cloud/text-to-speech');

const client = new textToSpeech.TextToSpeechClient();

client.listVoices({languageCode: ''}, (err, response) => {
	if (err) {
  		console.error('ERROR:', err);
  		return;
  	}
  	else{
		const voices = response.voices;
		console.log('Voices:');
		voices.forEach(voice => {
			console.log(`Name: ${voice.name}`);
			console.log(`  SSML Voice Gender: ${voice.ssmlGender}`);
			console.log(`  Natural Sample Rate Hertz: ${voice.naturalSampleRateHertz}`);
			console.log(`  Supported languages:`);
			voice.languageCodes.forEach(languageCode => {
				console.log(`    ${languageCode}`);
			});
		});
	}
});
