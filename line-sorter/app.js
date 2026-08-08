"use strict";

const textCollator = new Intl.Collator("ja", { sensitivity: "base" });

function splitLines(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  return normalized === "" ? [] : normalized.split("\n");
}

function compareDigitChunks(a, b) {
  const left = a.replace(/^0+/, "") || "0";
  const right = b.replace(/^0+/, "") || "0";
  if (left.length !== right.length) return left.length - right.length;
  return left < right ? -1 : left > right ? 1 : 0;
}

function naturalCompare(leftValue, rightValue) {
  const left = String(leftValue).trim();
  const right = String(rightValue).trim();
  const leftParts = left.match(/\d+|\D+/g) || [];
  const rightParts = right.match(/\d+|\D+/g) || [];
  const length = Math.min(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const a = leftParts[index];
    const b = rightParts[index];
    const aIsNumber = /^\d+$/.test(a);
    const bIsNumber = /^\d+$/.test(b);
    let comparison;
    if (aIsNumber && bIsNumber) comparison = compareDigitChunks(a, b);
    else comparison = textCollator.compare(a, b);
    if (comparison !== 0) return comparison;
  }
  return leftParts.length - rightParts.length;
}

function parseWholeNumber(value) {
  const trimmed = String(value).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

function createComparator(mode) {
  const descending = mode.endsWith("-desc");
  const direction = descending ? -1 : 1;
  const kind = mode.replace(/-(?:asc|desc)$/, "");

  return (left, right) => {
    const a = left.value.trim();
    const b = right.value.trim();
    let comparison = 0;
    if (kind === "natural") comparison = naturalCompare(a, b);
    else if (kind === "number") {
      const aNumber = parseWholeNumber(a);
      const bNumber = parseWholeNumber(b);
      if (aNumber !== null && bNumber !== null) comparison = aNumber - bNumber;
      else if (aNumber !== null) comparison = -1;
      else if (bNumber !== null) comparison = 1;
      else comparison = textCollator.compare(a, b);
    } else comparison = textCollator.compare(a, b);
    return comparison * direction || left.index - right.index;
  };
}

function sortLines(text, options = {}) {
  const mode = options.mode || "natural-asc";
  const emptyLast = options.emptyLast !== false;
  const removeDuplicates = options.removeDuplicates === true;
  let entries = splitLines(text).map((value, index) => ({ value, index }));
  const comparator = createComparator(mode);

  if (removeDuplicates) {
    const seen = new Set();
    entries = entries.filter(({ value }) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  entries.sort((left, right) => {
    if (emptyLast) {
      const leftEmpty = left.value.trim() === "";
      const rightEmpty = right.value.trim() === "";
      if (leftEmpty !== rightEmpty) return leftEmpty ? 1 : -1;
    }
    return comparator(left, right);
  });
  return entries.map(({ value }) => value);
}

if (typeof document !== "undefined") {
  const input = document.querySelector("#inputText");
  const output = document.querySelector("#outputText");
  const inputCount = document.querySelector("#inputCount");
  const resultCount = document.querySelector("#resultCount");
  const sortModes = document.querySelector("#sortModes");
  const emptyLast = document.querySelector("#emptyLast");
  const removeDuplicates = document.querySelector("#removeDuplicates");
  const copyButton = document.querySelector("#copyButton");
  const clearButton = document.querySelector("#clearButton");
  const restoreButton = document.querySelector("#restoreButton");
  const status = document.querySelector("#status");
  let mode = "natural-asc";
  let restored = false;
  let statusTimer;

  const formatCount = (count) => `${count.toLocaleString("ja-JP")} 行`;

  function render() {
    const sourceLines = splitLines(input.value);
    const resultLines = restored
      ? sourceLines
      : sortLines(input.value, { mode, emptyLast: emptyLast.checked, removeDuplicates: removeDuplicates.checked });
    output.value = resultLines.join("\n");
    inputCount.textContent = formatCount(sourceLines.length);
    resultCount.textContent = formatCount(resultLines.length);
    const hasLines = sourceLines.length > 0;
    copyButton.disabled = !hasLines;
    clearButton.disabled = !hasLines;
    restoreButton.disabled = !hasLines || restored;
  }

  function showStatus(message) {
    clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = setTimeout(() => { status.textContent = ""; }, 1800);
  }

  input.addEventListener("input", () => { restored = false; status.textContent = ""; render(); });
  sortModes.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    restored = false;
    sortModes.querySelectorAll("button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
  emptyLast.addEventListener("change", () => { restored = false; render(); });
  removeDuplicates.addEventListener("change", () => { restored = false; render(); });
  restoreButton.addEventListener("click", () => { restored = true; render(); showStatus("元の順番に戻しました"); });
  clearButton.addEventListener("click", () => {
    input.value = "";
    output.value = "";
    restored = false;
    render();
    input.focus();
  });
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.value);
    } catch {
      output.select();
      document.execCommand("copy");
      output.setSelectionRange(0, 0);
    }
    showStatus("結果をコピーしました");
  });

  render();
}

if (typeof module !== "undefined") {
  module.exports = { splitLines, naturalCompare, parseWholeNumber, sortLines };
}
