var factory = require('../lib').FileParserFactory;
var eyes = require('eyes');


var parser = factory.createParser('replays/the.boneyard.SC2Replay');

parser.on('userHeader', function(userHeader) {
    eyes.inspect(userHeader, 'header'); 
});

parser.parse();

