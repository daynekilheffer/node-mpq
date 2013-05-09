var FileParser = require('./parser').FileParser;

function createParser(filename) {
	var parser = new FileParser(filename);
	parser.on('magic', parser.parseMagic);
	parser.on('userHeader', parser.parseUserData);
	parser.on('userHeader', parser.parseFileHeader);
	parser.on('fileHeader', parser.parseHashTable);
	parser.on('fileHeader', parser.parseBlockTable);
	parser.on('hashTable', parser.parseFiles);
	parser.on('blockTable', parser.parseFiles);
	return parser;
}

function configure(parser, config) {
	if (!config) {
		return;
	}
	parser.debug = config.debug || false;
	if (parser.debug) {
		console.info('debugging enabled');
		parser.on('*', function() {
			console.info('event: ' + this.event);
			console.info(arguments);
		});
	}
}

var FileParserFactory = {
	createParser: function(filename, config) {
		var parser = createParser(filename);
		configure(parser, config);
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

