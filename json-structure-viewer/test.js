const assert = require("assert");
const { flattenJson, valueType } = require("./app.js");

assert.strictEqual(valueType(null), "null");
assert.strictEqual(valueType([]), "array");

const result = flattenJson({ users: [{ name: "Taro", active: true }], count: 1 });
assert.deepStrictEqual(result.rows.map((row) => [row.path, row.type, row.value]), [
  ["$", "object", "2 properties"],
  ["$.users", "array", "1 items"],
  ["$.users[0]", "object", "2 properties"],
  ["$.users[0].name", "string", '"Taro"'],
  ["$.users[0].active", "boolean", "true"],
  ["$.count", "number", "1"]
]);
assert.strictEqual(result.truncated, false);

const limited = flattenJson({ a: 1, b: 2 }, 2);
assert.strictEqual(limited.rows.length, 2);
assert.strictEqual(limited.truncated, true);

console.log("JSON Structure Viewer tests passed");
