const assert = require("assert");
const { formatNumbers, parseRange, randomDigitString, randomInteger } = require("./app.js");

assert.deepStrictEqual(parseRange("-100,100"), { minimum: -100, maximum: 100 });
assert.throws(() => parseRange("100,1"), RangeError);
assert.strictEqual(randomInteger(1, 10, 0), 1);
assert.strictEqual(randomInteger(1, 10, 0.999999), 10);
assert.strictEqual(randomInteger(-5, 5, 0.5), 0);
assert.throws(() => randomInteger(1, 10, 1), RangeError);
assert.strictEqual(formatNumbers([12, 34, 56], "newline"), "12\n34\n56");
assert.strictEqual(formatNumbers([12, 34, 56], "comma"), "12, 34, 56");
assert.strictEqual(formatNumbers([12, 34], "pipe"), "12 | 34");
assert.strictEqual(randomDigitString(1, (buffer) => buffer.fill(0)), "1");
assert.strictEqual(randomDigitString(4, (buffer) => buffer.fill(9)), "1999");
assert.strictEqual(randomDigitString(3, (buffer) => buffer.fill(0), true), "0");
assert.strictEqual(randomDigitString(4, (buffer) => buffer.fill(9), true), "9999");
assert.strictEqual(randomDigitString(32, (buffer) => buffer.fill(248)).length, 32);
assert.throws(() => randomDigitString(0), RangeError);
assert.throws(() => randomDigitString(33), RangeError);

console.log("Random number generator tests passed");
