'use strict';

const assert = require('assert');
const { timestampToDate, datetimeToTimestamp, formatDate } = require('./app.js');

assert.strictEqual(timestampToDate('0').toISOString(), '1970-01-01T00:00:00.000Z');
assert.strictEqual(timestampToDate('1704067200').toISOString(), '2024-01-01T00:00:00.000Z');
assert.strictEqual(timestampToDate('1704067200000').toISOString(), '2024-01-01T00:00:00.000Z');
assert.strictEqual(timestampToDate('not-a-time'), null);
assert.deepStrictEqual(datetimeToTimestamp('2024-01-01 00:00:00', 'utc'), { seconds: 1704067200, milliseconds: 1704067200000 });
assert.deepStrictEqual(datetimeToTimestamp('2024-02-29 12:34:56', 'utc'), { seconds: 1709210096, milliseconds: 1709210096000 });
assert.strictEqual(datetimeToTimestamp('2023-02-29 00:00:00', 'utc'), null);
assert.strictEqual(datetimeToTimestamp('2024/01/01', 'utc'), null);
assert.strictEqual(formatDate(new Date('2024-01-02T03:04:05Z'), true), '2024-01-02 03:04:05');

console.log('unix-time-converter tests passed');
