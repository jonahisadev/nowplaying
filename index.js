const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const spotify = require('./spotify');
const User = require('./user');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejs.renderFile);

const db = require('./db');

// app.use(helmet());
app.use(session({
    secret: 'woiefghwioegb',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60
    },
    store: new MongoStore({mongooseConnection: db.connection})
}));
app.use(cookieParser());
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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/callback', async (req, res) => {
    const tokens = await spotify.authorize(req.query['code']);
    const email = await spotify.getEmail(tokens.access_token);
    
    User.findOne({email: email}).then(user => {
        if (!user) {
            user = new User();
            user.email = email;
            user.o_opacity = 100;
            user.o_outline = true;
            user.o_color = "255,255,255";
            user.o_hex = "#ffffff";
        }
        
        user.sp_access = tokens.access_token;
        user.sp_refresh = tokens.refresh_token;
        user.sp_expires = new Date(Date.now() + tokens.expires * 1000);
        
        user.save({}).then(_ => {
            req.session['login_user'] = user;
            console.log(req.session);
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

app.get('/tutorial/:platform', (req, res) => {
    const name = `tut_${req.params['platform']}`;
    
    if (fs.existsSync(path.join(__dirname, 'views', name + '.ejs'))) {
        res.render(name);
        return;
    }
    
    res.redirect('/');
});

app.get('/overlay', (req, res) => {
    if (!req.query['id']) {
        res.redirect('/');
        return;
    }
    
    User.findById(req.query['id']).then(user => {
        res.render('overlay', {
            user: user,
            demo: (req.query['demo'] == 'true')
        });
    });
});

// Returns JSON
app.use(express.json());
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
        
        // Access token breaks in a minute, refresh
        if (new Date(user.sp_expires + (60 * 1000)) < Date.now()) {
            console.log("Attempting refresh...");
            // Get tokens
            const tokens = await spotify.refresh(user.sp_access, user.sp_refresh);

            // Update
            user.sp_access = tokens.access_token;
            user.sp_expires = new Date(Date.now() + (tokens.expires * 1000));

            // Save
            await user.save({});
            req.session['login_user'] = user;
        }

        // Get string
        const str = await spotify.nowPlaying(user.sp_access);
        res.json({str: str});
    });
});

// Expects JSON body
app.post('/save', (req, res) => {
    User.findById(req.session['login_user']._id).then(user => {
        user.o_opacity = req.body['opacity'];
        user.o_outline = req.body['outline'];
        user.o_color = req.body['color'];
        user.o_hex = req.body['hex'];
        user.save({}).then(_ => {
            req.session['login_user'] = user;
            res.json({msg: 'Success'});
        });
    });
});

app.listen(PORT, _ => console.log(`Listening on port ${PORT}`));