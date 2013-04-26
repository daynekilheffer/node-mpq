var packer = require('./pack');
var bigint = require('bigint');

var HASH_TYPES = {
	'TABLE_OFFSET': 0,
	'HASH_A': 1,
	'HASH_B': 2,
	'TABLE': 3
};

function buildEncryptionTable() {

	var seed = 0x00100001
	var table = {};

	for (var i = 0; i < 256; i++) {
		index = i;
		for (var j = 0; j < 5; j++) {
			seed = (seed * 125 + 3) % 0x2AAAAB;
			// TODO: remove ToUint32 in favor of bigint
			var temp1 = ToUint32((seed & 0xFFFF) << 0x10);

			seed = (seed * 125 + 3) % 0x2AAAAB;
			var temp2 = (seed & 0xFFFF);

			// TODO: remove ToUint32 in favor of bigint
			table[index] = ToUint32(temp1 | temp2);
			index += 0x100;
		}
	}

	return table;
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
		var value = encryptionTable[(HASH_TYPES[hashType] << 8) + chr];
		seed1 = ToUint32((value ^ (seed1 + seed2)) & 0xFFFFFFFF);
		seed2 = chr + seed1 + seed2 + (seed2 << 5) + 3 & 0xFFFFFFFF
	}

	return seed1;
};

function isNumeric(n) {
	return ! isNaN(parseFloat(n)) && isFinite(n);
};

// TODO: remove ToUint32 in favor of bigint
// I'm sure there is a better way - I just don't know this bit stuff well
function ToUint32(x) {
	x = Number(x);
	a = x < 0 ? Math.ceil(x) : Math.floor(x);
	b = Math.pow(2, 32);
	return a - Math.floor(a / b) * b;
};

function _decrypt(dataBuffer, key) {
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
		value = bigint(packer.unpack(buf, "<I")[0]);
		value = (value.xor(seed1.add(seed2))).and(0xFFFFFFFF);

		seed1 = (((seed1.xor( - 1).shiftLeft(0x15)).add(0x11111111)).or(seed1.shiftRight(0x0B)));

		seed1 = seed1.and(0xFFFFFFFF);
		seed2 = value.add(seed2).add(seed2.shiftLeft(5)).add(3).and(0xFFFFFFFF);

		result.writeUInt32LE(value.toNumber(), count);
		count += 4;
	}

	return result;

};

var encryptionTable = buildEncryptionTable();

module.exports = {
	HASH_TYPES: HASH_TYPES,
	hash: _hash,
	decrypt: _decrypt
};

