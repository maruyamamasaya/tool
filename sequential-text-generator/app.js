"use strict";

function splitLines(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  return normalized === "" ? [] : normalized.split("\n");
}

function formatNumber(value, digits = 1) {
  const number = Number(value);
  const sign = number < 0 ? "-" : "";
  return `${sign}${String(Math.abs(number)).padStart(Math.max(1, Number(digits) || 1), "0")}`;
}

function generateSequentialText(text, options = {}) {
  const lines = splitLines(text);
  const start = Number.isFinite(Number(options.start)) ? Number(options.start) : 1;
  const increment = Number.isFinite(Number(options.increment)) ? Number(options.increment) : 1;
  const separator = options.separator ?? ". ";
  const prefix = options.prefix || "";
  const suffix = options.suffix || "";
  const position = options.position === "end" ? "end" : "start";
  const numberEmptyLines = options.numberEmptyLines === true;
  let current = start;
  let numberedCount = 0;

  const output = lines.map((line) => {
    if (line === "" && !numberEmptyLines) return "";
    const serial = formatNumber(current, options.digits);
    current += increment;
    numberedCount += 1;
    return position === "end"
      ? `${prefix}${line}${separator}${serial}${suffix}`
      : `${prefix}${serial}${separator}${line}${suffix}`;
  }).join("\n");

  return { output, lineCount: lines.length, numberedCount };
}

if (typeof document !== "undefined") {
  const elements = {
    input: document.querySelector("#inputText"), output: document.querySelector("#outputText"),
    inputCount: document.querySelector("#inputCount"), outputCount: document.querySelector("#outputCount"),
    start: document.querySelector("#startNumber"), increment: document.querySelector("#increment"), digits: document.querySelector("#digits"),
    position: document.querySelector("#position"), separator: document.querySelector("#separator"), customSeparator: document.querySelector("#customSeparator"),
    prefix: document.querySelector("#prefix"), suffix: document.querySelector("#suffix"),
    convert: document.querySelector("#convertButton"), copy: document.querySelector("#copyButton"), clear: document.querySelector("#clearButton"), status: document.querySelector("#status")
  };
  let statusTimer;

  function getOptions() {
    return {
      start: elements.start.value, increment: elements.increment.value, digits: elements.digits.value,
      position: elements.position.value,
      separator: elements.separator.value === "custom" ? elements.customSeparator.value : elements.separator.value,
      prefix: elements.prefix.value, suffix: elements.suffix.value,
      numberEmptyLines: document.querySelector('input[name="emptyLines"]:checked').value === "number"
    };
  }
  function showStatus(message) {
    clearTimeout(statusTimer);
    elements.status.textContent = message;
    statusTimer = setTimeout(() => { elements.status.textContent = ""; }, 1800);
  }
  function render() {
    const result = generateSequentialText(elements.input.value, getOptions());
    elements.output.value = result.output;
    elements.inputCount.textContent = `${result.lineCount.toLocaleString("ja-JP")} 行`;
    elements.outputCount.textContent = `${result.numberedCount.toLocaleString("ja-JP")} 件`;
    elements.copy.disabled = result.output === "";
    elements.customSeparator.hidden = elements.separator.value !== "custom";
  }

  elements.input.addEventListener("input", render);
  [elements.start, elements.increment, elements.prefix, elements.suffix, elements.customSeparator].forEach((element) => element.addEventListener("input", render));
  [elements.digits, elements.position, elements.separator, ...document.querySelectorAll('input[name="emptyLines"]')].forEach((element) => element.addEventListener("change", render));
  elements.convert.addEventListener("click", () => { render(); showStatus("変換しました"); });
  elements.clear.addEventListener("click", () => { elements.input.value = ""; render(); elements.input.focus(); showStatus("クリアしました"); });
  elements.copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(elements.output.value); }
    catch { elements.output.select(); document.execCommand("copy"); elements.output.setSelectionRange(0, 0); }
    showStatus("コピーしました");
  });
  render();
}

if (typeof module !== "undefined") module.exports = { splitLines, formatNumber, generateSequentialText };
