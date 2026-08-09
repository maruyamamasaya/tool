const assert = require("node:assert/strict");
const { valueType, nodesFromValue, nodesToValue, changeNodeType, formatBytes, templates } = require("./app.js");

assert.equal(valueType(null), "null");
assert.equal(valueType([]), "array");
assert.equal(valueType({}), "object");

const source = { name: "Taro", age: 30, enabled: true, tags: ["a", "b"], meta: { note: null } };
const nodes = nodesFromValue(source);
assert.deepEqual(nodesToValue(nodes), source);
assert.equal(nodes[3].type, "array");
assert.equal(nodes[4].value[0].type, "null");

changeNodeType(nodes[0], "number");
nodes[0].value = "42";
assert.equal(nodesToValue(nodes).name, 42);
changeNodeType(nodes[0], "object");
assert.deepEqual(nodes[0].value, []);
assert.equal(formatBytes("abc"), "3 bytes");
assert.equal(templates.length, 4);
assert.deepEqual(nodesToValue(nodesFromValue([1, "two"]), "array"), [1, "two"]);

console.log("All JSON Builder tests passed.");
