const assert = require('node:assert/strict');
const { calculateBandwidth, formatNumber } = require('./app');

const oneGigabytePerMinute = calculateBandwidth(1, 'GB', 1, 'minute');
assert.ok(Math.abs(oneGigabytePerMinute.megabitsPerSecond - 133.3333) < 0.0001);
assert.ok(Math.abs(oneGigabytePerMinute.megabytesPerSecond - 16.6667) < 0.0001);
assert.equal(calculateBandwidth(500, 'MB', 2, 'second').megabitsPerSecond, 2000);
assert.ok(Math.abs(calculateBandwidth(1, 'TB', 1, 'hour').megabytesPerSecond - 277.7778) < 0.0001);
assert.equal(calculateBandwidth(0, 'GB', 1, 'minute'), null);
assert.equal(calculateBandwidth(1, 'unknown', 1, 'minute'), null);
assert.equal(formatNumber(133.3333), '133.33');

console.log('Bandwidth Calculator tests passed');
