"use strict";

function escapeText(value) {
  const replacements = { "\n": "\\n", "\t": "\\t", "\r": "\\r", "\\": "\\\\", '"': '\\"', "\0": "\\0" };
  return [...String(value)].map((character) => replacements[character] ?? character).join("");
}

function restoreText(value) {
  const text = String(value);
  const replacements = { n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"', "0": "\0" };
  let result = "";
  let invalidCount = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== "\\" || index === text.length - 1) {
      result += text[index];
      if (text[index] === "\\") invalidCount += 1;
      continue;
    }
    const escaped = text[index + 1];
    if (Object.hasOwn(replacements, escaped)) {
      result += replacements[escaped];
      index += 1;
    } else {
      result += `\\${escaped}`;
      invalidCount += 1;
      index += 1;
    }
  }
  return { text: result, invalidCount };
}

function visualizeText(value) {
  const replacements = { " ": "·", "\u3000": "□", "\t": "→", "\r": "␍", "\0": "␀" };
  return [...String(value)].map((character) => character === "\n" ? "↵\n" : (replacements[character] ?? character)).join("");
}

if (typeof document !== "undefined") {
  const input = document.querySelector("#textInput");
  const result = document.querySelector("#result");
  const inputCount = document.querySelector("#inputCount");
  const resultCount = document.querySelector("#resultCount");
  const resultLabel = document.querySelector("#resultLabel");
  const warning = document.querySelector("#warning");
  const copyButton = document.querySelector("#copyButton");
  const clearButton = document.querySelector("#clearButton");
  const status = document.querySelector("#status");
  const tabs = [...document.querySelectorAll(".tab")];
  let mode = "escape";
  let copyValue = "";
  let statusTimer;

  function countCharacters(text) { return [...text].length.toLocaleString("ja-JP"); }

  function update() {
    const value = input.value;
    let output = "";
    let invalidCount = 0;
    if (mode === "escape") output = escapeText(value);
    if (mode === "restore") ({ text: output, invalidCount } = restoreText(value));
    if (mode === "visualize") output = visualizeText(value);

    result.classList.toggle("visualized", mode === "visualize");
    result.textContent = output;
    if (!value) result.innerHTML = '<span class="placeholder">変換結果がここに表示されます</span>';
    copyValue = mode === "visualize" ? value : output;
    inputCount.textContent = `${countCharacters(value)} 文字`;
    resultCount.textContent = `${countCharacters(copyValue)} 文字`;
    warning.hidden = invalidCount === 0;
    warning.textContent = invalidCount ? `⚠ 解釈できないエスケープを ${invalidCount} 件、そのまま残しました。` : "";
    copyButton.disabled = !value;
    clearButton.disabled = !value;
    status.textContent = "";
  }

  function changeMode(nextMode) {
    mode = nextMode;
    const labels = { escape: "エスケープ結果", restore: "復元結果", visualize: "可視化結果" };
    resultLabel.textContent = labels[mode];
    tabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    update();
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => changeMode(tab.dataset.mode)));
  input.addEventListener("input", update);
  clearButton.addEventListener("click", () => { input.value = ""; update(); input.focus(); });
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = copyValue;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.append(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    clearTimeout(statusTimer);
    status.textContent = mode === "visualize" ? "元のテキストをコピーしました" : "結果をコピーしました";
    statusTimer = setTimeout(() => { status.textContent = ""; }, 1800);
  });
  update();
}

if (typeof module !== "undefined") module.exports = { escapeText, restoreText, visualizeText };
