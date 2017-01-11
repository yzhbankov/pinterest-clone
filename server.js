/**
 * Created by Iaroslav Zhbankov on 09.01.2017.
 */
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/pinterest_clone';
var session = require('express-session');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new TwitterStrategy({
        consumerKey: 'AHI1ElA7WMFzF4QhzZcxlMdVP',
        consumerSecret: 'EcxtYxF8ochjraTnvrLpGYujQHMpERDLHcr4bipB9WVwrq8e5h',
        callbackURL: "http://localhost:3000/auth/twitter/callback"
    },
    function (token, tokenSecret, profile, done) {
        process.nextTick(function () {
            return done(null, profile);
        });
    }
));

app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(session({secret: "secretword", resave: false, saveUninitialized: true}));

app.get('/', function (req, res) {
    if (req.session.passport) {
        var username = req.session.passport.user.username;
        res.render('layout.jade', {"username": username});
    } else {
        res.render('layout.jade', {});
    }
});

app.get('/auth/twitter', passport.authenticate('twitter', {scope: ['email']}), function (req, res) {
    console.log(req);
});

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/error'
    }));

app.get('/error',
    function () {
        console.log('Something is wrong');
    });

app.get('/logout', function (req, res) {
    req.session.destroy();
    console.log('you are logout');
    res.redirect('/');
});
app.listen(process.env.PORT || 3000, function () {
    console.log('Listening port 3000');
});