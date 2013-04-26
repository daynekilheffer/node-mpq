var factory = require('../lib').FileParserFactory;


var parser = factory.createParser('replays/the.boneyard.SC2Replay');

parser.parse(function(replay){
    console.log(replay);
});
