var packer = require('./pack');
var encryption = require('./encryption');
var read = require('./util/fs').read;
var bzip = require('seek-bzip');

var MPQ_FILE_IMPLODE = 0x00000100;
var MPQ_FILE_COMPRESS = 0x00000200;
var MPQ_FILE_ENCRYPTED = 0x00010000;
var MPQ_FILE_FIX_KEY = 0x00020000;
var MPQ_FILE_SINGLE_UNIT = 0x01000000;
var MPQ_FILE_DELETE_MARKER = 0x02000000;
var MPQ_FILE_SECTOR_CRC = 0x04000000;
var MPQ_FILE_EXISTS = 0x80000000;

function readFile(fd, hashTable, blockTable, header, fileName, callback) {

	var hashEntry = getHashEntry(fileName, hashTable);
	if (hashEntry == null) {
		callback(null);
	}

	var blockEntry = blockTable[hashEntry.blockTableIndex];

	if (blockEntry.flags & MPQ_FILE_EXISTS) {
		if (blockEntry.archivedSize === 0) {
			callback(null);
			return;
		}
		if (blockEntry.flags & MPQ_FILE_ENCRYPTED) {
			callback('encryption not supported');
			return;
		}

		var offset = blockEntry.offset + header.userHeader.headerOffset;
		read(fd, {
			position: offset,
			length: blockEntry.archivedSize
		},
		function(err, bytes, buffer) {
			if (! (blockEntry.flags & MPQ_FILE_SINGLE_UNIT)) {
				var sectorSize = 512 << self.header.sectorSizeShirt
				var sectors = blockEntry.size / sectorSize + 1;
				var crc = false;
				if (blockEntry.flags & MPQ_FILE_SECTOR_CFC) {
					crc = true;
					sectors += 1;
				}

				var buf = new Buffer[4 * (sectors + 1)];
				var positions = packer.unpack('<' + (sectors + 1) + 'I', buffer);
                //TODO not yet done porting
			} else {
                if( (blockEntry.flags & MPQ_FILE_COMPRESS) && (blockEntry.size > blockEntry.archivedSize)) {
					if( fileName === 'replay.attributes.events' ) {
						console.log(offset);
						console.log(blockEntry.archivedSize);
						console.log(buffer.toString());
					}
                    buffer = decompress(buffer);
					console.log(buffer);
                }
                process.nextTick(function() {
                    callback(null, buffer);
                });
			};
		});
	} else {
        //TODO need to improve error messages
		callback(null);
	};
}

function getHashEntry(filename, hashTable) {

	var hash_a = encryption.hash(filename, 'HASH_A');
	var hash_b = encryption.hash(filename, 'HASH_B');

	for (var i in hashTable) {
		if (hash_a === hashTable[i].hashA && hash_b === hashTable[i].hashB) {
			return hashTable[i];
		}
	}
	return null;
};


function decompress(buffer) {
    var compressionType = buffer[0];
    if( compressionType === 0 ) {
        return buffer;
    }else if( compressionType == 2) {
        throw new Error('not yet implemented');
    } else if ( compressionType == 16 ) {
        return bzip.decode(buffer.slice(1));
    } else {
        throw new Error('unknown compression type');
    }
};

module.exports = {
	readFile: readFile
};

