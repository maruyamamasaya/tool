const assert = require("assert");
const { inspect, parseCsv, parseYaml, textStats } = require("./app.js");

assert.deepStrictEqual(parseCsv('name,note\nAlice,"hello, world"\nBob,"a""b"'), [["name", "note"], ["Alice", "hello, world"], ["Bob", 'a"b']]);
assert.deepStrictEqual(parseYaml("active: true\nitems:\n  - 10\n  - null"), { active: true, items: [10, null] });
assert.deepStrictEqual(textStats("abc日本"), { characters: 5, bytes: 9, lines: 1, halfWidth: 3, fullWidth: 2 });

const json = inspect('{"items":[{"name":"A","ok":true,"score":10},{"name":null,"ok":false}]}', "sample.json");
assert.strictEqual(json.format, "JSON");
assert.strictEqual(json.depth, 3);
assert.strictEqual(json.nulls, 1);
assert.strictEqual(json.booleans, 2);
assert.strictEqual(json.strings, 1);
assert.strictEqual(json.numbers, 1);

const csv = inspect("name,age\nAlice,20\nBob,30", "sample.csv");
assert.strictEqual(csv.format, "CSV");
assert.strictEqual(csv.records, 2);

const text = inspect("ＡBC テスト", "note.txt");
assert.strictEqual(text.format, "TEXT");
assert.strictEqual(text.halfWidth, 3);
assert.strictEqual(text.fullWidth, 4);

console.log("Data Inspector tests passed");
