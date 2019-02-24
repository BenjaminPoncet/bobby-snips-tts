# bobby-snips-tts

booby-snips-tts is an implementation of snips-tts written in NodeJS.

It is a part of Bobby Assistant Project but it designed to run in standlone. So feel free to fork, use and modify it.

This implementation can use Google Text-To-Speech (and more in the future) as replacement of pico2wave for more natural speak.

Because Google TTS (and much more TTS) are Online TTS, pico2wave is used has offline or timeout failover.

## Dependencies

To Do

## Install

First, you need NodeJS and Git. You may need to use `sudo` command.

Go in your favorite NodeJS directory (for me `/home/pi`) and run `git clone https://github.com/BenjaminPoncet/bobby-snips-tts.git`

Move to `bobby-snips-tts` directory and run `npm install`

## Manual Run (for testing)

Stop snips-tts by running `systemctl stop snips-tts`

Move to `bobby-snips-tts` directory and run `node index.js`

## Run as a service

Edit `bobby-snips-tts.service` and change the path of `index.js` if need (default is `/home/pi/bobby-snips-tts/index.js`)

Move `bobby-snips-tts.service` in `/etc/systemd/system/` directory.

Stop and disable snips-tts by running

`systemctl stop snips-tts`

`systemctl disable snips-tts`

Enable and start bobby-snips-tts by running

`systemctl --system daemon-reload`

`systemctl enable bobby-snips-tts`

`systemctl start bobby-snips-tts`






