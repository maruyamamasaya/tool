const assert = require("assert");
const qr = require("./qr.js");

assert.deepStrictEqual(qr.utf8Bytes("ABC"), [65, 66, 67]);
assert.strictEqual(qr.utf8Bytes("日本").length, 6);
assert.strictEqual(qr.encodeData("https://example.com").version, 2);
assert.strictEqual(qr.createMatrix("a").length, 21);
assert.strictEqual(qr.createMatrix("https://example.com/" + "a".repeat(60)).length, 37);
assert.throws(() => qr.createMatrix(""), /URL/);
assert.throws(() => qr.createMatrix("a".repeat(107)), /長すぎ/);
const svg = qr.toSvg("https://example.com");
assert.match(svg, /^<svg/);
assert.match(svg, /shape-rendering="crispEdges"/);
console.log("QR code generator tests passed");
