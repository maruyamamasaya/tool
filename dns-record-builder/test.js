'use strict';
const assert = require('assert');
const { isIPv4, isIPv6, isHostname, validateRecord, formatRecord, quoteTXT, escapeHTML } = require('./app.js');

assert.strictEqual(isIPv4('192.0.2.1'), true);
assert.strictEqual(isIPv4('256.0.0.1'), false);
assert.strictEqual(isIPv6('2001:db8::1'), true);
assert.strictEqual(isIPv6('2001:::1'), false);
assert.strictEqual(isHostname('mail.example.com.'), true);
assert.strictEqual(isHostname('-mail.example.com'), false);
assert.strictEqual(validateRecord({ type: 'A', host: '@', ttl: 3600, value: '192.0.2.1' }), '');
assert.match(validateRecord({ type: 'A', host: 'www', ttl: 3600, value: '999.1.1.1' }), /IPv4/);
assert.strictEqual(formatRecord({ type: 'A', host: '@', ttl: 3600, value: '192.0.2.1' }), '@\t3600\tIN\tA\t192.0.2.1');
assert.strictEqual(formatRecord({ type: 'MX', host: '@', ttl: 3600, value: 'mail.example.com', priority: 10 }), '@\t3600\tIN\tMX\t10 mail.example.com.');
assert.strictEqual(quoteTXT('hello "DNS"'), '"hello \\"DNS\\""');
assert.strictEqual(escapeHTML('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
console.log('dns-record-builder: all tests passed');
