const assert = require("assert");
const { formatBytes, dimensionsAtScale, outputExtension, MAX_FILE_SIZE, SUPPORTED_TYPES } = require("./app.js");

assert.strictEqual(formatBytes(0), "0 B");
assert.strictEqual(formatBytes(1536), "1.5 KB");
assert.strictEqual(formatBytes(2 * 1024 * 1024), "2.0 MB");
assert.deepStrictEqual(dimensionsAtScale(1920, 1080, 0.5), { width: 960, height: 540 });
assert.deepStrictEqual(dimensionsAtScale(1, 1, 0.25), { width: 1, height: 1 });
assert.strictEqual(outputExtension("image/jpeg"), "jpg");
assert.strictEqual(outputExtension("image/webp"), "webp");
assert.strictEqual(MAX_FILE_SIZE, 30 * 1024 * 1024);
assert.deepStrictEqual(SUPPORTED_TYPES, ["image/jpeg", "image/png", "image/webp"]);
console.log("image resizer tests passed");
