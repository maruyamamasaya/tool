"use strict";

function splitLines(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  return normalized === "" ? [] : normalized.split("\n");
}

function matchesCondition(line, condition, ignoreCase) {
  const source = ignoreCase ? line.toLocaleLowerCase() : line;
  const query = ignoreCase ? condition.value.toLocaleLowerCase() : condition.value;
  if (condition.type === "notContains") return !source.includes(query);
  if (condition.type === "startsWith") return source.startsWith(query);
  if (condition.type === "endsWith") return source.endsWith(query);
  if (condition.type === "equals") return source === query;
  return source.includes(query);
}

function filterLines(text, conditions, options = {}) {
  const lines = splitLines(text);
  const activeConditions = conditions.filter((condition) => condition.value !== "");
  const join = options.join === "or" ? "or" : "and";
  const matches = [];
  lines.forEach((line, index) => {
    if (options.ignoreEmpty && line.trim() === "") return;
    if (activeConditions.length === 0) return;
    const results = activeConditions.map((condition) => matchesCondition(line, condition, options.ignoreCase));
    if ((join === "and" && results.every(Boolean)) || (join === "or" && results.some(Boolean))) {
      matches.push({ line, lineNumber: index + 1 });
    }
  });
  return { totalCount: lines.length, matchCount: matches.length, matches };
}

function formatResult(matches, showLineNumbers) {
  return matches.map((match) => showLineNumbers ? `${match.lineNumber}: ${match.line}` : match.line).join("\n");
}

if (typeof document !== "undefined") {
  const elements = {
    input: document.querySelector("#inputText"), output: document.querySelector("#outputText"),
    inputCount: document.querySelector("#inputCount"), resultCount: document.querySelector("#resultCount"),
    summary: document.querySelector("#summary"), list: document.querySelector("#conditionList"),
    template: document.querySelector("#conditionTemplate"), add: document.querySelector("#addCondition"),
    clear: document.querySelector("#clearButton"), copy: document.querySelector("#copyButton"),
    ignoreCase: document.querySelector("#ignoreCase"), ignoreEmpty: document.querySelector("#ignoreEmpty"),
    showLineNumbers: document.querySelector("#showLineNumbers"), status: document.querySelector("#status")
  };
  let statusTimer;

  function conditions() {
    return [...elements.list.querySelectorAll(".condition-row")].map((row) => ({
      type: row.querySelector(".condition-type").value,
      value: row.querySelector(".condition-value").value
    }));
  }

  function render() {
    const join = document.querySelector('input[name="join"]:checked').value;
    const result = filterLines(elements.input.value, conditions(), {
      join, ignoreCase: elements.ignoreCase.checked, ignoreEmpty: elements.ignoreEmpty.checked
    });
    const output = formatResult(result.matches, elements.showLineNumbers.checked);
    elements.output.value = output;
    elements.inputCount.textContent = `${result.totalCount.toLocaleString("ja-JP")} 行`;
    elements.resultCount.textContent = `${result.matchCount.toLocaleString("ja-JP")} 行`;
    elements.copy.disabled = result.matchCount === 0;
    const hasCondition = conditions().some((condition) => condition.value !== "");
    elements.summary.textContent = !elements.input.value || !hasCondition
      ? "テキストと条件を入力してください"
      : `${result.totalCount.toLocaleString("ja-JP")} 行中 ${result.matchCount.toLocaleString("ja-JP")} 行が一致しました`;
  }

  function addCondition(value = "", type = "contains") {
    const row = elements.template.content.firstElementChild.cloneNode(true);
    row.querySelector(".condition-type").value = type;
    row.querySelector(".condition-value").value = value;
    row.querySelector(".remove-condition").addEventListener("click", () => {
      row.remove();
      if (!elements.list.children.length) addCondition();
      render();
    });
    row.addEventListener("input", render);
    row.addEventListener("change", render);
    elements.list.append(row);
    if (value === "" && elements.list.children.length > 1) row.querySelector(".condition-value").focus();
  }

  function showStatus(message) {
    clearTimeout(statusTimer);
    elements.status.textContent = message;
    statusTimer = setTimeout(() => { elements.status.textContent = ""; }, 1800);
  }

  elements.input.addEventListener("input", render);
  document.querySelectorAll('input[name="join"], #ignoreCase, #ignoreEmpty, #showLineNumbers').forEach((item) => item.addEventListener("change", render));
  elements.add.addEventListener("click", () => addCondition());
  elements.clear.addEventListener("click", () => {
    elements.input.value = "";
    elements.list.replaceChildren();
    addCondition(); render(); elements.input.focus(); showStatus("クリアしました");
  });
  elements.copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(elements.output.value); }
    catch { elements.output.select(); document.execCommand("copy"); }
    showStatus("抽出結果をコピーしました");
  });
  addCondition();
  render();
}

if (typeof module !== "undefined") module.exports = { splitLines, matchesCondition, filterLines, formatResult };
