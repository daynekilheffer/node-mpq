var should = require('should');
var factory = require('../lib').FileParserFactory;
var EventEmitter = require('events').EventEmitter;

describe('factory', function() {
	describe('api', function() {
		it('should have a factory method', function() {
			should.exist(factory.createParser);
			factory.createParser.should.be.a('function');
		})
	})
	describe('#createParser', function() {
		it('should create a parser', function() {
			var parser = factory.createParser('filename');
			should.exist(parser);
		})
	})
})

