var fs = require('fs');
var jspack = require('jspack').jspack;

var PACK_FORMAT = {
	FILE_HEADER: '<4s2I2H4I',
	FILE_HEADER_EXT: 'q2h',
	USER_DATA_HEADER: '<4s3I',
	HASH_TABLE: '2I2HI',
	BLOCK_TABLE: '4I'
};

fs.open('the.boneyard.SC2Replay', 'r', function(err, fd) {
	if (err) {
		console.error(err);
	}

	read(fd, {
		position: 0,
		length: 4
	},
	function(err, bytes, buffer) {
		console.log(buffer.toString());
		read(fd, {
			position: 0,
			length: 16
		},
		/* user header */
		function(err, bytes, buffer) {
            console.log(err, bytes);
			var userDataHeaderUnpacked = unpack(buffer, PACK_FORMAT.USER_DATA_HEADER);
			console.log(userDataHeaderUnpacked);
			userDataHeader = {
				magic: userDataHeaderUnpacked[0],
				size: userDataHeaderUnpacked[1],
				headerOffset: userDataHeaderUnpacked[2],
				headerSize: userDataHeaderUnpacked[3]
			};
			console.log(userDataHeader);
			/* skip this - I don't need content yet
			read(fd, {
				position: 20,
				length: userDataHeader.headerSize
			},
			function(err, bytes, buffer) {
				userDataHeader.contentBuffer = buffer;
			});
            */

			/* reading file header */
			var newPos = userDataHeader.headerOffset;
			read(fd, {
				position: newPos,
				length: 32
			},
			function(err, bytes, buffer) {
                console.log(err, bytes);
				var fileHeaderUnpacked = unpack(buffer, PACK_FORMAT.FILE_HEADER);
				console.log(fileHeaderUnpacked);
                fs.close(fd);
			});
		});
	});

});


function read(fd, config, callback) {
	var buffer = new Buffer(config.length);
	fs.read(fd, buffer, config.offset || 0, config.length, config.position, callback);
};

function unpack(buffer, format) {
	return jspack.Unpack(format, buffer, 0);
}

