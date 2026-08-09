const assert = require("node:assert/strict");
const { splitLines, findDuplicates, duplicateText } = require("./app.js");

assert.deepEqual(splitLines("a\r\nb\rc\n"), ["a", "b", "c", ""]);
assert.deepEqual(findDuplicates("apple\nbanana\napple", { ignoreEmpty: true }), {
  lineCount: 3, totalCount: 3, uniqueCount: 2, duplicateGroupCount: 1, duplicateLineCount: 1,
  duplicates: [{ value: "apple", count: 2, lineNumbers: [1, 3] }]
});
assert.deepEqual(findDuplicates(" Apple \napple\nAPPLE", { trimWhitespace: true, ignoreCase: true }), {
  lineCount: 3, totalCount: 3, uniqueCount: 1, duplicateGroupCount: 1, duplicateLineCount: 2,
  duplicates: [{ value: "Apple", count: 3, lineNumbers: [1, 2, 3] }]
});
assert.equal(findDuplicates("a\n\n\na", { ignoreEmpty: true }).totalCount, 2);
assert.deepEqual(findDuplicates("a\n\n\na", { ignoreEmpty: false }).duplicates.map((item) => item.value), ["a", ""]);
assert.equal(findDuplicates("a\nA", { ignoreCase: false }).duplicateGroupCount, 0);
assert.equal(duplicateText([{ value: "apple" }, { value: "banana" }]), "apple\nbanana");

console.log("All Duplicate Finder tests passed.");
