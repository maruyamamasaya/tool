const assert = require('node:assert/strict');
const { parseTime, durationBetween, calculateWork, parseRanges, formatDuration, formatDecimal } = require('./app');

assert.equal(parseTime('09:15'), 555);
assert.equal(parseTime('9:05'), 545);
assert.equal(parseTime('24:00'), null);
assert.equal(parseTime('09:60'), null);
assert.equal(durationBetween('09:15', '18:30'), 555);
assert.equal(durationBetween('23:30', '01:00'), 90);
assert.deepEqual(calculateWork('09:15', '18:30', '01:00'), { elapsed: 555, breakMinutes: 60, work: 495 });
assert.equal(calculateWork('09:00', '10:00', '02:00').error, '休憩時間は実時間以内にしてください。');
assert.equal(parseRanges('09:00 - 10:30\n11:15〜12:00\n13:00 — 16:45').total, 360);
assert.equal(parseRanges('09:00 - 10:00\nbad line').error, '2行目の形式を確認してください。');
assert.equal(parseRanges('\n').total, 0);
assert.equal(formatDuration(495), '8時間15分');
assert.equal(formatDuration(360), '6時間00分');
assert.equal(formatDecimal(495), '8.25');
assert.equal(formatDecimal(61), '1.02');
console.log('Time Calculator tests passed');
