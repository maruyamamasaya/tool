"use strict";

function parseCards(input) {
  const text = String(input || "").replace(/\r\n?/g, "\n").trim();
  if (!text) return [];
  const cards = [];
  let question = "";
  let answer = "";
  let mode = null;
  const push = () => {
    const q = question.trim();
    const a = answer.trim();
    if (q && a) cards.push({ question: q, answer: a });
    question = ""; answer = ""; mode = null;
  };

  text.split("\n").forEach((line) => {
    const qMatch = line.match(/^\s*(?:Q(?:uestion)?|問題|問)\s*[：:]\s*(.*)$/i);
    const aMatch = line.match(/^\s*(?:A(?:nswer)?|答え|回答|解答)\s*[：:]\s*(.*)$/i);
    if (qMatch) { if (question && answer) push(); mode = "q"; question = qMatch[1]; return; }
    if (aMatch) { mode = "a"; answer = aMatch[1]; return; }
    if (!mode) {
      const pair = line.match(/^\s*(.+?)\s*(?:\t+|\s+::\s+)\s*(.+?)\s*$/);
      if (pair) cards.push({ question: pair[1].trim(), answer: pair[2].trim() });
      return;
    }
    if (!line.trim() && question && answer) { push(); return; }
    if (line.trim()) {
      if (mode === "q") question += `${question ? "\n" : ""}${line.trim()}`;
      else answer += `${answer ? "\n" : ""}${line.trim()}`;
    }
  });
  if (question && answer) push();
  return cards;
}

function shuffleCards(cards, random = Math.random) {
  const copy = cards.map((card) => ({ ...card }));
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function formatCards(cards) {
  return cards.map((card) => `Q: ${card.question}\nA: ${card.answer}`).join("\n\n");
}

function summarize(results) {
  const answered = results.length;
  const correct = results.filter((result) => result.correct).length;
  return { answered, correct, wrong: answered - correct, accuracy: answered ? Math.round(correct / answered * 100) : 0 };
}

if (typeof document !== "undefined") {
  const get = (id) => document.getElementById(id);
  const views = { setup: get("setupView"), study: get("studyView"), result: get("resultView") };
  let deck = [];
  let index = 0;
  let results = [];
  let revealed = false;

  function showView(name) {
    Object.entries(views).forEach(([key, view]) => { view.hidden = key !== name; });
  }

  function renderCard() {
    const card = deck[index];
    revealed = false;
    get("studyTitle").textContent = card.question;
    get("answerText").textContent = card.answer;
    get("answerArea").hidden = true;
    get("revealButton").hidden = false;
    get("judgeActions").hidden = true;
    get("flashCard").classList.remove("revealed");
    get("progressText").textContent = `${index + 1} / ${deck.length}`;
    get("scoreText").textContent = `正解 ${results.filter((result) => result.correct).length}`;
    const percent = Math.round(index / deck.length * 100);
    get("progressBar").style.width = `${percent}%`;
    document.querySelector(".progress-track").setAttribute("aria-valuenow", percent);
    get("studyTitle").focus();
  }

  function begin(cards) {
    deck = cards; index = 0; results = [];
    showView("study"); renderCard();
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    get("answerArea").hidden = false;
    get("revealButton").hidden = true;
    get("judgeActions").hidden = false;
    get("flashCard").classList.add("revealed");
    get("wrongButton").focus();
  }

  function judge(correct) {
    if (!revealed) return;
    results.push({ ...deck[index], correct });
    index += 1;
    if (index >= deck.length) finish(false);
    else renderCard();
  }

  function finish(stopped) {
    const summary = summarize(results);
    const wrongCards = results.filter((result) => !result.correct);
    get("resultState").textContent = stopped ? "途中終了" : "完了";
    get("accuracyText").textContent = `${summary.accuracy}%`;
    get("rateBar").style.width = `${summary.accuracy}%`;
    get("answeredText").textContent = `${summary.answered}問`;
    get("correctText").textContent = `${summary.correct}問`;
    get("wrongText").textContent = `${summary.wrong}問`;
    get("wrongOutput").value = formatCards(wrongCards);
    get("wrongSection").hidden = wrongCards.length === 0;
    get("perfectMessage").hidden = wrongCards.length !== 0;
    get("retryButton").hidden = wrongCards.length === 0;
    get("copyStatus").textContent = "";
    showView("result");
    get("resultTitle").focus();
  }

  get("sampleButton").addEventListener("click", () => {
    get("qaInput").value = "Q: 日本の首都は？\nA: 東京\n\nQ: 水の化学式は？\nA: H2O\n\nQ: 世界で最も面積が大きい国は？\nA: ロシア";
    get("inputError").textContent = ""; get("qaInput").focus();
  });
  get("startButton").addEventListener("click", () => {
    const cards = parseCards(get("qaInput").value);
    if (!cards.length) { get("inputError").textContent = "QとAの組み合わせを1問以上入力してください。"; get("qaInput").focus(); return; }
    get("inputError").textContent = "";
    begin(get("shuffleInput").checked ? shuffleCards(cards) : cards);
  });
  get("revealButton").addEventListener("click", reveal);
  get("wrongButton").addEventListener("click", () => judge(false));
  get("correctButton").addEventListener("click", () => judge(true));
  get("stopButton").addEventListener("click", () => finish(true));
  get("newDeckButton").addEventListener("click", () => { showView("setup"); get("qaInput").focus(); });
  get("retryButton").addEventListener("click", () => begin(results.filter((result) => !result.correct).map(({ question, answer }) => ({ question, answer }))));
  get("copyButton").addEventListener("click", async () => {
    const text = get("wrongOutput").value;
    try { await navigator.clipboard.writeText(text); }
    catch { get("wrongOutput").select(); document.execCommand("copy"); }
    get("copyStatus").textContent = "コピーしました。入力欄に貼り付けて繰り返し使えます。";
  });
  document.addEventListener("keydown", (event) => {
    if (views.study.hidden || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === "Space" && !revealed) { event.preventDefault(); reveal(); }
    else if (revealed && event.key === "1") judge(false);
    else if (revealed && event.key === "2") judge(true);
  });
}

if (typeof module !== "undefined") module.exports = { parseCards, shuffleCards, formatCards, summarize };
