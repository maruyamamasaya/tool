'use strict';

const assert = require('assert');
const { digitToSymbols, parsePermission, describeGroup, summarize } = require('./app.js');

assert.strictEqual(digitToSymbols(7), 'rwx');
assert.strictEqual(digitToSymbols(4), 'r--');
assert.deepStrictEqual(parsePermission('755'), { special: 0, digits: [7, 5, 5], octal: '755', symbolic: 'rwxr-xr-x' });
assert.deepStrictEqual(parsePermission('0644'), { special: 0, digits: [6, 4, 4], octal: '644', symbolic: 'rw-r--r--' });
assert.deepStrictEqual(parsePermission('4755'), { special: 4, digits: [7, 5, 5], octal: '4755', symbolic: 'rwsr-xr-x' });
assert.deepStrictEqual(parsePermission('rwSr--r--'), { special: 4, digits: [6, 4, 4], octal: '4644', symbolic: 'rwSr--r--' });
assert.strictEqual(parsePermission('999').error.length > 0, true);
assert.strictEqual(parsePermission('rwx').error.length > 0, true);
assert.strictEqual(describeGroup(0), 'すべての操作ができません');
assert.match(summarize(parsePermission('750')), /所有者は読み取り・書き込み・実行可能/);

console.log('chmod-calculator tests passed');
