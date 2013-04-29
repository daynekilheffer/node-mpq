var should = require('should');

var packer = require('../lib/pack');

describe('packer', function() {
    describe('api', function() {
        it('should have a formats hash', function() {
            should.exist(packer.FORMAT);
        })
        it('should have a pack method', function() {
            should.exist(packer.pack);
            packer.pack.should.be.a('function');
        })
        it('should have an unpack method', function() {
            should.exist(packer.unpack);
            packer.unpack.should.be.a('function');
        })
        it('should have a size method', function() {
            should.exist(packer.size);
            packer.size.should.be.a('function');
        })
    })
    describe('#FORMAT', function() {
        it('should have a file header format', function() {
            should.exist(packer.FORMAT.FILE_HEADER);
        })
        it('should have a file header extension format', function() {
            should.exist(packer.FORMAT.FILE_HEADER_EXT);
        })
        it('should have a user header format', function() {
            should.exist(packer.FORMAT.USER_DATA_HEADER);
        })
        it('should have a hash table format', function() {
            should.exist(packer.FORMAT.HASH_TABLE);
        })
        it('should have a block table format', function() {
            should.exist(packer.FORMAT.BLOCK_TABLE);
        })
    })
    describe('#unpack', function() {
        it('should unpack as an Array', function() {
            var buf = new Buffer(8);
            buf.fill(0);
            var packed = packer.unpack(buf, '2I');
            packed.should.be.an.instanceOf(Array);
        })
    })
    describe('#pack', function() {
        it('should pack into an Array', function() {
            var arr = [8,8];
            var unpacked = packer.pack(arr, '2I');
            unpacked.should.be.an.instanceOf(Array);
        })
    })
    describe('#size', function() {
        it('should return a number', function() {
            var size = packer.size('2I');
            size.should.be.a('number');
            size.should.eql(8);
        })
    })
    describe('packing', function() {
        it('packing and unpacking should result in what we started with', function() {
            var initArr = [1,1];
            var format = '2I';
            var packed = packer.pack(initArr, format);
            var unpacked = packer.unpack(packed, format);
            initArr.should.eql(unpacked);
        })
    })
})
