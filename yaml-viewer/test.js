const assert = require("assert");
const { valueType, formatValue, pathFor, countNodes, normalizeTabs } = require("./app.js");

assert.strictEqual(valueType(null), "null");
assert.strictEqual(valueType([]), "array");
assert.strictEqual(valueType({}), "object");
assert.strictEqual(valueType("yes"), "string");
assert.strictEqual(formatValue("sample"), '"sample"');
assert.strictEqual(formatValue(false), "false");
assert.strictEqual(pathFor("app.features", 1, true), "app.features[1]");
assert.strictEqual(pathFor("app", "database", false), "app.database");
assert.strictEqual(pathFor("", "a key", false), '["a key"]');
assert.strictEqual(countNodes({ app: { ports: [80, 443] }, active: true }), 6);
assert.strictEqual(normalizeTabs("app:\n\tname: test"), "app:\n  name: test");

console.log("YAML Viewer tests passed");
