'use strict';

const pageSpyPlugins = require('..');
const assert = require('assert').strict;

assert.strictEqual(pageSpyPlugins(), 'Hello from pageSpyPlugins');
console.info('pageSpyPlugins tests passed');
