const assert = require("node:assert/strict");
const { splitLines, naturalCompare, parseWholeNumber, sortLines } = require("./app.js");

assert.deepEqual(splitLines("a\r\nb\rc\n"), ["a", "b", "c", ""]);
assert.deepEqual(splitLines(""), []);

assert.deepEqual(sortLines("10_abc\n2_xyz\n9_zzz\n1_test\n9_abc"), [
  "1_test", "2_xyz", "9_abc", "9_zzz", "10_abc"
]);
assert.deepEqual(sortLines("010_abc\n002_abc\n9_abc\n001_abc"), [
  "001_abc", "002_abc", "9_abc", "010_abc"
]);
assert.deepEqual(sortLines("server10\nserver2\nserver1\nserver20"), [
  "server1", "server2", "server10", "server20"
]);
assert.deepEqual(sortLines("file1.txt\nfile10.txt\nfile2.txt\nfile20.txt"), [
  "file1.txt", "file2.txt", "file10.txt", "file20.txt"
]);
assert.deepEqual(sortLines("100\n20\n3\n45", { mode: "number-asc" }), ["3", "20", "45", "100"]);
assert.deepEqual(sortLines("100\n20\n3\n45", { mode: "number-desc" }), ["100", "45", "20", "3"]);
assert.deepEqual(sortLines("  b  \n a\n  c", { mode: "alpha-asc" }), [" a", "  b  ", "  c"]);
assert.deepEqual(sortLines("b\n\na\n   ", { mode: "alpha-asc" }), ["a", "b", "", "   "]);
assert.deepEqual(sortLines("b\na\nb", { removeDuplicates: true }), ["a", "b"]);
assert.deepEqual(sortLines("item9007199254740993\nitem9007199254740992"), [
  "item9007199254740992", "item9007199254740993"
]);
assert.equal(naturalCompare("02", "2"), 0);
assert.equal(parseWholeNumber(" -2.5e2 "), -250);
assert.equal(parseWholeNumber("12px"), null);

console.log("All Line Sorter tests passed.");
