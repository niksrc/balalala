function getScore(insights) {
	var levels = {};
	var node = insights.tree.children[0].children[0];
	var score;

	levels.activity = node.children[2].children[0].percentage;
	levels.cheerful = node.children[2].children[2].percentage;
	levels.trust = node.children[3].children[5].percentage;
	levels.anger = node.children[4].children[0].percentage;
	levels.anxiety = node.children[4].children[1].percentage;
	levels.depression = node.children[4].children[2].percentage;
	levels.vulnerability = node.children[4].children[5].percentage;

	score = 3 - levels.activity + levels.cheerful + levels.trust + levels.anger + levels.depression + levels.vulnerability;

	return (score / 6) * 100;
}

module.exports = getScore;
