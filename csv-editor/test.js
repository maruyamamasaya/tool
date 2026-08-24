"use strict";
const assert = require("assert");
const { parseCsv, escapeCsvCell, toCsv, safeFileName } = require("./app.js");

assert.deepStrictEqual(parseCsv("a,b\r\n1,2"), [["a", "b"], ["1", "2"]]);
assert.deepStrictEqual(parseCsv('\ufeffname,note\nA,"one, two"\nB,"line\nnext"'), [["name", "note"], ["A", "one, two"], ["B", "line\nnext"]]);
assert.deepStrictEqual(parseCsv("a,b\nx"), [["a", "b"], ["x", ""]]);
assert.throws(() => parseCsv('a,"b'), /引用符/);
assert.throws(() => parseCsv("  "), /入力/);
assert.strictEqual(escapeCsvCell('say "hi"'), '"say ""hi"""');
assert.strictEqual(toCsv([["a,b", "line\n2"], ["x", "y"]]), '"a,b","line\n2"\r\nx,y');
assert.strictEqual(safeFileName(" report.csv "), "report");
assert.strictEqual(safeFileName("a/b?.txt"), "a_b_");
console.log("csv-editor tests passed");
