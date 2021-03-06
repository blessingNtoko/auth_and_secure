//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const expressSession = require('express-session');
const passport = require('passport');
const passLocalMong = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = process.env.PORT || 4177;
// const saltRounds = 10;

app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(expressSession({
    secret: 'This is my secret.',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// SECTION: Database & Schema

mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}, () => {
    console.log('Connected to MongoDB succesfully');
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secrets: String
});

userSchema.plugin(passLocalMong);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: 'http://localhost:4177/auth/google/secrets',
        // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    (accessToken, refreshToken, profile, cb) => {
        console.log('User Profile ->', profile);
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:4177/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log('User Profile ->', profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// SECTION: Get routes

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    })
);

app.get('/auth/facebook',
    passport.authenticate('facebook', {
        scope: ['public_profile']
    })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }), (req, res) => {
        res.redirect('/secrets');
    }
);

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }), (req, res) => {
        res.redirect('/secrets');
    }
);

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/secrets', (req, res) => {
    User.find({"secrets": {$ne: null}}, (err, users) => {
        if (!err) {
            res.render('secrets', {
                usersWithSecrets: users
            });
        } else {
            console.log(err);
        }
    });
});

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User is authenticated');
        res.render('submit');
    } else {
        res.redirect('/login');
    }
})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// SECTION: Post routes

app.post('/register', (req, res) => {
    console.log('Request body ->', req.body);
    const userName = req.body.username;
    const passWord = req.body.password;

    User.register({
        username: userName,
    }, passWord, (err, user) => {
        console.log('User ->', user);
        if (!err) {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        } else {
            console.log('Register Error ->', err);
            res.redirect('/register');
        }
    });

});

app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (!err) {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            })
        } else {
            console.log('Login error ->', err);
        }
    })
});

app.post('/submit', (req, res) => {
    const submittedSecret = req.body.secret;

    console.log('Current User ->', req.user);
    User.findOne({_id: req.user._id}, (err, user) => {
        console.log('Data ->', user);
        if (!err) {
            if (user) {
                user.secrets = submittedSecret;
                user.save(() => {
                    res.redirect('/secrets');
                })
            } else {
                console.log(err);
            }
        }
    });
});

// SECTION: Listening
app.listen(port, () => {
    console.log('Server started successfully');
});










// app.post('/register', (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;

//     bcrypt.hash(password, saltRounds, (err, hash) => {
//         User.findOne({
//             email: username
//         }, (err, result) => {
//             if (!err) {
//                 if (result) {
//                     res.send('Email already exists');
//                 } else {
//                     const newUser = new User({
//                         email: username,
//                         password: hash
//                     });

//                     newUser.save(err => {
//                         if (!err) {
//                             console.log('User registered successfully');
//                             res.render('secrets');
//                         } else {
//                             console.log(err);
//                         }
//                     });
//                 }
//             } else {
//                 console.log('Error in register route ->', err);
//             }
//         });
//     });

// });

// app.post('/login', (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;

//     User.findOne({
//         email: username
//     }, (err, data) => {
//         if (!err) {
//             if (data) {
//                 bcrypt.compare(password, data.password, (err, result) => {
//                     if (result) {
//                         res.render('secrets');
//                     } else {
//                         res.send('Password entered is incorrect, please try again');
//                     }
//                 });
//             } else {
//                 console.log('User not found');
//             }
//         } else {
//             res.send(err);
//         }
//     });
// });