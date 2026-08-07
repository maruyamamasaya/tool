const assert = require("assert");
const { generateUuid, normalizeCount } = require("./app.js");

const uuid = generateUuid(new Uint8Array(16));
assert.strictEqual(uuid, "00000000-0000-4000-8000-000000000000");
assert.match(generateUuid(Uint8Array.from({ length: 16 }, (_, index) => index * 13)), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
assert.strictEqual(normalizeCount("25"), 25);
assert.strictEqual(normalizeCount("0"), 1);
assert.strictEqual(normalizeCount("101"), 100);
assert.strictEqual(normalizeCount("abc"), 1);

console.log("UUID generator tests passed");
