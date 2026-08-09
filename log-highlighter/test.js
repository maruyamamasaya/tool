const assert = require("node:assert/strict");
const { detectLevel, parseLogs, countLevels, visibleIndexes, textSegments } = require("./app.js");

assert.equal(detectLevel("Error: failed"), "ERROR");
assert.equal(detectLevel("a warning appeared"), "WARN");
assert.equal(detectLevel('{"level":"critical"}'), "FATAL");
assert.equal(detectLevel("trace request"), "TRACE");
assert.equal(detectLevel("information only"), "OTHER");
const lines = parseLogs("INFO ready\r\nDEBUG detail\nWARN slow\nERROR failed\nINFO done");
assert.deepEqual(lines[3], { text: "ERROR failed", number: 4, level: "ERROR" });
assert.deepEqual(countLevels(lines), { FATAL: 0, ERROR: 1, WARN: 1, INFO: 2, DEBUG: 1, TRACE: 0, OTHER: 0 });
assert.deepEqual(visibleIndexes(lines, new Set(["ERROR"]), 1), [2, 3, 4]);
assert.deepEqual(visibleIndexes(lines, new Set(["WARN", "ERROR"]), 0), [2, 3]);
assert.deepEqual(textSegments("Timeout TIMEOUT", [{ value: "timeout", type: "search" }]), [
  { text: "Timeout", type: "search" }, { text: " ", type: "plain" }, { text: "TIMEOUT", type: "search" }
]);
assert.equal(parseLogs("").length, 0);
console.log("Log Highlighter tests passed");
