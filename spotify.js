const fs = require('fs');
const path = require('path');
const Spotify = require('spotify-web-api-node');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));
const API = new Spotify({
    clientId: config.client_id,
    clientSecret: config.client_secret,
    redirectUri: config.callback
});

const scopes = [
    'user-read-playback-state',
    'user-read-email'
];

module.exports.getAuthURL = () => {
    return API.createAuthorizeURL(scopes, 'spotify');
};

module.exports.authorize = async (code) => {
    return API.authorizationCodeGrant(code).then(data => {
        return {
            access_token: data.body['access_token'],
            refresh_token: data.body['refresh_token'],
            expires: data.body['expires_in']
        };
    }, err => {
        return {
            error: err
        };
    });
};

module.exports.refresh = async (code, re) => {
    const api = new Spotify({
        clientId: API.getClientId(),
        clientSecret: API.getClientSecret(),
        accessToken: code,
        refreshToken: re
    });

    return api.refreshAccessToken().then(async data => {
        console.log(data.body);
        return {
            access_token: data.body['access_token'],
            refresh_token: data.body['refresh_token'],
            expires: data.body['expires_in']
        };
    }, err => {
        console.log("Error: " + err);
        return {};
    });
};

module.exports.getEmail = async (code) => {
    const api = new Spotify({
        clientId: API.getClientId(),
        clientSecret: API.getClientSecret(),
        accessToken: code
    });

    return api.getMe().then(data => {
        return data.body.email;
    }, err => {
        console.log(err);
        return "Error";
    });
};

module.exports.nowPlaying = async (code) => {
    const api = new Spotify({
        clientId: API.getClientId(),
        clientSecret: API.getClientSecret(),
        accessToken: code
    });

    return api.getMyCurrentPlaybackState({}).then(data => {
        if (Object.entries(data.body).length === 0)
            return "";
        
        var str = "";
        const item = data.body.item;
        str += item.name + " by ";
        for (var i = 0; i < item.artists.length; i++) {
            str += item.artists[i].name;
            if (i != item.artists.length - 1)
                str += ", ";
        }
        return str;
    });
};