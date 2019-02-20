/**
 * Copyright 2018, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

process.env.GOOGLE_APPLICATION_CREDENTIALS="/home/pi/ttsGoogle/Bobby-Project-a17eb26b6045.json";

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
