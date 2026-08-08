const assert = require("assert");
const { shuffle, generateCard, getWinningLines, ballLetter } = require("./app.js");

const card = generateCard(() => 0.42);
assert.strictEqual(card.length, 5);
assert.strictEqual(card[2][2], null);
for (let col = 0; col < 5; col += 1) {
  const values = card.map((row) => row[col]).filter((value) => value !== null);
  assert.strictEqual(new Set(values).size, values.length);
  assert(values.every((value) => value >= col * 15 + 1 && value <= col * 15 + 15));
}
assert.deepStrictEqual(shuffle([1, 2, 3], () => 0), [2, 3, 1]);
assert.strictEqual(ballLetter(1), "B");
assert.strictEqual(ballLetter(42), "N");
assert.strictEqual(ballLetter(75), "O");

const fixed = [
  [1, 16, 31, 46, 61], [2, 17, 32, 47, 62], [3, 18, null, 48, 63],
  [4, 19, 34, 49, 64], [5, 20, 35, 50, 65]
];
assert.strictEqual(getWinningLines(fixed, new Set([1, 16, 31, 46, 61])).length, 1);
assert.strictEqual(getWinningLines(fixed, new Set([1, 17, 49, 65])).length, 1);
assert.strictEqual(getWinningLines(fixed, new Set([1, 17])).length, 0);
console.log("bingo-simulator tests passed");
