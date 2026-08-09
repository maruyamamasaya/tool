const assert = require('assert');
const { STATUSES, CATEGORY_NAMES, searchStatuses } = require('./app.js');

assert(STATUSES.length >= 50, '主なHTTPステータスコードを十分に収録している');
assert.deepStrictEqual(searchStatuses('404').map((status) => status.name), ['Not Found']);
assert(searchStatuses('認証').some((status) => status.code === 401));
assert(searchStatuses('gateway').some((status) => status.code === 502));
assert(searchStatuses('', '4').every((status) => status.category === '4'));
assert.deepStrictEqual(searchStatuses('Not Found', '5'), []);
assert.strictEqual(CATEGORY_NAMES[2], '成功');
console.log('http status viewer tests passed');
