'use strict';

const assert = require('assert');
const { parseAvailability, downtimeSeconds, formatDuration } = require('./app.js');

assert.strictEqual(parseAvailability('99.9%'), 99.9);
assert.strictEqual(parseAvailability('９９．９９'), 99.99);
assert.strictEqual(parseAvailability(''), null);
assert.ok(Number.isNaN(parseAvailability('SLA')));
assert.ok(Math.abs(downtimeSeconds(99.9, 30) - 2592) < 1e-7);
assert.strictEqual(downtimeSeconds(100, 365), 0);
assert.ok(Number.isNaN(downtimeSeconds(100.1, 1)));
assert.strictEqual(formatDuration(2592), '43分 12秒');
assert.strictEqual(formatDuration(31536), '8時間 45分 36秒');
assert.strictEqual(formatDuration(90061), '1日 1時間 1分 1秒');
assert.strictEqual(formatDuration(0.2), '0秒');

console.log('SLA calculator tests passed');
