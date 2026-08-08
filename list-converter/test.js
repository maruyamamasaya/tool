const assert = require("node:assert/strict");
const { splitLines, splitItems, processItems, formatItems, convertList } = require("./app.js");

assert.deepEqual(splitLines("a\r\nb\rc\n"), ["a", "b", "c", ""]);
assert.deepEqual(splitItems("apple, banana,orange", "comma"), ["apple", " banana", "orange"]);
assert.deepEqual(splitItems('"Tokyo, Japan",Osaka', "comma"), ["Tokyo, Japan", "Osaka"]);
assert.deepEqual(splitItems("apple\tbanana\torange", "auto"), ["apple", "banana", "orange"]);
assert.deepEqual(splitItems("apple;banana;orange", "semicolon"), ["apple", "banana", "orange"]);
assert.deepEqual(splitItems("apple / banana / orange", "custom", " / "), ["apple", "banana", "orange"]);
assert.deepEqual(splitItems('["apple","banana"]', "json"), ["apple", "banana"]);
assert.deepEqual(splitItems("New York Los Angeles", "auto"), ["New York Los Angeles"]);
assert.deepEqual(processItems(" apple \n\nbanana\napple", { trimWhitespace: true, removeEmpty: true, removeDuplicates: true }), ["apple", "banana"]);
assert.deepEqual(processItems("item10\nitem2\nitem1", { sort: "ascending" }), ["item1", "item2", "item10"]);
assert.deepEqual(processItems("a\nc\nb", { sort: "descending", prefix: "ID_", suffix: "_x" }), ["ID_c_x", "ID_b_x", "ID_a_x"]);
assert.equal(formatItems(["aaa", "bbb"], "comma-space"), "aaa, bbb");
assert.equal(formatItems(["O'Reilly", "book"], "single-quote"), "'O''Reilly','book'");
assert.equal(formatItems(["a\"b", "c"], "double-quote"), '"a\\\"b","c"');
assert.equal(formatItems(["O'Reilly"], "sql-in"), "IN ('O''Reilly')");
assert.equal(formatItems(["a\"b", "line\nbreak"], "json"), '["a\\\"b","line\\nbreak"]');
assert.deepEqual(convertList(" apple \nbanana", { trimWhitespace: true, prefix: "ID_", format: "newline" }), { items: ["ID_apple", "ID_banana"], output: "ID_apple\nID_banana" });
assert.deepEqual(convertList(" apple, banana,apple ", { inputFormat: "comma", trimWhitespace: true, removeDuplicates: true, format: "newline" }), { items: ["apple", "banana"], output: "apple\nbanana" });

console.log("All List Converter tests passed.");
