var router = require('express').Router();

router.get('/', function (req, res) {
	var authenticated = req.isAuthenticated();
	res.render('index', {
		auth: authenticated,
		data: 'badalalal'
	});
});

router.get('/home', function (req, res) {
	res.send(req.isAuthenticated() + ' ' + req.user);
});

module.exports = router;
