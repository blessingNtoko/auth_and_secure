//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const expressSession = require('express-session');
const passport = require('passport');
const passLocalMong = require('passport-local-mongoose');

const app = express();
const port = process.env.PORT || 4177;
const saltRounds = 10;

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
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

userSchema.plugin(passLocalMong);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// SECTION: Get routes

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// SECTION: Post routes

app.post('/register', (req, res) => {


});

app.post('/login', (req, res) => {

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