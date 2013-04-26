var fs = require('fs');

function read(fd, config, callback) {
	var buffer = new Buffer(config.length);
	fs.read(fd, buffer, config.offset || 0, config.length, config.position, function(e, b, d) {
		callback(e, b, d);
	});
};

module.exports = {
	read: read
};

