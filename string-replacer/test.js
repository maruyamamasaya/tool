const assert = require("node:assert/strict");
const { applyRules, findMatches, parseRules, replaceAll } = require("./app.js");

assert.equal(findMatches("apple\napple_test\nbanana\napple123", "apple").length, 3);
assert.equal(replaceAll("Apple apple", "apple", "orange").result, "orange orange");
assert.equal(replaceAll("Apple apple", "apple", "orange", { caseSensitive: true }).count, 1);
assert.equal(replaceAll("apple\napple_test", "apple", "x", { exactMatch: true }).result, "x\napple_test");
assert.equal(replaceAll("a\nb", "a.b", "ok", { useRegex: true, dotAll: true }).result, "ok");
assert.equal(replaceAll("$5 and $5", "$5", "$10").result, "$10 and $10");
assert.deepEqual(parseRules("apple => orange\nbanana => grape\n"), [{ search: "apple", replacement: "orange" }, { search: "banana", replacement: "grape" }]);
assert.deepEqual(applyRules("apple banana test", parseRules("apple => orange\nbanana => grape\ntest => sample")), { result: "orange grape sample", count: 3 });
assert.equal(applyRules("aa bb aa", [{ search: "aa", replacement: "" }, { search: "bb", replacement: "" }]).result, "  ");
assert.throws(() => parseRules("invalid"), /=>/);
assert.throws(() => findMatches("text", "[", { useRegex: true }), /正規表現/);

console.log("All String Replacer tests passed.");
