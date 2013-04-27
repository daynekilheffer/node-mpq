var should = require('should');
var root = require('../lib');

describe('root', function() {
    it('should have a factory property', function() {
        should.exist(root.FileParserFactory);
		root.FileParserFactory.should.be.a('object');
    })
})
