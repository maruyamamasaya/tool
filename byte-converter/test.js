const assert = require('node:assert/strict');
const { convert, formatValue, parseByteText } = require('./script.js');

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

assert.deepEqual(parseByteText('123456b'), { value: 123456, unit: 'B' });
assert.deepEqual(parseByteText('123456 B'), { value: 123456, unit: 'B' });
assert.deepEqual(parseByteText('1234567kB'), { value: 1234567, unit: 'KB' });
assert.deepEqual(parseByteText('12345B　あああ'), { value: 12345, unit: 'B' });
assert.deepEqual(parseByteText('容量: 1,234.5 MiB です'), { value: 1234.5, unit: 'MiB' });
assert.equal(parseByteText('123456'), null);
assert.equal(parseByteText('12,34 KB'), null);
assert.equal(parseByteText('-1 MB'), null);

console.log('All Byte Converter tests passed.');
