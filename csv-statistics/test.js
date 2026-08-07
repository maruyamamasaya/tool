"use strict";
const assert = require("node:assert/strict");
const { parseCsv, getNullValues, inferType, analyzeCsv, formatResults } = require("./app.js");

const parsed = parseCsv('id,name,note,score\n1,Tanaka,"Tokyo, Japan",10\n2,Sato,"said ""hello""",NULL\n3,Tanaka,"line 1\nline 2",30\n3,Tanaka,"line 1\nline 2",30\n');
assert.equal(parsed.length, 5);
assert.equal(parsed[1][2], "Tokyo, Japan");
assert.equal(parsed[2][2], 'said "hello"');
assert.equal(parsed[3][2], "line 1\nline 2");

const analysis = analyzeCsv(parsed, getNullValues("\nNULL\nnull\nN/A"));
assert.equal(analysis.rows.length, 4);
assert.equal(analysis.duplicates, 1);
assert.equal(analysis.totalNulls, 1);
assert.equal(analysis.columns[0].type, "Number");
assert.deepEqual(analysis.columns[0].numeric, { count: 4, min: 1, max: 3, mean: 2.25, median: 2.5 });
assert.equal(analysis.columns[1].unique, 2);
assert.equal(inferType(["true", "FALSE"]), "Boolean");
assert.equal(inferType(["2026-08-07", "2025/01/02"]), "Date");
assert.match(formatResults(analysis), /数値カラム/);
assert.throws(() => parseCsv("a,b\n1"), /列数/);
assert.throws(() => parseCsv('a,b\n"open,2'), /閉じられていません/);
assert.throws(() => parseCsv("a,b"), /データ行/);
assert.throws(() => parseCsv("a,\n1,2"), /ヘッダー名/);
console.log("csv-statistics tests passed");
