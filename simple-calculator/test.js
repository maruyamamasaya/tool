const assert = require('node:assert/strict');
const { calculate, formatNumber } = require('./app.js');

assert.equal(calculate('100 + 200'), 300);
assert.equal(calculate('100 × 20'), 2000);
assert.equal(calculate('100 ÷ 4'), 25);
assert.equal(calculate('(100 + 200) * 3'), 900);
assert.equal(calculate('-5 * (2 + 3)'), -25);
assert.equal(calculate('.5 + 1.25'), 1.75);
assert.equal(calculate('0.1 + 0.2'), 0.30000000000000004);
assert.equal(formatNumber(calculate('1200 + 350 * 2')), '1,900');
assert.equal(formatNumber(calculate('0.1 + 0.2')), '0.3');

for (const expression of ['', 'hello', '1 +', '(1 + 2', '2(3)', '1 ** 2', '1 / 0']) {
  assert.throws(() => calculate(expression));
}

console.log('All Simple Calculator tests passed.');
