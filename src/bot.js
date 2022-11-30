require("dotenv").config();
const { Client, Intents, MessageEmbed } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioResource, StreamType } = require("@discordjs/voice");
const { createReadStream } = require('node:fs');
const createDiscordJSAdapter = require("./adaptaters/adaptater");
const AmadeusAudioPlayer = require("./voices/voice");
const Track = require('./voices/track')
const moment = require('moment');
const Axios = require('axios').default;
const { fetchDadJoke } = require("./memes/memesApi");
const Snoowrap = require("snoowrap");
const Bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_BANS] });
const { join } = require('path');

console.log("Started");
Bot.on('ready', () => {
    console.log(`${Bot.user.username} has logged in`)
});

// Global Variable
let audioPlayer;
let connection;
let r = new Snoowrap({
    userAgent: "amadeusBot 0.1",
    clientId: "K6wuko3LdhtlRJb0hiix-Q",
    clientSecret: "qbpdjmcZtPmTvaT4hxKNsrswSDh7mw",
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
})

Bot.on("messageCreate", async (message) => {


    if (message.author.bot || message.content[0] !== "$") return false;
    console.log(`Message from ${message.author.username}: ${message.content}`);

    //Get msg substring and make sure it's addressed to Amadeus
    const actualMsg = message.content.toLowerCase().substring(1, message.content.length);

    // Simple hello
    if (actualMsg == "hello there") {
        message.channel.send('General Kenobi !');
    }

    // insult
    const regexInsult = /(imb[éeèê]cil[e]?|enfoir[éeè]|con|b[eêèé]t[e]?|d[éeèê]bil[e]?|stupide?)/
    if (/(hadrien|nogann|amadeus)/.test(actualMsg) && regexInsult.test(actualMsg)) {
        const match = actualMsg.match(regexInsult);
        const reply = message.author.username + " est " + match[0].charAt(0).toUpperCase() + match[0].slice(1)
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                message.channel.send(reply);
            }, 200 * i);
        }
    }

    // Time 
    else if (actualMsg.includes('what time')) {
        const tops = Math.floor(Math.random() * 4 + 1);
        const time = moment().format('HH:mm:SS')
        let nmrSuffix
        if (tops === 1) nmrSuffix = 'st';
        if (tops === 2) nmrSuffix = 'nd';
        if (tops === 3) nmrSuffix = 'rd';
        if (tops >= 4) nmrSuffix = 'th';

        message.channel.send(`At the ${tops}${nmrSuffix} Top, il will be ${time}. ${"Top! ".repeat(tops)}`);
    }

    // Join channel the user is in
    else if (actualMsg === "join" && message.member.voice.channel) {
        connection = await connectToChannel(message.member.voice.channel);
    }

    else if (actualMsg === "leave") {
        if (connection) destroyConnection(connection);
    }

    // ------- MUSIC --------

    else if (actualMsg.startsWith("play")) {
        // Stop current song 
        audioPlayer?.stop();

        // Check for connection
        connection = await checkForConnection(message);
        console.log(connection);

        let link;
        // remove the first word of the string
        const linkOrKeyword = message.content.substring(message.content.indexOf(" ")).trim();
        if (linkOrKeyword.length === 0 || !/\s/.test(message.content)) audioPlayer?.unpause();
        if (isValidURL(linkOrKeyword)) link = linkOrKeyword;
        else {
            info = await getVideoInfoFromKeyword(linkOrKeyword);
            if (!info) {
                message.channel.send('No video found with this keyword: "' + linkOrKeyword + '" :/ ');
                console.log(info);
                return;
            }
            console.log("link",link);
            link = info.link;
            messageEmbed = new MessageEmbed()
                .setTitle(`Playing ${info.title} from channel ${info.channel}`)
                .setImage(info.thumbnail)
                .setURL(info.link);
            message.channel.send({ embeds: [messageEmbed] });
        }
        let ressource;
        try {
            ressource = await Track.fromUrl(link);
        } catch (error) {
            console.log("error while loading URL : ", error);
            message.channel.send(`An error occured while loading the video`);
            return;
        }

        if (!audioPlayer) audioPlayer = new AmadeusAudioPlayer(connection.joinConfig.guildId, ressource);
        else {
            audioPlayer.stop();
            audioPlayer.ressource = ressource;
        }
        audioPlayer.play();
    }

    else if (actualMsg.startsWith("stop")) {
        if (!audioPlayer || !connection || !audioPlayer.ressource) return false;

        audioPlayer.stop();
    }

    else if (actualMsg.startsWith("pause")) {
        if (!audioPlayer || !connection || !audioPlayer.ressource) return false;

        audioPlayer.pause();
    }

    else if (actualMsg.startsWith("unpause") || actualMsg.startsWith("resume")) {
        if (!audioPlayer || !connection || !audioPlayer.ressource) return false;

        audioPlayer.unpause()
    }

    else if (actualMsg.startsWith("earrape")) {
        if (!audioPlayer || !connection || !audioPlayer.ressource) return false;

        if (message.author.tag?.toLowerCase() === "orion#0010" || message.author.tag?.toLowerCase() === "gistero#8632"){
            message.member.voice.disconnect("You tried to rape our ears !");
            message.channel.send(`${message.author.tag} tried to rape your ears. He was sentenced with DEATH 💀`)
        } else {
            audioPlayer.earRape();
            message.channel.send(`👂 watch your ears ! 👂`);
        }
    }

    else if (actualMsg.includes("vento d'oro")) {
        // Stop current song 
        audioPlayer?.stop();
        console.log("check connection");
        connection = await checkForConnection(message);
        console.log("connection checked");
        ressource = createAudioResource(createReadStream(join(__dirname, "./voices/mp3/ventodoro.mp3")), {
            inlineVolume: true,
            inputType: StreamType.Arbitrary
        });
        console.log("ressource created")
        if (!audioPlayer) audioPlayer = new AmadeusAudioPlayer(connection.joinConfig.guildId, ressource);
        else {
            audioPlayer.stop();
            audioPlayer.ressource = ressource;
        }
        audioPlayer.play();
        message.channel.send('👑💨 Feel the golden wind !! 💨👑');
    }

    // ----- MEMES -----
    else if (actualMsg.startsWith("meme") || actualMsg.startsWith("joke")) {
        const randIndex = Math.floor(Math.random() * 10);
        let title, text, images;
        switch (randIndex) {
            case 0: {
                let submission = await getSubredditPost("jokes");
                title = submission.title;
                text = submission.selftext;
                images = submission.images;
                break;
            }
            case 1: {
                let submission = await getSubredditPost("shitamericassay");
                title = submission.title;
                text = submission.selftext;
                images = submission.images;
                break;
            }
            case 2: {
                let submission = await getSubredditPost("copypasta");
                title = submission.title;
                text = submission.selftext;
                images = submission.images;
                break;
            }
            case 4: {
                let submission = await getSubredditPost("facepalm");
                title = submission.title;
                text = submission.selftext;
                images = submission.images;
                break;
            }
            case 5: {
                let submission = await getSubredditPost("badwomensanatomy");
                title = submission.title;
                text = submission.selftext;
                images = submission.images;
                break;
            }
            case 6: {
                let submission = await getSubredditPost("PrequelMemes");
                title = submission.title;
                text = submission.selftext;
                images = submission.images;
                break;
            }
            case 7: {
                let submission = await getSubredditPost("terriblefacebookmemes");
                title = submission.title;
                text = "❗ Caution : Boomer Humour ❗ \n" + submission.selftext;
                images = submission.images;
                break;
            }
            case 8: {
                let submission = await getSubredditPost("technicallythetruth");
                title = submission.title;
                text = submission.selftext;
                images = submission.images;
                break;
            }
            case 9:
                let joke = await fetchDadJoke();
                title = joke;
                text = "";
                images = [];
                break;
        }

        console.log(images, randIndex);
        const messageEmbeds = [
            new MessageEmbed()
                .setTitle(title)
                .setDescription(text)
                .setImage(images[0])
        ]
        images.slice(1).forEach((image) => {
            const messageEmbed = new MessageEmbed()
                .setTitle("")
                .setDescription("")
                .setImage(image);
            messageEmbeds.push(messageEmbed);
        })


        message.channel.send({ embeds: messageEmbeds });
    } else if (actualMsg.startsWith("ball")) {
        messageEmbed = new MessageEmbed()
            .setImage("https://cdn.discordapp.com/attachments/588843528550088709/997241679755104316/EYZi0aLXQAE9pff_1.jpg");
        message.channel.send({ embeds: [messageEmbed] });
    }
});

// on all user leave
Bot.on('voiceStateUpdate', async (oldState, newState) => {

        // if nobody left the channel in question, return.
        if (oldState.channelID !==  oldState.guild.me.voice.channelID || newState.channel)
          return;
      
        if (oldState.channel.members.size - 1 <= 0) {
            setTimeout(() => { // if 1 (you), wait five minutes
                if (oldState.channel.members.size - 1 === 0 && connection?.state?.status !== "destroyed") // if there's still 1 member, 
                 destroyConnection(connection);
               }, 1000); 
        }
          
});

async function connectToChannel(channel) {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: createDiscordJSAdapter(channel),
        selfDeaf: false
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
        return connection;
    } catch (error) {
        connection.destroy();

        throw error;
    }
}

async function destroyConnection(connection) {
    try {
        connection.disconnect();
        connection.destroy();
        connection = null;
    } catch (error) {
        console.log("could not destroy connection : ", error);
    }
}

async function checkForConnection(message) {
    if (message.member.voice.channel) {
        const channel = message.member.voice.channel;
        connection = await connectToChannel(channel)
        connection.on('error', console.warn);
        return connection
    }
}

function isValidURL(str) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

async function getVideoInfoFromKeyword(keyword) {
    const results = await Axios.get(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${keyword}&key=AIzaSyAp4ygKfnr43aIjl4vUye4pbR4CsuABJ5g`)
    console.log("results", results);
    if (!results.data.items.length) {
        console.error("no results ");
        return;
    }
    for (let i = 0; i < results.data.items.length; i++) {
        console.log(results.data.items[i].id);
        if (results.data.items[i].id.videoId) {
            return {
                link: "https://www.youtube.com/watch?v=" + results.data.items[i].id.videoId,
                thumbnail: results.data.items[i].snippet.thumbnails.high.url,
                title: results.data.items[i].snippet.title,
                channel: results.data.items[i].snippet.channelTitle
            };
        }
    }
}

async function getSubredditPost(subreddit) {
    const submissions = await r.getSubreddit(subreddit).getHot({ count: 100 });
    let subm_filtered = submissions.filter((submission) => !submission.stickied && !submission.is_video)
    subm_filtered.sort((a, b) => b.score - a.score);
    subm_filtered = subm_filtered.slice(0, 10);
    const randIndex = Math.floor(Math.random() * subm_filtered.length);
    // getting image gallery urls;
    const images = [];
    console.log(subm_filtered[randIndex], randIndex, subm_filtered.length);

    // If it's a gallery of images
    if (subm_filtered[randIndex].media_metadata) {
        const tempImages = []
        // first gather all the images in an array
        for (let key in subm_filtered[randIndex].media_metadata) {
            tempImages.push(subm_filtered[randIndex].media_metadata[key]);
        }
        // then pushing them in another array in the right order
        for (let key in subm_filtered[randIndex].gallery_data.items) {
            let imageToPush = tempImages.find((image) => image.id === subm_filtered[randIndex].gallery_data.items[key].media_id);
            images.push(imageToPush.s.u);
        }
        // if it's an image from another site (ex imgur)
    } else if (subm_filtered[randIndex].media) {
        images.push(subm_filtered[randIndex].media.oembed.thumbnail_url)
        // if it's a simple image
    } else {
        images.push(subm_filtered[randIndex].url);

    }
    subm_filtered[randIndex].images = images;
    return subm_filtered[randIndex];
}


Bot.login(process.env.DISCORDJS_BOT_TOKEN);