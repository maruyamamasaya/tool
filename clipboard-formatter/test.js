"use strict";
const assert = require("node:assert/strict");
const { parseDelimited, detectAndParse, formatRows } = require("./app.js");

assert.deepEqual(detectAndParse("1001\t山田太郎\t営業部\n1002\t佐藤花子\t開発部"), { delimiter: "tab", rows: [["1001", "山田太郎", "営業部"], ["1002", "佐藤花子", "開発部"]] });
assert.deepEqual(parseDelimited('1,"姓, 名"\n2,"a""b"', ","), [["1", "姓, 名"], ["2", 'a"b']]);
assert.equal(formatRows([[" 1 ", "営業部"], [" 1 ", "営業部"]], { trim: true, empty: false, duplicate: true, spaces: false, format: "comma", quote: "double" }), '"1","営業部"');
assert.equal(formatRows([["1001"], ["O'Reilly"]], { trim: false, empty: false, duplicate: false, spaces: false, format: "sql-in", quote: "" }), "IN ('1001','O''Reilly')");
assert.equal(formatRows([["A", "B"], ["1", "2"]], { trim: false, empty: false, duplicate: false, spaces: false, format: "markdown", quote: "" }), "| A | B |\n| --- | --- |\n| 1 | 2 |");
console.log("Clipboard Formatter tests passed");
