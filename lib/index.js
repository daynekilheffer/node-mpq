var FileParser = require('./parser').FileParser;

var FileParserFactory = {
	createParser: function(filename) {
		var parser = new FileParser(filename);
		parser.on('magic', parser._parseMagic);
		parser.on('userHeader', parser._parseFileHeader);
		parser.on('userHeader', parser._parseUserData);
		parser.on('fileHeader', parser._parseHashTable);
		parser.on('fileHeader', parser._parseBlockTable);
		parser.on('hashTable', parser._parseFiles);
		parser.on('blockTable', parser._parseFiles);
		//parser.on('list files', parser.extract);
		parser.on('error', function(err) {
			console.log('error : ' + err);
		});
		return new (function() {
            this.parse = function() {
                parser.parse()
            };
            this.extract = function() {
                parser.extract();
            };
            this.on = function(name, callback) {
                parser.on(name, callback);
            };
        })();
	}
};

module.exports = {
	FileParserFactory: FileParserFactory
};

