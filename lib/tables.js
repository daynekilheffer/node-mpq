var fs = require('fs');
var packer = require('./pack');
var encryption = require('./encryption');
var read = require('./util/fs').read

function readTable(fd, tableType, header, cb) {

	var format = null;
	if (tableType === 'hash') {
		format = packer.FORMAT.HASH_TABLE;
		tableOffset = header.hashTable.offset + header.userHeader.headerOffset
		tableEntryCount = header.hashTable.entryCount;
	} else if (tableType === 'block') {
		format = packer.FORMAT.BLOCK_TABLE;
		tableOffset = header.blockTable.offset + header.userHeader.headerOffset
		tableEntryCount = header.hashTable.entryCount;
	}

	var hashId = '(' + tableType + ' table)';
	var key = encryption.hash(hashId, 'TABLE');

	read(fd, {
		position: tableOffset,
		length: tableEntryCount * 16
	},
	function(err, bytes, rawData) {
		if (err) cb(err);
		var data = encryption.decrypt(rawData, key);
		var ret = [];
		for (var i = 0; i < tableEntryCount; i++) {
			//TODO I think unpack will work with the full buffer as long as I tell it an "offset".  In thise case, i*16
			var buf = new Buffer(16);
			data.copy(buf, 0, i * 16, i * 16 + 16);
			ret[i] = packer.unpack(buf, format);
		}
		process.nextTick(function() {
			cb(null, ret)
		});
	});

};

module.exports = {
	readTable: readTable
}

