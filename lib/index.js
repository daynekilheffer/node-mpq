var fs = require('fs');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var read = require('./util/fs').read;
var packer = require('./pack');
var tables = require('./tables');

function FileParser(filename) {
	this.filename = filename;
	EventEmitter.call(this);
};

util.inherits(FileParser, EventEmitter);

FileParser.prototype.parse = function() {

	var self = this;

	fs.open(self.filename, 'r', function(err, fd) {
		if (err) self.emit('error', err);
		self.fd = fd;
		read(fd, {
			position: 0,
			length: 4
		},
		function(err, bytes, buffer) {
			if (err) self.emit('error', err);
			self.emit('magic', buffer);
		});
	});
};

FileParser.prototype._parseMagic = function(context) {
	var magic = context.toString();
	var self = this;
	if (magic === 'MPQ\x1a') {
		self.emit('error', 'MPQ\x1a is not yet implemented');
	} else if (magic === 'MPQ\x1b') {
		self._parseMPQbMagic(context);
	}
};

FileParser.prototype._parseMPQbMagic = function(context) {
	var self = this;
	read(self.fd, {
		position: 0,
		length: 16
	},
	function(err, bytes, buffer) {
		if (err) self.emit('error', err);
		var userDataHeaderUnpacked = packer.unpack(buffer, packer.FORMAT.USER_DATA_HEADER);
		userDataHeader = {
			magic: userDataHeaderUnpacked[0],
			size: userDataHeaderUnpacked[1],
			headerOffset: userDataHeaderUnpacked[2],
			headerSize: userDataHeaderUnpacked[3]
		}
		self.userDataHeader = userDataHeader;
		self.emit('userHeader', userDataHeader);
	});
};

FileParser.prototype._parseFileHeader = function() {
	var self = this;
	var offset = self.userDataHeader.headerOffset;
	read(self.fd, {
		position: offset,
		length: 32
	},
	function(err, bytes, buffer) {
		if (err) self.emit('error', err);
		var fileHeaderUnpacked = packer.unpack(buffer, packer.FORMAT.FILE_HEADER);
		fileHeader = {
			magic: fileHeaderUnpacked[0],
			size: fileHeaderUnpacked[1],
			archiveSize: fileHeaderUnpacked[2],
			formatVersion: fileHeaderUnpacked[3],
			sectorSizeShift: fileHeaderUnpacked[4],
			hashTable: {
				offset: fileHeaderUnpacked[5],
				entryCount: fileHeaderUnpacked[7]
			},
			blockTable: {
				offset: fileHeaderUnpacked[6],
				entryCount: fileHeaderUnpacked[8]
			},
			userHeader: userDataHeader
		};
		self.fileHeader = fileHeader;
		self.emit('fileHeader', fileHeader);
	});
};

FileParser.prototype._parseUserData = function() {
	var self = this;
	read(self.fd, {
		position: 0,
		length: self.userDataHeader.size
	},
	function(err, bytes, buffer) {
		if (err) self.emit('error', err);
		self.userDataHeader.content = buffer;
		self.emit('userData', buffer);
	});
};

FileParser.prototype._parseHashTable = function() {
    this._parseTable('hash', function(returnData) {
    });
};

FileParser.prototype._parseBlockTable = function() {
    this._parseTable('block', function(returnData) {
    });
};

FileParser.prototype._parseTable = function(tableName, callback) {
	var self = this;
	tables.readTable(self.fd, tableName, self.fileHeader, function(err, returnTable) {
		console.log('readTable completed for ' + tableName);
        callback(returnTable);
	});
}


var FileParserFactory = {
	createParser: function(filename) {
		var parser = new FileParser(filename);
		parser.on('magic', parser._parseMagic);
		parser.on('userHeader', parser._parseFileHeader);
		parser.on('userHeader', parser._parseUserData);
		parser.on('fileHeader', parser._parseHashTable);
		parser.on('fileHeader', parser._parseBlockTable);
		return parser;
	}
};

module.exports = {
	FileParserFactory: FileParserFactory
};

