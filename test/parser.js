var should = require('should');
var factory = require('../lib').FileParserFactory;
var parser = factory.createParser('');

describe('file parser', function() {
	describe('api', function() {
		it('should have a parse method', function() {
			should.exist(parser.parse);
			parser.parse.should.be.a('function');
		})
		it('should have an extract method', function() {
			should.exist(parser.extract);
			parser.extract.should.be.a('function');
		})
		it('should have an on method', function() {
			should.exist(parser.extract);
			parser.extract.should.be.a('function');
		})
	})
})

