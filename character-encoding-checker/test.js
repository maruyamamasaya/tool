const assert = require("node:assert/strict");
const { analyzeText, codePointLabel } = require("./app.js");

const result = analyzeText("ABC あいう アイ 漢字\n　�\u200b\u0001😀");
assert.equal(result.total, 19);
assert.deepEqual(result.counts, { ascii: 8, hiragana: 3, katakana: 2, kanji: 2, other: 4 });
assert.equal(result.newlines, 1);
assert.equal(result.fullWidthSpaces, 1);
assert.equal(result.replacements, 1);
assert.deepEqual(result.suspicious.map(({ line, name, codePoint }) => ({ line, name, codePoint })), [
  { line: 2, name: "全角スペース", codePoint: "U+3000" },
  { line: 2, name: "�（Unicode置換文字）", codePoint: "U+FFFD" },
  { line: 2, name: "ゼロ幅スペース", codePoint: "U+200B" },
  { line: 2, name: "制御文字", codePoint: "U+0001" }
]);

assert.deepEqual(analyzeText("").counts, { ascii: 0, hiragana: 0, katakana: 0, kanji: 0, other: 0 });
assert.equal(analyzeText("𠮷").counts.kanji, 1);
assert.equal(analyzeText("\t\r\n").suspicious.length, 0);
assert.equal(codePointLabel(0x1f600), "U+1F600");

console.log("All Character Encoding Checker tests passed.");
