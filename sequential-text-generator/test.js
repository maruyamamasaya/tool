"use strict";

const assert = require("node:assert/strict");
const { splitLines, formatNumber, generateSequentialText } = require("./app.js");

assert.deepEqual(splitLines("a\r\nb\rc"), ["a", "b", "c"]);
assert.equal(formatNumber(1, 3), "001");
assert.equal(formatNumber(-2, 3), "-002");

assert.deepEqual(generateSequentialText("apple\nbanana\norange", {}), {
  output: "1. apple\n2. banana\n3. orange", lineCount: 3, numberedCount: 3
});

assert.equal(generateSequentialText("東京\n大阪\n福岡", {
  start: 1, increment: 1, digits: 2, prefix: "item-", separator: "-"
}).output, "item-01-東京\nitem-02-大阪\nitem-03-福岡");

assert.equal(generateSequentialText("東京\n大阪\n福岡", {
  start: 1, increment: 1, digits: 3, separator: "_", position: "end"
}).output, "東京_001\n大阪_002\n福岡_003");

assert.equal(generateSequentialText("a\n\nb", {
  start: 10, increment: 10, separator: ":", numberEmptyLines: false
}).output, "10:a\n\n20:b");

assert.equal(generateSequentialText("a\n\nb", {
  start: 0, increment: 2, separator: "-", numberEmptyLines: true
}).output, "0-a\n2-\n4-b");

assert.equal(generateSequentialText("x", { start: -2, increment: -3, digits: 3, suffix: "!" }).output, "-002. x!");

console.log("sequential-text-generator: all tests passed");
