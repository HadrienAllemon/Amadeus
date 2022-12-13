const Axios = require('axios').default;

async function getVideoInfoFromKeyword(keyword) {
    const results = await Axios.get(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${keyword}&key=AIzaSyAp4ygKfnr43aIjl4vUye4pbR4CsuABJ5g`)
    console.log("results", results);
    if (!results.data.items.length) {
        console.error("no results ");
        return;
    }
    for (let i = 0; i < results.data.items.length; i++) {
        console.log("ID", results.data.items[i].id);
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

module.exports = getVideoInfoFromKeyword