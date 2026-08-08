const assert = require('node:assert/strict');
const { parseNumbers, summarize, formatNumber, createCopyText } = require('./app');

assert.deepEqual(parseNumbers('11, 19\n38 42\n46\t51\n56,66\n82\n96'), {
  numbers: [11, 19, 38, 42, 46, 51, 56, 66, 82, 96], ignored: 0
});
assert.deepEqual(parseNumbers('100\n-20\n35.5\n0\n12.75\nabc\n9x'), {
  numbers: [100, -20, 35.5, 0, 12.75], ignored: 2
});
assert.deepEqual(parseNumbers(' , \n\t'), { numbers: [], ignored: 0 });
assert.deepEqual(parseNumbers('.5 +2 -0.25'), { numbers: [0.5, 2, -0.25], ignored: 0 });
assert.deepEqual(summarize([11, 19, 38, 42, 46, 51, 56, 66, 82, 96]), {
  sum: 507, average: 50.7, count: 10, max: 96, min: 11, median: 48.5, range: 85
});
assert.deepEqual(summarize([-10, 0, 4]), { sum: -6, average: -2, count: 3, max: 4, min: -10, median: 0, range: 14 });
assert.equal(summarize([]), null);
assert.equal(formatNumber(1234.5), '1,234.5');
assert.equal(createCopyText(summarize([1, 2, 3])), 'SUM: 6\nAVERAGE: 2\nCOUNT: 3\nMAX: 3\nMIN: 1\nMEDIAN: 2\nRANGE: 2');

console.log('Number Calculator tests passed');
