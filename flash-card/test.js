"use strict";
const assert = require("assert");
const { parseCards, shuffleCards, formatCards, summarize } = require("./app.js");

assert.deepStrictEqual(parseCards("Q: 首都は？\nA: 東京\n\nQ： 1+1\nA： 2"), [
  { question: "首都は？", answer: "東京" }, { question: "1+1", answer: "2" }
]);
assert.deepStrictEqual(parseCards("Q: 説明せよ\n補足の質問\nA: 1行目\n2行目"), [
  { question: "説明せよ\n補足の質問", answer: "1行目\n2行目" }
]);
assert.deepStrictEqual(parseCards("日本\t東京\nフランス :: パリ"), [
  { question: "日本", answer: "東京" }, { question: "フランス", answer: "パリ" }
]);
assert.deepStrictEqual(parseCards("Q: 答えなし"), []);
assert.strictEqual(formatCards([{ question: "Q1", answer: "A1" }, { question: "Q2", answer: "A2" }]), "Q: Q1\nA: A1\n\nQ: Q2\nA: A2");
assert.deepStrictEqual(summarize([{ correct: true }, { correct: false }, { correct: true }]), { answered: 3, correct: 2, wrong: 1, accuracy: 67 });
assert.deepStrictEqual(summarize([]), { answered: 0, correct: 0, wrong: 0, accuracy: 0 });
assert.deepStrictEqual(shuffleCards([{ question: "1", answer: "a" }, { question: "2", answer: "b" }], () => 0).map((card) => card.question), ["2", "1"]);
console.log("Flash Card tests passed");
