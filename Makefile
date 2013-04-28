TESTS = test/*.js

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter spec $(TESTS)

test-watch:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter spec -w $(TESTS)

.PHONY: test
