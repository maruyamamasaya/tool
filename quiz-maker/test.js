const assert = require("node:assert/strict");
const { parseQuiz, serializeQuiz, shuffle, calculateResult } = require("./app.js");

const source = `Q: 首都は？\n- 大阪\n* 東京\n- 京都\n\nQ: 2 + 2 は？\n- 3\n* 4`;
const parsed = parseQuiz(source);
assert.equal(parsed.errors.length, 0);
assert.equal(parsed.questions.length, 2);
assert.equal(parsed.questions[0].choices[1].correct, true);
assert.equal(serializeQuiz(parsed.questions), source);

const invalid = parseQuiz("Q: 正解なし\n- A\n- B");
assert.equal(invalid.questions.length, 0);
assert.match(invalid.errors[0], /正解/);

assert.deepEqual(shuffle([1, 2, 3], () => 0), [2, 3, 1]);
assert.deepEqual(calculateResult([{ correct: true, question: parsed.questions[0] }, { correct: false, question: parsed.questions[1] }]), { correct: 1, total: 2, percentage: 50, wrong: [parsed.questions[1]] });
assert.equal(calculateResult([]).percentage, 0);
console.log("quiz-maker tests passed");
