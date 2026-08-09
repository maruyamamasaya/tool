"use strict";

function parseList(text, options = {}) {
  if (String(text) === "") return [];
  const seen = new Set();
  const items = [];
  String(text).replace(/\r\n?/g, "\n").split("\n").forEach((raw) => {
    const value = options.trimItems === false ? raw : raw.trim();
    if (options.ignoreEmpty !== false && value === "") return;
    const key = options.ignoreCase ? value.toLocaleLowerCase() : value;
    if (!seen.has(key)) {
      seen.add(key);
      items.push({ value, key });
    }
  });
  return items;
}

function compareLists(aText, bText, options = {}) {
  const a = parseList(aText, options);
  const b = parseList(bText, options);
  const aKeys = new Set(a.map((item) => item.key));
  const bKeys = new Set(b.map((item) => item.key));
  return {
    aCount: a.length,
    bCount: b.length,
    common: a.filter((item) => bKeys.has(item.key)).map((item) => item.value),
    onlyA: a.filter((item) => !bKeys.has(item.key)).map((item) => item.value),
    onlyB: b.filter((item) => !aKeys.has(item.key)).map((item) => item.value)
  };
}

if (typeof document !== "undefined") {
  const elements = {
    a: document.querySelector("#aInput"), b: document.querySelector("#bInput"),
    aCount: document.querySelector("#aCount"), bCount: document.querySelector("#bCount"),
    common: document.querySelector("#commonOutput"), onlyA: document.querySelector("#onlyAOutput"), onlyB: document.querySelector("#onlyBOutput"),
    commonCount: document.querySelector("#commonCount"), onlyACount: document.querySelector("#onlyACount"), onlyBCount: document.querySelector("#onlyBCount"),
    trim: document.querySelector("#trimItems"), ignoreCase: document.querySelector("#ignoreCase"), ignoreEmpty: document.querySelector("#ignoreEmpty"),
    summary: document.querySelector("#summary"), status: document.querySelector("#status"), clear: document.querySelector("#clearButton")
  };
  let statusTimer;

  function render() {
    const result = compareLists(elements.a.value, elements.b.value, { trimItems: elements.trim.checked, ignoreCase: elements.ignoreCase.checked, ignoreEmpty: elements.ignoreEmpty.checked });
    [[elements.common, result.common], [elements.onlyA, result.onlyA], [elements.onlyB, result.onlyB]].forEach(([output, values]) => { output.value = values.join("\n"); });
    elements.aCount.textContent = `${result.aCount.toLocaleString("ja-JP")} 件`;
    elements.bCount.textContent = `${result.bCount.toLocaleString("ja-JP")} 件`;
    elements.commonCount.textContent = result.common.length.toLocaleString("ja-JP");
    elements.onlyACount.textContent = result.onlyA.length.toLocaleString("ja-JP");
    elements.onlyBCount.textContent = result.onlyB.length.toLocaleString("ja-JP");
    document.querySelectorAll(".copy").forEach((button) => { button.disabled = document.querySelector(`#${button.dataset.target}`).value === ""; });
    elements.summary.textContent = !elements.a.value && !elements.b.value ? "リストを入力するとここに結果が表示されます" : `共通 ${result.common.length} 件 ・ Aのみ ${result.onlyA.length} 件 ・ Bのみ ${result.onlyB.length} 件`;
  }

  function showStatus(message) {
    clearTimeout(statusTimer); elements.status.textContent = message;
    statusTimer = setTimeout(() => { elements.status.textContent = ""; }, 1800);
  }

  [elements.a, elements.b].forEach((input) => input.addEventListener("input", render));
  [elements.trim, elements.ignoreCase, elements.ignoreEmpty].forEach((option) => option.addEventListener("change", render));
  elements.clear.addEventListener("click", () => { elements.a.value = ""; elements.b.value = ""; render(); elements.a.focus(); showStatus("クリアしました"); });
  document.querySelectorAll(".copy").forEach((button) => button.addEventListener("click", async () => {
    const output = document.querySelector(`#${button.dataset.target}`);
    try { await navigator.clipboard.writeText(output.value); } catch { output.select(); document.execCommand("copy"); }
    showStatus(`${button.closest(".result-card").querySelector("h3").childNodes[1].textContent.trim()} をコピーしました`);
  }));
  render();
}

if (typeof module !== "undefined") module.exports = { parseList, compareLists };
