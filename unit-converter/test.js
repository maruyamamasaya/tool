const assert = require("assert");
const { categories, convert } = require("./app.js");

assert.strictEqual(Object.keys(categories).length, 10);
assert.strictEqual(convert(1, "km", "m", "length"), 1000);
assert.strictEqual(convert(1, "kg", "g", "weight"), 1000);
assert.strictEqual(convert(0, "℃", "℉", "temperature"), 32);
assert.ok(Math.abs(convert(32, "℉", "℃", "temperature")) < 1e-12);
assert.strictEqual(convert(1, "GB", "MB", "data", { base: 1024 }), 1024);
assert.strictEqual(convert(1, "GB", "MB", "data", { base: 1000 }), 1000);
assert.strictEqual(convert(100, "USD", "JPY", "currency", { rate: 150 }), 15000);
assert.ok(Number.isNaN(convert(100, "USD", "JPY", "currency", { rate: NaN })));
assert.ok(Number.isNaN(convert(NaN, "m", "km", "length")));

console.log("unit converter tests passed");
