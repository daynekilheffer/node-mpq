var factory = require('../lib').FileParserFactory;


var parser = factory.createParser('replays/the.boneyard.SC2Replay');

parser.on('list files', parser.extract);
parser.parse();
