(function () {
  "use strict";

  function parseQuiz(value) {
    const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
    const questions = []; const errors = []; let current = null;
    function finish() {
      if (!current) return;
      const correct = current.choices.filter((choice) => choice.correct).length;
      if (!current.text) errors.push("問題文が空です");
      else if (current.choices.length < 2) errors.push(`「${current.text}」の選択肢は2つ以上必要です`);
      else if (correct !== 1) errors.push(`「${current.text}」の正解（*）は1つ指定してください`);
      else questions.push(current);
      current = null;
    }
    lines.forEach((raw) => {
      const line = raw.trim();
      if (/^Q\s*[:：]/i.test(line)) { finish(); current = { text: line.replace(/^Q\s*[:：]\s*/i, ""), choices: [] }; }
      else if (/^[-*]\s+/.test(line)) {
        if (!current) errors.push("選択肢の前に Q: で問題を入力してください");
        else current.choices.push({ text: line.slice(1).trim(), correct: line[0] === "*" });
      } else if (line && current) current.text += ` ${line}`;
      else if (line) errors.push(`形式を確認してください: ${line}`);
    });
    finish();
    return { questions, errors };
  }

  function serializeQuiz(questions) {
    return questions.map((question) => [`Q: ${question.text}`, ...question.choices.map((choice) => `${choice.correct ? "*" : "-"} ${choice.text}`)].join("\n")).join("\n\n");
  }

  function shuffle(values, random = Math.random) {
    const copy = values.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) { const target = Math.floor(random() * (index + 1)); [copy[index], copy[target]] = [copy[target], copy[index]]; }
    return copy;
  }

  function calculateResult(answers) {
    const correct = answers.filter((answer) => answer.correct).length;
    return { correct, total: answers.length, percentage: answers.length ? Math.round((correct / answers.length) * 100) : 0, wrong: answers.filter((answer) => !answer.correct).map((answer) => answer.question) };
  }

  if (typeof module !== "undefined") module.exports = { parseQuiz, serializeQuiz, shuffle, calculateResult };
  if (typeof document === "undefined") return;

  const $ = (selector) => document.querySelector(selector); let session = null;
  function show(name) { ["editor", "quiz", "result"].forEach((id) => { $(`#${id}`).hidden = id !== name; }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function updateStatus() { const parsed = parseQuiz($("#source").value); $("#parseStatus").textContent = parsed.errors.length ? `${parsed.questions.length}問を検出（修正が必要です）` : `${parsed.questions.length}問を検出しました`; $("#parseStatus").classList.toggle("invalid", !!parsed.errors.length); }
  function startQuiz() {
    const parsed = parseQuiz($("#source").value);
    if (parsed.errors.length || !parsed.questions.length) { $("#inputError").textContent = parsed.errors[0] || "問題を1問以上入力してください"; $("#inputError").hidden = false; return; }
    $("#inputError").hidden = true; session = { questions: shuffle(parsed.questions), index: 0, answers: [], answered: false }; show("quiz"); renderQuestion();
  }
  function renderQuestion() {
    const question = session.questions[session.index]; session.answered = false;
    $("#progressText").textContent = `${session.index + 1} / ${session.questions.length}`; $("#progressBar").style.width = `${(session.index / session.questions.length) * 100}%`; $("#question").textContent = question.text;
    $("#choices").innerHTML = ""; shuffle(question.choices).forEach((choice, index) => { const button = document.createElement("button"); button.type = "button"; button.className = "choice"; button.innerHTML = `<span>${String.fromCharCode(65 + index)}</span><b></b>`; button.querySelector("b").textContent = choice.text; button.addEventListener("click", () => answer(choice, button)); $("#choices").appendChild(button); });
    $("#feedback").hidden = true; $("#next").hidden = true;
  }
  function answer(choice, button) {
    if (session.answered) return; session.answered = true; const question = session.questions[session.index]; session.answers.push({ question, correct: choice.correct });
    $("#choices").querySelectorAll("button").forEach((item) => { item.disabled = true; const text = item.querySelector("b").textContent; const original = question.choices.find((candidate) => candidate.text === text); if (original.correct) item.classList.add("correct"); });
    if (!choice.correct) button.classList.add("wrong"); $("#feedback").textContent = choice.correct ? "正解！" : `不正解　正解は「${question.choices.find((item) => item.correct).text}」`; $("#feedback").className = `feedback ${choice.correct ? "good" : "bad"}`; $("#feedback").hidden = false; $("#next").textContent = session.index === session.questions.length - 1 ? "結果を見る →" : "次の問題へ →"; $("#next").hidden = false; $("#progressBar").style.width = `${((session.index + 1) / session.questions.length) * 100}%`;
  }
  function finish(stopped) {
    const result = calculateResult(session.answers); $("#scoreValue").textContent = `${result.percentage}%`; $("#scoreDetail").textContent = `${result.total}問中 ${result.correct}問正解`; $("#finishReason").textContent = stopped ? `全${session.questions.length}問のうち${result.total}問に回答して終了` : "最後まで完了しました";
    $("#wrongText").value = serializeQuiz(result.wrong); $("#wrongPanel").hidden = !result.wrong.length; $("#perfect").hidden = !!result.wrong.length; $("#retryWrong").hidden = !result.wrong.length; show("result");
  }
  $("#source").addEventListener("input", updateStatus); $("#start").addEventListener("click", startQuiz); $("#stop").addEventListener("click", () => finish(true));
  $("#next").addEventListener("click", () => { if (session.index + 1 >= session.questions.length) finish(false); else { session.index += 1; renderQuestion(); } });
  $("#back").addEventListener("click", () => show("editor")); $("#retryWrong").addEventListener("click", () => { $("#source").value = $("#wrongText").value; updateStatus(); startQuiz(); });
  $("#copy").addEventListener("click", async () => { await navigator.clipboard.writeText($("#wrongText").value); $("#copy").textContent = "コピーしました"; setTimeout(() => { $("#copy").textContent = "コピー"; }, 1500); }); updateStatus();
}());
