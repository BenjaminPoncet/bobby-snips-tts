# bobby-snips-tts

bobby-snips-tts is an implementation of snips-tts written in Node.js. Why? Because Node.js is life!

It's a part of Bobby Assistant Project but it's designed to run in standalone. So, feel free to fork, use and modify it.

This implementation can use Google Text-To-Speech (and maybe more in the future) as replacement of pico2wave for more natural speak.

Because Google TTS (and much more TTS) are Online TTS, pico2wave is used has offline or timeout failover.

## Dependencies

### Get Google Text-To-Speech API Key

1.  Select or create a Cloud Platform project.

    [Go to the projects page][projects]

1.  Enable billing for your project.

    [Enable billing][billing]

1.  Enable the Google Cloud Text-to-Speech API.

    [Enable the API][enable_api]

1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

*This guide is an exact of Official Google Text-To-Speech Project. See more on [googleapis/nodejs-text-to-speech][tts_project]*

[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing
[enable_api]: https://console.cloud.google.com/flows/enableapi?apiid=texttospeech.googleapis.com
[auth]: https://cloud.google.com/docs/authentication/getting-started
[tts_project]: https://github.com/googleapis/nodejs-text-to-speech

### Install LAME

LAME is used for converting MP3 buffer from Google TTS API to WAV buffer on the fly because Snips Audio Server play only WAV buffer.

bobby-snips-tts can work without LAME by asking WAV buffer directly from Google TTS API but WAVs are about 10 times bigger than MP3s so slower on network.

With `apt-get` LAME can be simply install by running
```bash
apt-get install lame
```
*See more on [LAME Website][lame_website]*

[lame_website]: http://lame.sourceforge.net

## Install bobby-snips-tts

First, you need Node.js and Git.

Go in your favorite Node.js project directory (for me `/home/pi`) and run
```bash
git clone https://github.com/BenjaminPoncet/bobby-snips-tts.git
```
Move to `bobby-snips-tts` directory and run
```bash
npm install
```
Copy your JSON GOOGLE APPLICATION CREDENTIALS in `bobby-snips-tts` directory and rename it `google-credentials.json`

## Voice configuration

See top of `index.js`:
```javascript
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
```

## Manual run (for testing)

Stop `snips-tts` by running
```bash
systemctl stop snips-tts
```
Move to `bobby-snips-tts` directory and run
```bash
node index.js
```

## Run as a service

Edit `bobby-snips-tts.service` and change the path of `index.js` if need (default is `/home/pi/bobby-snips-tts/index.js`)

Move `bobby-snips-tts.service` in `/etc/systemd/system/` directory.

Stop and disable `snips-tts` by running
```bash
systemctl stop snips-tts
systemctl disable snips-tts
```
Enable and start `bobby-snips-tts` by running
```bash
systemctl --system daemon-reload
systemctl enable bobby-snips-tts
systemctl start bobby-snips-tts
```

## Todo

TODO

## Credits

[Snips][snips] Voice Platform

[KiboOst/SNIPS-Tips][tips1] and [snipsco/awesome-snips][tips2] for inspiration

[snips]: https://snips.ai
[tips1]: https://github.com/KiboOst/SNIPS-Tips
[tips2]: https://github.com/snipsco/awesome-snips


