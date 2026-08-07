const assert = require("node:assert/strict");
const { encodeBase64, decodeBase64 } = require("./app.js");

assert.equal(encodeBase64("Hello, world!"), "SGVsbG8sIHdvcmxkIQ==");
assert.equal(decodeBase64("SGVsbG8sIHdvcmxkIQ=="), "Hello, world!");
assert.equal(decodeBase64(encodeBase64("日本語と絵文字 🚀")), "日本語と絵文字 🚀");
assert.equal(decodeBase64("SGVs\nbG8="), "Hello");
assert.equal(encodeBase64(""), "");
assert.equal(decodeBase64(""), "");
assert.throws(() => decodeBase64("not base64"), /Base64の形式/);
assert.throws(() => decodeBase64("//8="), /UTF-8のテキスト/);

console.log("All Base64 Converter tests passed.");
