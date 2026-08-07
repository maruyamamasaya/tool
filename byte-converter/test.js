const assert = require('node:assert/strict');
const { convert, formatValue } = require('./script.js');

assert.equal(convert(1, 'KB').B, 1000);
assert.equal(convert(1, 'KiB').B, 1024);
assert.equal(convert(1, 'GB').MB, 1000);
assert.equal(convert(1, 'GiB').MiB, 1024);
assert.equal(convert(0, 'B').TiB, 0);
assert.equal(convert(-1, 'MB'), null);
assert.equal(convert(Number.NaN, 'MB'), null);
assert.equal(convert(1, 'unknown'), null);
assert.equal(formatValue(1048576), '1,048,576');
assert.equal(formatValue(0.0000001), '1e-7');

console.log('All Byte Converter tests passed.');
