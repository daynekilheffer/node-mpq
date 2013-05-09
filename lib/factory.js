var FileParser = require('./parser').FileParser;

function createParser(filename) {
	var parser = new FileParser(filename);
	parser.on('magic', parser._parseMagic);
	parser.on('userHeader', parser._parseUserData);
	parser.on('userHeader', parser._parseFileHeader);
	parser.on('fileHeader', parser._parseHashTable);
	parser.on('fileHeader', parser._parseBlockTable);
	parser.on('hashTable', parser._parseFiles);
	parser.on('blockTable', parser._parseFiles);
	//parser.on('list files', parser.extract);
	return parser;
}

function applyConfig(parser, config) {
	if (!config) {
        return;
    }
	parser.debug = config.debug || false;
}

var FileParserFactory = {
	createParser: function(filename, config) {
		var parser = createParser(filename);
		applyConfig(parser, config);
		return new(function() {
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

