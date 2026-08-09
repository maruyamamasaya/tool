const assert = require("node:assert/strict");
const { parseList, compareLists } = require("./app.js");

assert.deepEqual(parseList(" apple\r\nbanana\rapple\n\n"), [
  { value: "apple", key: "apple" }, { value: "banana", key: "banana" }
]);
assert.deepEqual(compareLists("apple\nbanana\norange", "banana\norange\ngrape"), {
  aCount: 3, bCount: 3, common: ["banana", "orange"], onlyA: ["apple"], onlyB: ["grape"]
});
assert.deepEqual(compareLists("Apple\nPEAR", "apple\npear", { ignoreCase: true }), {
  aCount: 2, bCount: 2, common: ["Apple", "PEAR"], onlyA: [], onlyB: []
});
assert.deepEqual(compareLists(" a \n", "a", { trimItems: false }), {
  aCount: 1, bCount: 1, common: [], onlyA: [" a "], onlyB: ["a"]
});
assert.deepEqual(compareLists("x\nx\ny", "x"), {
  aCount: 2, bCount: 1, common: ["x"], onlyA: ["y"], onlyB: []
});

console.log("All List Compare tests passed.");
