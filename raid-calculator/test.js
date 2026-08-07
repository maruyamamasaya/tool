const assert = require('node:assert/strict');
const { calculateRaid, formatCapacity } = require('./app.js');

assert.deepEqual(calculateRaid('0', 4, 2).usable, 8);
assert.equal(calculateRaid('1', 4, 2).usable, 2);
assert.equal(calculateRaid('5', 4, 4).usable, 12);
assert.equal(calculateRaid('6', 6, 4).usable, 16);
assert.equal(calculateRaid('10', 6, 4).usable, 12);
assert.equal(calculateRaid('5', 2, 4).error, 'RAID 5には3台以上のディスクが必要です。');
assert.match(calculateRaid('10', 5, 4).error, /偶数/);
assert.match(calculateRaid('0', 2, 0).error, /0より大きい/);
assert.equal(formatCapacity(12.345, 'TB'), '12.35 TB');
console.log('All RAID Calculator tests passed.');
