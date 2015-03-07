BABEL = node_modules/.bin/babel
JSCS = node_modules/.bin/jscs
JSHINT = node_modules/.bin/jshint

export NODE_ENV = test

.PHONY: build clean dist lint

build:
	$(BABEL) src/ --modules common --out-dir dist

clean:
	rm -rf dist coverage

dist:
	make clean
	make build

lint:
	$(JSHINT) .
	$(JSCS) -c .jscsrc .
