var factory = require('../lib').FileParserFactory;

var parser = factory.createParser('../test/replays/the.boneyard.SC2Replay', {
	debug: true
});

parser.on('error.*', function(context) {
	console.log(context);
});

parser.on('list files', parser.extract);

parser.parse();

