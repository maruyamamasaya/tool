const assert = require("assert");
const qr = require("./qr.js");

assert.deepStrictEqual(qr.utf8Bytes("ABC"), [65, 66, 67]);
assert.strictEqual(qr.utf8Bytes("日本").length, 6);
assert.strictEqual(qr.encodeData("https://example.com").version, 2);

// A complete Reed-Solomon block must have every generator root as a zero.
// This verifies the error-correction bytes rather than only the matrix shape.
const encoded = qr.encodeData("https://www.youtube.com/");
function gfMultiply(a, b) {
  let result = 0;
  while (b) {
    if (b & 1) result ^= a;
    b >>>= 1;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
  }
  return result;
}
let root = 1;
const correctionBytes = encoded.info.total - encoded.info.data;
for (let i = 0; i < correctionBytes; i += 1) {
  const remainder = encoded.codewords.reduce((value, byte) => gfMultiply(value, root) ^ byte, 0);
  assert.strictEqual(remainder, 0, `error-correction root ${i} must be zero`);
  root = gfMultiply(root, 2);
}

assert.strictEqual(qr.createMatrix("a").length, 21);
assert.strictEqual(qr.createMatrix("https://example.com/" + "a".repeat(60)).length, 37);
assert.throws(() => qr.createMatrix(""), /URL/);
assert.throws(() => qr.createMatrix("a".repeat(107)), /長すぎ/);
const svg = qr.toSvg("https://example.com");
assert.match(svg, /^<svg/);
assert.match(svg, /shape-rendering="crispEdges"/);
console.log("QR code generator tests passed");
