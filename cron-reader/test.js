'use strict';
const assert = require('assert');
const { parseCron, describeCron } = require('./app.js');
const describe = cron => describeCron(parseCron(cron));

assert.strictEqual(describe('0 9 * * *'), '毎日 9:00 に実行');
assert.strictEqual(describe('*/5 * * * *'), '5分ごとに実行');
assert.strictEqual(describe('0 9 * * 1-5'), '平日の毎日 9:00 に実行');
assert.strictEqual(describe('0 0 1 * *'), '毎月1日 0:00 に実行');
assert.strictEqual(describe('30 18 * * 1'), '毎週月曜日 18:30 に実行');
assert.strictEqual(describe('0 9,18 * * *'), '毎日 9:00、18:00 に実行');
assert.strictEqual(describe('  0\t9   * * *  '), '毎日 9:00 に実行');
assert.throws(() => parseCron('0 25 * * *'), /時には0〜23/);
assert.throws(() => parseCron('0 9 * *'), /フィールドは5つ/);
assert.throws(() => parseCron('0 9 5-1 * *'), /小さい値から/);
assert.throws(() => parseCron('0 9 * * MON'), /使用できない記号/);
console.log('Cron Reader tests passed');
