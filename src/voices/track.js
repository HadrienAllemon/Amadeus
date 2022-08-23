const ytdl = require('ytdl-core');
const { getInfo } = require('ytdl-core');
const { demuxProbe, createAudioResource } = require('@discordjs/voice');


class Track {
    title;
    url;

    static async fromUrl(url) {
        this.url = url;
        console.log("URL", this.url);
        const stream = ytdl(url, { filter: "audioonly" });
        stream.on('error', err => {
            console.log('ERROR', err);
        });
        const probeInfo = await demuxProbe(stream).catch(error => console.log("error probe > ", error));
        return createAudioResource(probeInfo.stream, { inputType: probeInfo.type, metadata: this, inlineVolume:true })
    }
}

module.exports = Track;