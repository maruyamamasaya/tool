"use strict";

const assert = require("node:assert/strict");
const { parseBaseValue, formatBaseValue } = require("./app.js");

assert.equal(parseBaseValue("1010", 2), 10n);
assert.equal(parseBaseValue("0b1010", 2), 10n);
assert.equal(parseBaseValue("FF", 16), 255n);
assert.equal(parseBaseValue("0xff", 16), 255n);
assert.equal(parseBaseValue("1,000", 10), 1000n);
assert.equal(parseBaseValue("z", 36), 35n);
assert.equal(parseBaseValue("-FF", 16), -255n);
assert.equal(parseBaseValue("  ", 10), null);
assert.equal(formatBaseValue(255n, 2), "11111111");
assert.equal(formatBaseValue(255n, 16), "FF");
assert.equal(formatBaseValue(255n, 8), "377");
assert.equal(formatBaseValue(123456789012345678901234567890n, 36), "BYW97UM9S91DLZ68TSI");
assert.throws(() => parseBaseValue("10201", 2), /2進数では「2」は使用できません/);
assert.throws(() => parseBaseValue("G", 16), /16進数では「G」は使用できません/);
assert.throws(() => parseBaseValue("1", 37), /基数は2〜36/);

console.log("Number Base Converter tests passed");
