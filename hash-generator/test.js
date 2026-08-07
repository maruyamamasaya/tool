const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { bytesToHex, bytesToBase64, generateHash } = require("./app.js");

(async () => {
  assert.equal(bytesToHex(new Uint8Array([0, 15, 16, 255])), "000f10ff");
  assert.equal(bytesToBase64(new Uint8Array([72, 101, 108, 108, 111])), "SGVsbG8=");
  assert.equal(await generateHash("hello", "SHA-256", "hex", webcrypto), "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  assert.equal(await generateHash("hello", "SHA-1", "hex", webcrypto), "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
  assert.equal(await generateHash("hello", "SHA-256", "base64", webcrypto), "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=");
  assert.equal((await generateHash("日本語", "SHA-512", "hex", webcrypto)).length, 128);
  await assert.rejects(generateHash("hello", "MD5", "hex", webcrypto), /対応していないアルゴリズム/);
  await assert.rejects(generateHash("hello", "SHA-256", "binary", webcrypto), /対応していない出力形式/);
  console.log("All Hash Generator tests passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
