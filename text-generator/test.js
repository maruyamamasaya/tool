"use strict";
const assert = require("node:assert/strict");
const { clampInteger, generateItem, generateText, sentence } = require("./app.js");

const fixedRandom = () => 0.25;
assert.equal(clampInteger(20000, 1, 10000), 10000);
assert.equal(generateItem("alphanumeric", 50, fixedRandom).length, 50);
assert.match(generateItem("number", 20, fixedRandom), /^\d{20}$/);
assert.match(generateItem("alpha", 20, fixedRandom), /^[A-Za-z]{20}$/);
assert.equal(generateItem("uuid", 36, fixedRandom).split("-").length, 5);
assert.match(sentence("ja", fixedRandom), /。$/);
assert.match(sentence("en", fixedRandom), /\.$/);
assert.equal(generateText({ type: "ip", length: 20, lines: 5, separator: "newline" }, fixedRandom).split("\n").length, 5);
assert.equal(generateText({ type: "filename", length: 10, lines: 3, separator: "comma" }, fixedRandom).length, 32);
assert.equal(generateText({ type: "number", length: 10, lines: 2, separator: "tab" }, fixedRandom)[10], "\t");
console.log("text-generator tests passed");
