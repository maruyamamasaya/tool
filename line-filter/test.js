const assert = require("node:assert/strict");
const { splitLines, filterLines, formatResult } = require("./app.js");

assert.deepEqual(splitLines("a\r\nb\rc\n"), ["a", "b", "c", ""]);
assert.deepEqual(filterLines("INFO ok\nERROR failed\nERROR retry", [{ type: "contains", value: "ERROR" }]).matches, [
  { line: "ERROR failed", lineNumber: 2 }, { line: "ERROR retry", lineNumber: 3 }
]);
assert.equal(filterLines("ERROR api\nERROR db\nINFO api", [
  { type: "contains", value: "ERROR" }, { type: "contains", value: "api" }
], { join: "and" }).matchCount, 1);
assert.equal(filterLines("ERROR api\nWARN db\nINFO ok", [
  { type: "contains", value: "ERROR" }, { type: "contains", value: "WARN" }
], { join: "or" }).matchCount, 2);
assert.equal(filterLines("Error\nERROR\ninfo", [{ type: "equals", value: "error" }], { ignoreCase: true }).matchCount, 2);
assert.equal(filterLines("api ready\nweb failed", [{ type: "notContains", value: "failed" }]).matchCount, 1);
assert.equal(filterLines("\nERROR\n", [{ type: "contains", value: "" }], { ignoreEmpty: true }).matchCount, 0);
assert.equal(formatResult([{ line: "ERROR", lineNumber: 7 }], true), "7: ERROR");

console.log("All Line Filter tests passed.");
