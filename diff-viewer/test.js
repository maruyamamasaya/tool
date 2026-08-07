const assert = require('node:assert/strict');
const { splitLines, lcsDiff, changedRange, lineSimilarity } = require('./app.js');

assert.deepEqual(splitLines('aaa\r\n\r\nccc'), ['aaa', '', 'ccc']);
assert.deepEqual(splitLines(''), []);
const blank = lcsDiff(splitLines('aaa\nbbb\nccc\nddd'), splitLines('aaa\nbbb\n\nccc\nddd'));
assert.deepEqual(blank.map(x => x.type), ['same', 'same', 'added', 'same', 'same']);
assert.equal(blank[3].leftNo, 3); assert.equal(blank[3].rightNo, 4);
const changed = lcsDiff(['timeout=30'], ['timeout=60']);
assert.equal(changed[0].type, 'changed');
assert.deepEqual(changedRange('server=prod', 'server=production'), { start: 7, leftEnd: 11, rightEnd: 17 });
assert.ok(lineSimilarity('timeout=30', 'timeout=60') > .5);
console.log('All Text Diff Viewer tests passed.');
