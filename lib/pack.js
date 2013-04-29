var jspack = require('jspack').jspack;

var PACK_FORMATS = {
	FILE_HEADER: '<4s2I2H4I',
	FILE_HEADER_EXT: 'q2h',
	USER_DATA_HEADER: '<4s3I',
	HASH_TABLE: '2I2HI',
	BLOCK_TABLE: '4I'
};

function unpack(srcBuffer, format) {
    return jspack.Unpack(format, srcBuffer, 0);
};

function pack(srcBuffer, format) {
    return jspack.Pack(format, srcBuffer, 0);
};

function size(format) {
    return jspack.CalcLength(format);
};

module.exports = {
    FORMAT: PACK_FORMATS,
    unpack: unpack,
    pack: pack,
    size: size
};
