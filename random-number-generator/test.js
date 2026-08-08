const assert = require("assert");
const { formatNumbers, parseRange, randomInteger } = require("./app.js");

assert.deepStrictEqual(parseRange("-100,100"), { minimum: -100, maximum: 100 });
assert.throws(() => parseRange("100,1"), RangeError);
assert.strictEqual(randomInteger(1, 10, 0), 1);
assert.strictEqual(randomInteger(1, 10, 0.999999), 10);
assert.strictEqual(randomInteger(-5, 5, 0.5), 0);
assert.throws(() => randomInteger(1, 10, 1), RangeError);
assert.strictEqual(formatNumbers([12, 34, 56], "newline"), "12\n34\n56");
assert.strictEqual(formatNumbers([12, 34, 56], "comma"), "12, 34, 56");
assert.strictEqual(formatNumbers([12, 34], "pipe"), "12 | 34");

console.log("Random number generator tests passed");
