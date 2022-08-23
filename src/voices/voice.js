const { createAudioPlayer, NoSubscriberBehavior, getVoiceConnection, createAudioResource } = require('@discordjs/voice');
const libwrap = require("libsodium-wrappers");
const { join } = require('path');


class AmadeusAudioPlayer {
    constructor(connectionId, ressource) {
        this.audioPlayer = undefined
        this.connectionId = connectionId;
        this.ressource = ressource;
        this.earRaping = false;
    }
    createAudioPlayer() {
        this.audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });
        this.audioPlayer.on('error', error => {
            console.error('Error:', error.message, 'with track', error.resource.metadata.title);
        });
    }
    stop() {
        this.audioPlayer.stop();
    }
    pause() {
        this.audioPlayer.pause();
    }
    unpause() {
        this.audioPlayer.unpause()
    }
    play() {
        const connection = getVoiceConnection(this.connectionId);
        if (this.audioPlayer == undefined) this.createAudioPlayer();
        this.ressource.volume.setVolume(0.5);
        this.audioPlayer.play(this.ressource);

        connection.subscribe(this.audioPlayer);
        this.audioPlayer.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            this.audioPlayer.stop();
        });

    }
    earRape() {
        console.log(this.ressource.volume.volume)
        if (this.ressource.volume.volume === 100) {
            this.ressource.volume.setVolume(0.5);
            this.earRaping = false;
            console.log("starting ear rape")
        } else {
            this.ressource.volume.setVolume(100);
            this.earRaping = true;
            console.log("starting ear rape")
        }

    }
}

module.exports = AmadeusAudioPlayer;