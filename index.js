const path = require('path');
const ejs = require('ejs');
const spotify = require('./spotify');
const User = require('./user');
const session = require('express-session');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejs.renderFile);

app.set('trust proxy', 1);
app.use(session({
    secret: 'woiefghwioegb',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        expires: new Date(Date.now() + (1000 * 60 * 60))
    }
}));
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    if (req.session['login_user']) {
        res.redirect('/dashboard');
        return;
    }

    res.render('land', {
        spotify: spotify.getAuthURL()
    });
});

app.get('/callback', async (req, res) => {
    const tokens = await spotify.authorize(req.query['code']);
    const email = await spotify.getEmail(tokens.access_token);

    User.findOne({email: email}).then(user => {
        if (!user) {
            user = new User();
            user.email = email;
        }

        user.sp_access = tokens.access_token;
        user.sp_refresh = tokens.refresh_token;
        user.sp_expires = new Date(Date.now() + tokens.expires * 1000);
        user.save({}).then(_ => {
            req.session['login_user'] = user;
            res.redirect('/dashboard');
        });
    });
});

app.get('/dashboard', async (req, res) => {
    if (!req.session['login_user']) {
        res.redirect('/');
        return;
    }

    res.render('dashboard', {
        user: req.session['login_user']
    });
});

app.get('/overlay', (req, res) => {
    if (!req.query['id']) {
        res.redirect('/');
        return;
    }

    User.findById(req.query['id']).then(user => {
        res.render('overlay', {
            user: user
        });
    });
});

// Returns JSON
app.get('/nowplaying', async (req, res) => {
    if (!req.query['id']) {
        res.json({error: "No ID given"});
        return;
    }

    User.findById(req.query['id']).then(async user => {
        if (!user) {
            res.json({error: "No such user"});
            return;
        }

        const str = await spotify.nowPlaying(user.sp_access);
        res.json({str: str});
    });
});

app.listen(PORT, _ => console.log(`Listening on port ${PORT}`));