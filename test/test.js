var should = require('should');
var root = require('../lib');
var EventEmitter = require('events').EventEmitter;

describe('root', function() {
    it('should have a factory property', function() {
        should.exist(root.FileParserFactory);
    })
})

var factory = root.FileParserFactory;
describe('factory', function() {
    it('should have a factory method', function() {
        should.exist(factory.createParser);
        factory.createParser.should.be.a('function');
    })
    it('should create a parser', function() {
        var parser = factory.createParser('filename');
        should.exist(parser); 
    })
    it('should create a parser which is a pseudo EventEmitter', function() {
        var parser = factory.createParser();
        should.exist(parser.on);
    })
})

var parser = factory.createParser();
describe('parser', function() {
    it('should have a parse method', function() {
        should.exist(parser.parse);
        parser.parse.should.be.a('function');
    })
    it('should have an extract method', function() {
        should.exist(parser.extract);
        parser.extract.should.be.a('function');
    })
})
