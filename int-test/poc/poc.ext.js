var fs = require('fs');
var jspack = require('jspack').jspack;
var bigint = require('bigint');

var PACK_FORMAT = {
	FILE_HEADER: '<4s2I2H4I',
	FILE_HEADER_EXT: '2I2h',
	USER_DATA_HEADER: '<4s3I',
	HASH_TABLE: '2I2HI',
	BLOCK_TABLE: '4I'
};

var encryptionTable = buildEncryptionTable();

fs.open('../test/replays/the.boneyard.SC2Replay', 'r', function(err, fd) {
	read(fd, {
		position: 0,
		length: 4
	},
	function(err, bytes, buffer) {
		read(fd, {
			position: 0,
			length: 16
		},
		/* user header */
		function(err, bytes, buffer) {
			var userDataHeaderUnpacked = unpack(buffer, PACK_FORMAT.USER_DATA_HEADER);
			userDataHeader = {
				magic: userDataHeaderUnpacked[0],
				size: userDataHeaderUnpacked[1],
				headerOffset: userDataHeaderUnpacked[2],
				headerSize: userDataHeaderUnpacked[3]
			};
			/* skip this - I don't need content yet */
			read(fd, {
				position: 0,
				length: userDataHeader.size
			},
			function(err, bytes, buffer) {
				userDataHeader.contentBuffer = buffer;

				/* reading file header */
				var newPos = userDataHeader.headerOffset;
				console.log(newPos+44);
				//1024+32 is file header (v1)
				//1056+12 is file header ext (v2) <6I or <3q
				//1068+24 is HET and BET (v3) <11I or <4qI
				read(fd, {
					position: newPos+68,
					length: 84
				},
				function(err, bytes, buffer) {
					console.log(buffer);
					var unpacked = unpack(buffer, '<11I');
					console.log(unpacked);
				});

				read(fd, {
					position: newPos,
					length: 32
				},
				function(err, bytes, buffer) {
					var fileHeaderUnpacked = unpack(buffer, PACK_FORMAT.FILE_HEADER);
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
				});
			});
		});
	});

});

function read(fd, config, callback) {
	var buffer = new Buffer(config.length);
	fs.read(fd, buffer, config.offset || 0, config.length, config.position, function(e, b, d) {
		callback(e, b, d);
	});
};

function unpack(buffer, format) {
	return jspack.Unpack(format, buffer, 0);
};

function readHashTable(fd, header) {

	var tableOffset = header.hashTable.offset + header.userHeader.headerOffset
	var tableEntryCount = header.hashTable.entryCount;

	var key = _hash('(hash table)', 'TABLE');

	read(fd, {
		position: tableOffset,
		length: tableEntryCount * 16
	},
	function(err, bytes, rawData) {
		var data = _decrypt2(rawData, key);
		console.log(data.toString());
		var ret = [];
		for (var i = 0; i < tableEntryCount; i++) {
			var buf = new Buffer(16);
			data.copy(buf, 0, i * 16, i * 16 + 16);
			ret[i] = unpack(buf, PACK_FORMAT.HASH_TABLE);
			console.log(ret[i]);
		}
		console.log(ret);
	});

};

function readBlockTable(fd, header) {

};

var HASH_TYPES = {
	'TABLE_OFFSET': 0,
	'HASH_A': 1,
	'HASH_B': 2,
	'TABLE': 3
};

function _hash(string, hashType) {

	var seed1 = 0x7FED7FED;
	var seed2 = 0xEEEEEEEE;

	string = string.toUpperCase();

	for (var i in string.toUpperCase()) {
		var chr = string.charAt(i);
		if (!isNumeric(chr)) {
			chr = chr.charCodeAt(0);
		}
		console.log(chr);
		var value = encryptionTable[(HASH_TYPES[hashType] << 8) + chr];
		console.log(value);
		seed1 = ToUint32((value ^ (seed1 + seed2)) & 0xFFFFFFFF);
		seed2 = chr + seed1 + seed2 + (seed2 << 5) + 3 & 0xFFFFFFFF
	}

	return seed1;
};

function _decrypt(dataBuffer, key) {
	var seed1 = key;
	var seed2 = 0xEEEEEEEE
	result = new Buffer(dataBuffer.length);
	result.fill(' ');

	var count = 0;

	for (var i = 0; i < dataBuffer.length / 4; i++) {
		seed2 += encryptionTable[0x400 + (seed1 & 0xFF)];
		seed2 &= 0xFFFFFFFF;
		console.log(seed2);
		var buf = new Buffer(4);
		dataBuffer.copy(buf, 0, i * 4, i * 4 + 4);
		value = unpack(buf, "<I")[0];
		console.log(value);
		value = ToUint32((value ^ (seed1 + seed2)) & 0xFFFFFFFF);
		console.log(value);

		seed1 = (((~seed1 << 0x15) + 0x11111111) | (seed1 >> 0x0B));
		console.log(seed1);

		seed1 &= 0xFFFFFFFF;
		seed2 = ToUint32(value + seed2 + (seed2 << 5) + 3 & 0xFFFFFFFF);
		console.log(seed2);

		result.writeUInt32LE(value, count);
		count += 4;
		console.log(result.toString());
	}
	console.log();
	console.log(result.toString());

	return result;

};

function isNumeric(n) {
	return ! isNaN(parseFloat(n)) && isFinite(n);
};

function buildEncryptionTable() {

	var seed = 0x00100001
	var table = {};

	for (var i = 0; i < 256; i++) {
		index = i;
		for (var j = 0; j < 5; j++) {
			seed = (seed * 125 + 3) % 0x2AAAAB;
			var temp1 = ToUint32((seed & 0xFFFF) << 0x10);

			seed = (seed * 125 + 3) % 0x2AAAAB;
			var temp2 = (seed & 0xFFFF);

			table[index] = ToUint32(temp1 | temp2);
			index += 0x100;
		}
	}

	return table;
};

// I'm sure there is a better way - I just don't know this bit stuff well
function ToUint32(x) {
	x = Number(x);
	a = x < 0 ? Math.ceil(x) : Math.floor(x);
	b = Math.pow(2, 32);
	return a - Math.floor(a / b) * b;
};

function _decrypt2(dataBuffer, key) {
	console.log(key);
	var seed1 = bigint(key);
	var seed2 = bigint(0xEEEEEEEE);
	result = new Buffer(dataBuffer.length);
	result.fill(' ');

	var count = 0;

	for (var i = 0; i < dataBuffer.length / 4; i++) {
		var encryptTableValue = bigint(encryptionTable[0x400 + (seed1 & 0xFF)]);
		seed2 = seed2.add(encryptTableValue)
		seed2 = seed2.and(0xFFFFFFFF);

		var buf = new Buffer(4);
		dataBuffer.copy(buf, 0, i * 4, i * 4 + 4);
		value = bigint(unpack(buf, "<I")[0]);
		value = (value.xor(seed1.add(seed2))).and(0xFFFFFFFF);

		seed1 = (((seed1.xor( - 1).shiftLeft(0x15)).add(0x11111111)).or(seed1.shiftRight(0x0B)));

		seed1 = seed1.and(0xFFFFFFFF);
		seed2 = value.add(seed2).add(seed2.shiftLeft(5)).add(3).and(0xFFFFFFFF);

		result.writeUInt32LE(value.toNumber(), count);
		count += 4;
	}

	return result;

};

