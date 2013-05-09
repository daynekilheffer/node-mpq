var fs = require('fs');
var util = require('util');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

var read = require('./util/fs').read;
var packer = require('./pack');
var tables = require('./tables');
var files = require('./files');

function FileParser(filename) {
	this.filename = filename;
	EventEmitter2.call(this);
}

util.inherits(FileParser, EventEmitter2);

FileParser.prototype.parse = function() {

	var self = this;

	fs.open(self.filename, 'r', function(err, fd) {
		if (err) {
			return self.emit('error.fileopen', err);
		}
		self.fd = fd;
		read(fd, {
			position: 0,
			length: 4
		},
		function(err, bytes, buffer) {
			if (err) {
				return self.emit('error.magic.read', err);
			}
			self.emit('magic', buffer);
		});
	});
};

FileParser.prototype._parseMagic = function(context) {
	var self = this;
	var magic = context.toString();
	if (magic === 'MPQ\x1a') {
		self.emit('error.magic', 'MPQ\x1a is not yet implemented');
	} else if (magic === 'MPQ\x1b') {
		self._parseMPQbMagic(context);
	}
};

FileParser.prototype._parseMPQbMagic = function() {
	var self = this;
	read(self.fd, {
		position: 0,
		length: packer.size(packer.FORMAT.USER_DATA_HEADER)
	},
	function(err, bytes, buffer) {
		if (err) {
			return self.emit('error.userheader.read', err);
		}
		var userDataHeaderUnpacked = packer.unpack(buffer, packer.FORMAT.USER_DATA_HEADER);
		var userDataHeader = {
			magic: userDataHeaderUnpacked[0],
			size: userDataHeaderUnpacked[1],
			headerOffset: userDataHeaderUnpacked[2],
			headerSize: userDataHeaderUnpacked[3]
		};
		self.userDataHeader = userDataHeader;
		self.emit('userHeader', self.userDataHeader);
	});
};

FileParser.prototype._parseFileHeader = function() {
	var self = this;
	var offset = 0;
	if (self.userDataHeader) {
		offset = self.userDataHeader.headerOffset;
	}
	read(self.fd, {
		position: offset,
		length: packer.size(packer.FORMAT.FILE_HEADER)
	},
	function(err, bytes, buffer) {
		if (err) {
			return self.emit('error.fileheader.read', err);
		}
		var fileHeaderUnpacked = packer.unpack(buffer, packer.FORMAT.FILE_HEADER);
		var fileHeader = {
			magic: fileHeaderUnpacked[0],
			size: fileHeaderUnpacked[1],
			archivedSize: fileHeaderUnpacked[2],
			formatVersion: fileHeaderUnpacked[3],
			sectorSizeShift: fileHeaderUnpacked[4],
			hashTable: {
				offset: fileHeaderUnpacked[5],
				entryCount: fileHeaderUnpacked[7]
			},
			blockTable: {
				offset: fileHeaderUnpacked[6],
				entryCount: fileHeaderUnpacked[8]
			}
		};
		if (self.userDataHeader) {
			fileHeader.userHeader = self.userDataHeader;
			fileHeader.offset = self.userDataHeader.headerOffset;
		}
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
		if (err) {
			return self.emit('error.userdata.read', err);
		}
		self.userDataHeader.content = buffer;
		self.emit('userData', self.userDataHeader.content);
	});
};

FileParser.prototype._parseHashTable = function() {
	var self = this;
	this._parseTable('hash', function(returnData) {
		var hashTable = [];
		for (var i in returnData) {
			hashTable.push({
				hashA: returnData[i][0],
				hashB: returnData[i][1],
				locale: returnData[i][2],
				platform: returnData[i][3],
				blockTableIndex: returnData[i][4]
			});
		}
		self.hashTable = hashTable;
		self.emit('hashTable', self.hashTable);
	});
};

FileParser.prototype._parseBlockTable = function() {
	var self = this;
	this._parseTable('block', function(returnData) {
		var blockTable = [];
		for (var i in returnData) {
			blockTable.push({
				offset: returnData[i][0],
				archivedSize: returnData[i][1],
				size: returnData[i][2],
				flags: returnData[i][3]
			});
		}
		self.blockTable = blockTable;
		self.emit('blockTable', self.blockTable);
	});
};

FileParser.prototype._parseTable = function(tableName, callback) {
	var self = this;
	tables.readTable(self.fd, tableName, self.fileHeader, function(err, returnTable) {
		if (err) {
			return self.emit('error.table.read', err);
		}
		callback(returnTable);
	});
};

FileParser.prototype._parseFiles = function() {
	var self = this;
	if (self.hashTable && self.blockTable) {
		files.readFile(self.fd, self.hashTable, self.blockTable, self.fileHeader, '(listfile)', function(err, filesBuffer) {
			if (err) {
				return self.emit('error.files.read', err);
			}
			self.files = filesBuffer.toString().split('\r\n');
			self.emit('list files', self.files);
		});
	}
};

FileParser.prototype.extract = function() {
	var self = this;
	fs.mkdir('tmp', function(err) {
		for (var i in self.files) {
			if (self.files[i] !== '') {
				var fullpath = 'tmp/' + self.files[i];
				(function() {
					var targetFile = fullpath;
					files.readFile(self.fd, self.hashTable, self.blockTable, self.fileHeader, self.files[i], function(err, contents) {
						if (err) {
							return self.emit('error.files.read', err);
						}
						fs.writeFile(targetFile, contents, function(err) {
							if (err) {
								return self.emit('error.write', err);
							}
							self.emit('file.' + self.files[i], targetFile);
						});
					});
				})();
			}
		}
	});
};

module.exports = {
	FileParser: FileParser
};

