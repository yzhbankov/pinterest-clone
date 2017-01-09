/**
 * Created by Iaroslav Zhbankov on 09.01.2017.
 */
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/pinterest_clone';
var session = require('express-session');
var path = require('path');

app.use(express.static('public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function (req, res) {
    res.render('layout.jade', {});
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Listening port 3000');
});