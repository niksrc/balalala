var router = require('express').Router();
var PersonalityService = require('../lib/personalityService');
var Personality = require('../models/personality');

router.get('/search', function (req, res) {
	var handle = req.query.handle.slice(1).toString();
	var score = 0;

	Personality.findOne({
		screenName: handle
	},
	function (err, personality) {
		if (err) {
			console.log(err);
		}

		if (personality) {
			score = Math.round(parseInt(personality.data, 10));

			res.render('meter', {
				score: score,
				handle: handle
			});
		} else {
			PersonalityService.fetch(undefined, handle, function (data) {
				score = Math.round(data) || 0;

				res.render('meter', {
					score: score,
					handle: handle
				});
			});
		}
	});
});

module.exports = router;
