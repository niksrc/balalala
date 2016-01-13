var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PersonalitySchema = new Schema({
	uid: String,
	screenName: String,
	data: String
});

var Personality = mongoose.model('Personality', PersonalitySchema);

module.exports = Personality;
