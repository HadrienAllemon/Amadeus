const Axios = require('axios').default;

exports.fetchDadJoke = async () => {
    const result = await Axios.get("https://www.icanhazdadjoke.com",{headers: {Accept: "application/json", "User-Agent": "axios 0.21.1"}})
        .catch(error=>console.log("error", JSON.stringify(error.config)));
    return result.data.joke;
}