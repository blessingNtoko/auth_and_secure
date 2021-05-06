//jshint esversion:6
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
const port = process.env.PORT || 4177;

app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// SECTION: Database & Schema

mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
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

const secret = 'Thisisourlittlesecretshhh';
userSchema.plugin(encrypt, {
    secret: secret,
    encryptedFields: ['password']
});

const User = mongoose.model('User', userSchema);

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
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username
    }, (err, result) => {
        if (!err) {
            if (result) {
                res.send('Email already exists');
            } else {
                const newUser = new User({
                    email: username,
                    password: password
                });

                newUser.save(err => {
                    if (!err) {
                        console.log('User registered successfully');
                        res.render('secrets');
                    } else {
                        console.log(err);
                    }
                });
            }
        } else {
            console.log('Error in register route ->', err);
        }
    })
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username
    }, (err, result) => {
        if (!err) {
            if (result) {
                if (password === result.password) {
                    res.render('secrets');
                } else {
                    res.send('Password entered is incorrect, please try again')
                }
            } else {
                console.log('User not found');
            }
        } else {
            res.send(err);
        }
    });
});

// SECTION: Listening
app.listen(port, () => {
    console.log('Server started successfully');
});