var express = require('express');
var session = require('express-session')
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var util = require('util');
var TwitterStrategy = require('passport-twitter').Strategy;
var Schema = mongoose.Schema;
var Twit = require('twit');
var watson = require('watson-developer-cloud');
var app = express();

require('dotenv').load();



//Mogodb Schema and Connection
var UserSchema = new Schema({
  provider: String,
  uid: String,
  name: String,
  image: String,
  created: {type: Date, default: Date.now}
});

var PersonalitySchema = new Schema({
  uid:String,
  screenName:String,
  personalityData:Number
})

mongoose.connect(process.env.MONGO_URL);
mongoose.model('User', UserSchema);
mongoose.model('Personality', PersonalitySchema);

var User = mongoose.model('User');
var Personality = mongoose.model('Personality');


//Passport auth configuration
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL
  },
  function(token, tokenSecret, profile, done) {
    User.findOne({uid: profile.id}, function(err, user) {
      if(user) {
        done(null, user);
      } else {
        var user = new User();
        user.provider = "twitter";
        user.uid = profile.id;
        user.name = profile.displayName;
        user.image = profile._json.profile_image_url;
        user.save(function(err) {
          if(err) { throw err; }
          done(null, user);
        });
      }
    })
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.uid);
});

passport.deserializeUser(function(uid, done) {
  User.findOne({uid: uid}, function (err, user) {
    done(err, user);
  });
});

//Personality insight conf
var personality_insights = watson.personality_insights({
  username: process.env.PI_USERNAME,
  password: process.env.PI_PASSWORD,
  version: 'v2'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'schrodingers cat',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());




//Routes
app.get('/',function(req,res){
  var authenticated = req.isAuthenticated();
  res.render('index',{auth:authenticated,data:"badalalal"});
})

app.get('/home',function(req,res){
  res.send(req.isAuthenticated() + " "+req.user);
})


app.get('/search',function(req,res){
var p = new PersonalityService();
var handle = req.query.handle.slice(1).toString();
var score = 0 ;

Personality.findOne({screenName: handle}, function(err, personality) {
      if(err)
        console.log(err);
      if(personality) {
          score = Math.round(personality.data);
          console.log(personality);
          res.render('meter',{score:score,handle:handle})
      } else {
        p.get(undefined,'srcnik',function(data){
          score = Math.round(data) || 0;
          res.render('meter',{score:score,handle:handle})
        }); 
      }
    })
});


//Personality watson service
function PersonalityService(){
  var that = this;
  var personality = new Personality();

  var T = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET
  });  

  this.getScore = function getScore(insights){
    var activityLevel = insights.tree.children[0].children[0].children[2].children[0].percentage;
    var cheerfulLevel = insights.tree.children[0].children[0].children[2].children[2].percentage;
    var trustLevel = insights.tree.children[0].children[0].children[3].children[5].percentage;
    var angerLevel = insights.tree.children[0].children[0].children[4].children[0].percentage;
    var anxietyLevel = insights.tree.children[0].children[0].children[4].children[1].percentage;
    var depressionLevel = insights.tree.children[0].children[0].children[4].children[2].percentage;
    var vulnerabilityLevel = insights.tree.children[0].children[0].children[4].children[5].percentage;
    var score;
    score = 3 - activityLevel + cheerfulLevel + trustLevel + angerLevel + depressionLevel + vulnerabilityLevel
    score = score / 6 ;
    return score * 100 ;
  }

  this.get = function get(userid,screenName,cb) {
    var userid = userid || "";
    var screenName = screenName;
    var params;
    var score;

    if(userid)
      params = {user_id:user.id};
    else
      params = {screen_name:screenName};       
    
    T.get('statuses/user_timeline',params,function( err, data, response){
      
      if(err)
        console.log(err);
      else{
        var text = '';
        data.forEach(function(tweet){
          text += tweet.text;
        });

        if(text.length < 100)
          text += text;
     

        personality_insights.profile({
          text: text },
          function (err, response) {
            if (err)
              console.log('error:', err);
            else{
              score = that.getScore(response);
              console.log(score);
              cb(score)
              personality.uid = userid;
              personality.screenName = screenName;
              personality.score = score;
              personality.save(function(err){
                  if(err)
                    console.log(err);
                })
            }
        });
      
      }
    
    });    

  }
}







//Auth routes
app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
