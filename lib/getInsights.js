var watson = require('watson-developer-cloud');
var insights = watson.personality_insights({
	username: process.env.PI_USERNAME,
	password: process.env.PI_PASSWORD,
	version: 'v2'
});

function getInsights(text, callback) {
	insights.profile({
		text: text
	},
	function (err, response) {
		if (err) {
			console.log('error:', err);
		}

		callback(err, response);
	});
}

module.exports = getInsights;
