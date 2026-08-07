const assert = require('node:assert/strict');
const { parseFlexibleNumber, calculateChange, calculateRatio, calculatePercent, calculateReverse, tidy } = require('./app');

assert.equal(parseFlexibleNumber('¥10,000円'), 10000);
assert.equal(parseFlexibleNumber('￥１０，０００'), 10000);
assert.equal(parseFlexibleNumber('+20%'), 20);
assert.equal(parseFlexibleNumber('-20%'), -20);
assert.equal(parseFlexibleNumber('abc'), Number.NaN);
assert.equal(parseFlexibleNumber(''), null);
assert.deepEqual(calculateChange('1,000', '1,250'), { before: 1000, after: 1250, rate: 25, difference: 250, yearOverYear: 125, multiple: 1.25 });
assert.equal(calculateChange('0', '10').error, 'zero');
assert.equal(calculateRatio('1,000', '350').rate, 35);
assert.equal(calculateRatio('0', '5').error, 'zero');
assert.deepEqual(calculatePercent('10,000', '20%'), { base: 10000, rate: 20, amount: 2000, increased: 12000, decreased: 8000 });
assert.equal(calculateReverse('+20%', '12,000').original, 10000);
assert.equal(calculateReverse('-20%', '8,000').original, 10000);
assert.equal(calculateReverse('-100%', '0').error, 'zero');
assert.equal(tidy(1.250000), '1.25');
console.log('Percentage Calculator tests passed');
