/**
 * Created by Iaroslav Zhbankov on 09.01.2017.
 */
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var shortid = require('shortid');
var bodyParser = require('body-parser');
//var url = 'mongodb://localhost:27017/pinterest_clone';
var url = 'mongodb://yzhbankov:password1360@ds111489.mlab.com:11489/heroku_j0g6h3j6';
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
        //callbackURL: "http://localhost:3000/auth/twitter/callback"
        callbackURL: "https://pinterestcln.herokuapp.com/auth/twitter/callback"
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

    MongoClient.connect(url, function (err, db) {
        var resent = db.collection('pictures').find({}, {
            "id": true,
            'username': true,
            "pic_url": true,
            'description': true,
            "profile_img": true,
            "likes": true
        }).toArray(function (err, result) {
            if (result.length < 1) {
                res.render('allpics.jade', {"username": username, "profile_img": profile_img, "pics_url": []});
            } else {
                var users = [];
                var ids = [];
                var pics_url = [];
                var descriptions = [];
                var profiles = [];
                var likes = [];
                for (var i = 0; i < result.length; i++) {
                    users.push(result[i].username);
                    ids.push(result[i].id);
                    pics_url.push(result[i].pic_url);
                    descriptions.push(result[i].description);
                    profiles.push(result[i].profile_img);
                    likes.push(result[i].likes.length);
                }
                res.render('allpics.jade', {
                    "ids": ids,
                    "profile_img": profile_img,
                    "username": username,
                    "users": users,
                    "pics_url": pics_url,
                    "descriptions": descriptions,
                    "profiles": profiles,
                    "likes": likes
                });
            }
        });
        db.close();
    });

    if (req.session.passport) {
        var username = req.session.passport.user.username;
        var profile_img = req.session.passport.user._json.profile_image_url;
        MongoClient.connect(url, function (err, db) {
            db.collection('users').findOne({"username": username}, function (err, item) {
                if (item) {
                    db.close();
                } else {
                    db.collection('users').insertOne({
                        "username": username,
                        "profile_img": profile_img
                    }, function (err, result) {
                        if (!err) {
                        }
                    });
                    db.close();
                }
            });
        });
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
                    "profile_img": profile_img,
                    "likes": []
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

app.get('/mypics', function (req, res) {
    if (!req.session.passport) {
        console.log("user is not authorized");
        res.redirect('/');
    } else {
        MongoClient.connect(url, function (err, db) {
            var username = req.session.passport.user.username;
            var profile_img = req.session.passport.user._json.profile_image_url;
            var resent = db.collection('pictures').find({"username": username}, {
                "id": true,
                'username': true,
                "pic_url": true,
                'description': true,
                "profile_img": true,
                "likes": true
            }).toArray(function (err, result) {
                if (result.length < 1) {
                    res.render('mypics.jade', {"profile_img": profile_img, "pics_url": []});
                } else {
                    var users = [];
                    var likes = [];
                    var ids = [];
                    var pics_url = [];
                    var descriptions = [];
                    var profiles = [];
                    for (var i = 0; i < result.length; i++) {
                        ids.push(result[i].id);
                        users.push(result[i].username);
                        pics_url.push(result[i].pic_url);
                        descriptions.push(result[i].description);
                        profiles.push(result[i].profile_img);
                        likes.push(result[i].likes.length);
                    }
                    res.render('mypics.jade', {
                        "profile_img": profile_img,
                        "username": username,
                        "users": users,
                        "pics_url": pics_url,
                        "descriptions": descriptions,
                        "profiles": profiles,
                        "ids": ids,
                        "likes": likes
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
        var id = req.params.id;
        MongoClient.connect(url, function (err, db) {
            db.collection('pictures').remove({"id": id});
            db.close();
            res.redirect('/mypics');

        });
    }
});

app.get('/like/:id', function (req, res) {
    if (!req.session.passport) {
        console.log("user is not authorized");
        res.send('not authorised');
    } else {
        var username = req.session.passport.user.username;
        var id = req.params.id;
        MongoClient.connect(url, function (err, db) {
            db.collection('pictures').findOne({"id": id}, function (err, item) {
                if (item) {
                    console.log(item.likes);
                    var newlikes = item.likes;
                    if (newlikes.indexOf(username) == -1) {
                        newlikes.push(username);
                    } else {
                        newlikes.splice(newlikes.indexOf(username), 1);
                    }
                    db.collection('pictures').update({id: id}, {$set: {likes: newlikes}}, function (err, doc) {
                        db.close();
                    });
                    res.send({"likes": newlikes.length});
                }
            });

        })
    }
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    console.log('you are logout');
    res.redirect('/');
});
app.listen(process.env.PORT || 3000, function () {
    console.log('Listening port 3000');
});