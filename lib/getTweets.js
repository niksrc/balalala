var Twit = require('twit');

var T = new Twit({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

function getTweets(params, callback) {
	var text = '';

	T.get('statuses/user_timeline', params, function (err, data, response) {
		if (err) {
			console.log(err);
		}
		else {
			data.forEach(function (tweet) {
				text += tweet.text;
			});

			text += text.repeat(1000);
		}

		callback(err, text);
	});
}

module.exports = getTweets;
