const assert = require('node:assert/strict');
const { calculateBandwidth, calculateTransferTime, formatDuration, formatNumber } = require('./app');

const oneGigabytePerMinute = calculateBandwidth(1, 'GB', 1, 'minute');
assert.ok(Math.abs(oneGigabytePerMinute.megabitsPerSecond - 133.3333) < 0.0001);
assert.ok(Math.abs(oneGigabytePerMinute.megabytesPerSecond - 16.6667) < 0.0001);
assert.equal(calculateBandwidth(500, 'MB', 2, 'second').megabitsPerSecond, 2000);
assert.ok(Math.abs(calculateBandwidth(1, 'TB', 1, 'hour').megabytesPerSecond - 277.7778) < 0.0001);
assert.equal(calculateBandwidth(0, 'GB', 1, 'minute'), null);
assert.equal(calculateBandwidth(1, 'unknown', 1, 'minute'), null);
assert.equal(formatNumber(133.3333), '133.33');
assert.equal(calculateTransferTime(1, 'GB', 100, 'Mbps'), 80);
assert.equal(calculateTransferTime(1, 'GB', 1, 'Gbps'), 8);
assert.equal(calculateTransferTime(500, 'MB', 10, 'MBps'), 50);
assert.equal(calculateTransferTime(1, 'TB', 1, 'GBps'), 1000);
assert.equal(calculateTransferTime(0, 'GB', 100, 'Mbps'), null);
assert.equal(calculateTransferTime(1, 'GB', 100, 'unknown'), null);
assert.equal(formatDuration(80), '1分 20秒');
assert.equal(formatDuration(90061), '1日 1時間 1分 1秒');
assert.equal(formatDuration(0.25), '0.25秒');

console.log('Bandwidth Calculator tests passed');
