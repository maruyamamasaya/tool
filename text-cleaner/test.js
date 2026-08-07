const assert = require("node:assert/strict");
const { cleanText } = require("./app.js");

assert.equal(cleanText("見出し\r\n本文\r次の行"), "見出し\n本文\n次の行");
assert.equal(cleanText("Hello\u00a0world"), "Hello world");
assert.equal(cleanText("ゼロ\u200b幅\ufeff文字"), "ゼロ幅文字");
assert.equal(cleanText("  空白と\n改行は残す  "), "  空白と\n改行は残す  ");

console.log("All Text Cleaner tests passed.");
