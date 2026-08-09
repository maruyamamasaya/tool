"use strict";
const assert = require("assert");
const { normalizeTable, toMarkdown, toHtml, toCsv, convert } = require("./app.js");

assert.deepStrictEqual(normalizeTable([["a"], ["b", "c"]]), [["a", ""], ["b", "c"]]);
assert.strictEqual(toMarkdown([["A", "B"], ["x|y", "2"]]), "| A | B |\n| :--- | :--- |\n| x\\|y | 2 |");
assert.strictEqual(toMarkdown([["a", "b"]], false, "center"), "|  |  |\n| :---: | :---: |\n| a | b |");
assert(toHtml([["<name>"], ["A&B"]]).includes("&lt;name&gt;"));
assert.strictEqual(toCsv([["a,b", 'say "hi"'], ["line\n2", "ok"]]), '"a,b","say ""hi"""\r\n"line\n2",ok');
assert.strictEqual(convert([["a"]], "csv", true, "left"), "a");
console.log("table-builder tests passed");
