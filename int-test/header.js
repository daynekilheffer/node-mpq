var factory = require('../lib').FileParserFactory;
var eyes = require('eyes');


var parser = factory.createParser('../test/replays/the.boneyard.SC2Replay');

parser.on('error.*', function(context) {
	console.log(context);
});

parser.on('userHeader', function(userHeader) {
    eyes.inspect(userHeader, 'header'); 
});

parser.parse();

