const assert = require("assert");
const { detectFormat, parseDelimited, parseItems, pick } = require("./app.js");

assert.deepStrictEqual(parseItems("りんご\n- バナナ\n3. みかん"), ["りんご", "バナナ", "みかん"]);
assert.deepStrictEqual(parseItems('"東京, 日本",大阪,福岡', "comma"), ["東京, 日本", "大阪", "福岡"]);
assert.deepStrictEqual(parseItems('["赤", "青", "赤"]'), ["赤", "青"]);
assert.deepStrictEqual(parseItems("A\tB\tA", "auto", false), ["A", "B", "A"]);
assert.deepStrictEqual(parseDelimited('"a""b",c', ","), ['a"b', "c"]);
assert.strictEqual(detectFormat("a,b,c"), "comma");
assert.strictEqual(pick(["a", "b", "c"], () => 0.5), "b");
assert.throws(() => pick([]), /候補/);
console.log("random picker tests passed");
