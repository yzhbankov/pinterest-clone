/**
 * Created by Iaroslav Zhbankov on 09.01.2017.
 */
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/pinterest_clone';
var session = require('express-session');
var path = require('path');

var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

/*var oauth = new OAuth(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    "AHI1ElA7WMFzF4QhzZcxlMdVP",
    "EcxtYxF8ochjraTnvrLpGYujQHMpERDLHcr4bipB9WVwrq8e5h",
    "1.0",
    "https://pinterest-cln.herokuapp.com/auth/twitter/callback",
    "HMAC-SHA1"
);*/

app.use(express.static('public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(session({secret: "secretword", resave: false, saveUninitialized: true}));

app.get('/', function (req, res) {
    if (req.user) {
        res.render('layout.jade', {"username": req.user.username});
    } else {
        res.render('layout.jade', {});
    }
});

passport.use(new TwitterStrategy({
        consumerKey: 'AHI1ElA7WMFzF4QhzZcxlMdVP',
        consumerSecret: 'EcxtYxF8ochjraTnvrLpGYujQHMpERDLHcr4bipB9WVwrq8e5h',
        callbackURL: "https://pinterest-cln.herokuapp.com/auth/twitter/callback"
    },
    function (token, tokenSecret, profile, done) {
        User.findOrCreate({twitterId: profile.id}, function (error, user) {
            return done(error, user);
        })
    }
));

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { successRedirect: '/',
        failureRedirect: '/login' }));

app.listen(process.env.PORT || 3000, function () {
    console.log('Listening port 3000');
});