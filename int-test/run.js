var factory = require('../lib').FileParserFactory;


var parser = factory.createParser('../test/replays/the.boneyard.SC2Replay');

parser.on('list files', parser.extract);
parser.parse();
