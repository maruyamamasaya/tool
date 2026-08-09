const assert = require('assert');
const { PORTS, POPULAR, searchPorts } = require('./app.js');

assert(PORTS.length >= 40, '主要ポートを十分に収録している');
assert.deepStrictEqual(searchPorts('443').map((item) => item.service), ['HTTPS']);
assert(searchPorts('database').some((item) => item.port === 3306));
assert(searchPorts('メール').some((item) => item.port === 25));
assert(searchPorts('', 'UDP').every((item) => item.protocol.includes('UDP')));
assert.deepStrictEqual(searchPorts('SSH', 'UDP'), []);
assert(POPULAR.every((port) => PORTS.some((item) => item.port === port)));
console.log('port number finder tests passed');
