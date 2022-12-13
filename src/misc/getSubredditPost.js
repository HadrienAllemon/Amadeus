const Snoowrap = require("snoowrap");

let r = new Snoowrap({
    userAgent: "amadeusBot 1.0",
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
})

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

module.exports = getSubredditPost