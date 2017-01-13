/**
 * Created by Iaroslav Zhbankov on 09.01.2017.
 */
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var shortid = require('shortid');
var bodyParser = require('body-parser');
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
app.use('/allpics', express.static('public'));
app.use('/mypics', express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: false}));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(session({secret: "secretword", resave: false, saveUninitialized: true}));

app.get('/', function (req, res) {
    if (req.session.passport) {
        var username = req.session.passport.user.username;
        var profile_img = req.session.passport.user._json.profile_image_url;

        MongoClient.connect(url, function (err, db) {
            db.collection('users').findOne({"username": username}, function (err, item) {
                if (item) {
                    db.close();
                    console.log("user already exist");
                } else {
                    db.collection('users').insertOne({
                        "username": username,
                        "profile_img": profile_img
                    }, function (err, result) {
                        if (!err) {
                            console.log("user added successfuly");
                        }
                    });
                    db.close();
                }
            });
        });

        res.render('index.jade', {"username": username});
    } else {
        res.render('index.jade', {});
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

app.post('/add', function (req, res) {
    var pic_url = req.body.pic_url;
    var description = req.body.description;
    var username = req.session.passport.user.username;
    var profile_img = req.session.passport.user._json.profile_image_url;
    console.log(username);
    MongoClient.connect(url, function (err, db) {
        db.collection('pictures').findOne({"username": username, "pic_url": pic_url}, function (err, item) {
            if (item) {
                db.close();
                console.log("picture already exist");
            } else {
                db.collection('pictures').insertOne({
                    "id": shortid.generate(),
                    "username": username,
                    "pic_url": pic_url,
                    "description": description,
                    "profile_img": profile_img
                }, function (err, result) {
                    if (!err) {
                        console.log("picture added successfuly");
                    }
                });
                db.close();
            }
        });
    });
    res.redirect('/');
});

app.get('/allpics', function (req, res) {
    if (!req.session.passport) {
        console.log("user is not authorized");
        res.redirect('/');
    } else {
        var username = req.session.passport.user.username;
        MongoClient.connect(url, function (err, db) {
            var resent = db.collection('pictures').find({}, {
                'username': true,
                "pic_url": true,
                'description': true,
                "profile_img": true
            }).toArray(function (err, result) {
                if (result.length < 1) {
                    console.log('no pictures found');
                    res.render('allpics.jade', {"username":username,"pics_url": []});
                } else {
                    console.log('pictures found');
                    var users = [];
                    var pics_url = [];
                    var descriptions = [];
                    var profiles = [];
                    for (var i = 0; i < result.length; i++) {
                        users.push(result[i].username);
                        pics_url.push(result[i].pic_url);
                        descriptions.push(result[i].description);
                        profiles.push(result[i].profile_img);
                    }
                    res.render('allpics.jade', {
                        "username": username,
                        "users": users,
                        "pics_url": pics_url,
                        "descriptions": descriptions,
                        "profiles": profiles
                    });
                }
            });
            db.close();
        });
    }
});

app.get('/mypics', function (req, res) {
    if (!req.session.passport) {
        console.log("user is not authorized");
        res.redirect('/');
    } else {
        MongoClient.connect(url, function (err, db) {
            var username = req.session.passport.user.username;
            var resent = db.collection('pictures').find({"username": username}, {
                "id": true,
                'username': true,
                "pic_url": true,
                'description': true,
                "profile_img": true
            }).toArray(function (err, result) {
                if (result.length < 1) {
                    res.render('mypics.jade', {"username":username,"pics_url": []});
                } else {
                    var users = [];
                    var id = [];
                    var pics_url = [];
                    var descriptions = [];
                    var profiles = [];
                    for (var i = 0; i < result.length; i++) {
                        id.push(result[i].id);
                        users.push(result[i].username);
                        pics_url.push(result[i].pic_url);
                        descriptions.push(result[i].description);
                        profiles.push(result[i].profile_img);
                    }
                    res.render('mypics.jade', {
                        "username": username,
                        "users": users,
                        "pics_url": pics_url,
                        "descriptions": descriptions,
                        "profiles": profiles,
                        "id": id
                    });
                }
            });
            db.close();
        });
    }
});

app.get('/delete/:id', function (req, res) {
    if (!req.session.passport) {
        console.log("user is not authorized");
        res.redirect('/');
    } else {
        var username = req.params.username;
        var id = req.params.id;
        MongoClient.connect(url, function (err, db) {
            db.collection('pictures').remove({"id":id});
            db.close();
            res.redirect('/mypics');

        });
    }
})
app.get('/logout', function (req, res) {
    req.session.destroy();
    console.log('you are logout');
    res.redirect('/');
});
app.listen(process.env.PORT || 3000, function () {
    console.log('Listening port 3000');
});