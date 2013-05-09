var factory = require('../lib').FileParserFactory;
var eyes = require('eyes');


var parser = factory.createParser('../test/replays/the.boneyard.SC2Replay', {debug:true});

parser.on('error.*', function(context) {
	console.log(context);
});

parser.on('userHeader', function(userHeader) {
    eyes.inspect(userHeader, 'user header'); 
});
parser.on('fileHeader', function(fileHeader) {
	eyes.inspect(fileHeader, 'file header');
});

parser.parse();

