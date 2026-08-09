const assert = require('node:assert/strict');
const { calculate, evaluate, formatNumber } = require('./app.js');

assert.equal(calculate('100 + 200'), 300);
assert.equal(calculate('100 × 20'), 2000);
assert.equal(calculate('100 ÷ 4'), 25);
assert.equal(calculate('(100 + 200) * 3'), 900);
assert.equal(calculate('-5 * (2 + 3)'), -25);
assert.equal(calculate('.5 + 1.25'), 1.75);
assert.equal(calculate('0.1 + 0.2'), 0.30000000000000004);
assert.equal(formatNumber(calculate('1200 + 350 * 2')), '1,900');
assert.equal(formatNumber(calculate('0.1 + 0.2')), '0.3');

assert.deepEqual(evaluate(''), { value: null, formatted: '—', error: '' });
assert.deepEqual(evaluate('1 + 2 * 3'), { value: 7, formatted: '7', error: '' });
assert.deepEqual(evaluate('1 +'), { value: null, formatted: '—', error: '式を確認してください。' });
assert.deepEqual(evaluate('4 / 0'), { value: null, formatted: '—', error: '0で割ることはできません。' });

for (const expression of ['', 'hello', '1 +', '(1 + 2', '2(3)', '1 ** 2', '1 / 0']) {
  assert.throws(() => calculate(expression));
}

console.log('All Simple Calculator tests passed.');
