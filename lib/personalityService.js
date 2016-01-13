var Personality = require('../models/personality');
var getScore = require('./getScore');
var getTweets = require('./getTweets');
var getInsights = require('./getInsights');

/*
* Fetch insights, calculate score and save it to database.
**/
function fetchScore(userId, screenName, callback) {
	var userid = userid || '';
	var params;
	var score;

	if (userid) {
		params = {
			user_id: userid
		};
	}
	else {
		params = {
			screen_name: screenName
		};
	}

	getTweets(params, function (err, text) {
		if (err) {
			console.log(err);
		}

		getInsights(text, function (err, response) {
			if (err) {
				console.log(err);
			}

			var personality = new Personality();
			score = getScore(response);
			callback(score);

			personality.uid = userid;
			personality.screenName = screenName;
			personality.data = String(score);
			personality.save(function (err) {
				if (err) {
					console.log(err);
				}
			});
		});
	});
}

module.exports = {
	fetch: fetchScore
};
