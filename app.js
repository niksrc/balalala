var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
require('dotenv').load();
var User = require('./models/user');
var index = require('./routes/index');
var search = require('./routes/search');
var app = express();

mongoose.connect(process.env.MONGO_URL);

// assport auth configuration
passport.use(new TwitterStrategy({
	consumerKey: process.env.TWITTER_CONSUMER_KEY,
	consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
	callbackURL: process.env.TWITTER_CALLBACK_URL
  },
  function (token, tokenSecret, profile, done) {
	User.findOne({uid: profile.id}, function (err, user) {
		if (err) {
			console.log(err);
		}

		if (user) {
			done(null, user);
		} else {
			var newUser = new User();
			newUser.provider = 'twitter';
			newUser.uid = profile.id;
			newUser.name = profile.displayName;
			newUser.image = profile._json.profile_image_url;
			newUser.save(function (err) {
				if (err) {
					throw err;
				}
				done(null, newUser);
			});
		}
	});
  }
));

passport.serializeUser(function (user, done) {
	done(null, user.uid);
});

passport.deserializeUser(function (uid, done) {
	User.findOne({uid: uid}, function (err, user) {
		done(err, user);
	});
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(favicon(path.join(__dirname, '/public/favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: 'schrodingers cat',
	resave: false,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use('/', index);
app.use('/search', search);

// auth routes
app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', passport.authenticate('twitter', {failureRedirect: '/login'
}),
function (req, res) {
	res.redirect('/');
});

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;
