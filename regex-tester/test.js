const assert = require('node:assert/strict');
const { findMatches, escapeHtml, buildHighlight } = require('./app.js');

const postal = findMatches('\\d{3}-\\d{4}', 'g', '100-0001 / 530-0001');
assert.equal(postal.matches.length, 2);
assert.deepEqual(postal.matches.map(match => match.index), [0, 11]);

const date = findMatches('(\\d{4})-(\\d{2})-(\\d{2})', 'g', '2026-08-08');
assert.deepEqual(date.matches[0].groups, ['2026', '08', '08']);

assert.equal(findMatches('hello', 'i', 'HELLO hello').matches.length, 1);
assert.equal(findMatches('^item', 'gm', 'item 1\nitem 2').matches.length, 2);
assert.equal(findMatches('', 'g', 'ab').matches.length, 3);
assert.throws(() => findMatches('([a-z]+', 'g', 'abc'), SyntaxError);
assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
assert.match(buildHighlight('<x>', [{ value: 'x', index: 1, end: 2, groups: [] }]), /&lt;<mark[^>]*>x<\/mark>&gt;/);

console.log('All Regex Tester tests passed.');
