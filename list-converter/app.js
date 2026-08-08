"use strict";

const collator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });

function splitLines(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  return normalized === "" ? [] : normalized.split("\n");
}

function processItems(text, options = {}) {
  let items = splitLines(text);
  if (options.trimWhitespace) items = items.map((item) => item.trim());
  if (options.removeEmpty) items = items.filter((item) => item !== "");
  if (options.removeDuplicates) items = [...new Set(items)];
  if (options.sort === "ascending") items.sort(collator.compare);
  if (options.sort === "descending") items.sort((a, b) => collator.compare(b, a));
  const prefix = options.prefix || "";
  const suffix = options.suffix || "";
  return items.map((item) => `${prefix}${item}${suffix}`);
}

function quoteSingle(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function formatItems(items, format = "newline") {
  switch (format) {
    case "comma": return items.join(",");
    case "space": return items.join(" ");
    case "comma-space": return items.join(", ");
    case "single-quote": return items.map(quoteSingle).join(",");
    case "double-quote": return items.map((item) => JSON.stringify(item)).join(",");
    case "sql-in": return `IN (${items.map(quoteSingle).join(",")})`;
    case "json": return JSON.stringify(items);
    default: return items.join("\n");
  }
}

function convertList(text, options = {}) {
  const items = processItems(text, options);
  return { items, output: formatItems(items, options.format) };
}

if (typeof document !== "undefined") {
  const elements = {
    input: document.querySelector("#inputText"), output: document.querySelector("#outputText"),
    inputCount: document.querySelector("#inputCount"), outputCount: document.querySelector("#outputCount"),
    format: document.querySelector("#format"), prefix: document.querySelector("#prefix"), suffix: document.querySelector("#suffix"),
    removeEmpty: document.querySelector("#removeEmpty"), trimWhitespace: document.querySelector("#trimWhitespace"),
    removeDuplicates: document.querySelector("#removeDuplicates"), sortAscending: document.querySelector("#sortAscending"),
    sortDescending: document.querySelector("#sortDescending"), convert: document.querySelector("#convertButton"),
    copy: document.querySelector("#copyButton"), clear: document.querySelector("#clearButton"), status: document.querySelector("#status")
  };
  let statusTimer;
  const countLabel = (count) => `${count.toLocaleString("ja-JP")} 件`;

  function options() {
    return {
      format: elements.format.value, prefix: elements.prefix.value, suffix: elements.suffix.value,
      removeEmpty: elements.removeEmpty.checked, trimWhitespace: elements.trimWhitespace.checked,
      removeDuplicates: elements.removeDuplicates.checked,
      sort: elements.sortAscending.checked ? "ascending" : elements.sortDescending.checked ? "descending" : "none"
    };
  }
  function showStatus(message) {
    clearTimeout(statusTimer); elements.status.textContent = message;
    statusTimer = setTimeout(() => { elements.status.textContent = ""; }, 1800);
  }
  function render() {
    const result = convertList(elements.input.value, options());
    elements.output.value = result.output;
    elements.inputCount.textContent = countLabel(splitLines(elements.input.value).length);
    elements.outputCount.textContent = countLabel(result.items.length);
    elements.copy.disabled = result.items.length === 0;
  }
  function makeSortExclusive(selected, other) {
    if (selected.checked) other.checked = false;
    render();
  }

  elements.input.addEventListener("input", render);
  [elements.format, elements.removeEmpty, elements.trimWhitespace, elements.removeDuplicates].forEach((element) => element.addEventListener("change", render));
  [elements.prefix, elements.suffix].forEach((element) => element.addEventListener("input", render));
  elements.sortAscending.addEventListener("change", () => makeSortExclusive(elements.sortAscending, elements.sortDescending));
  elements.sortDescending.addEventListener("change", () => makeSortExclusive(elements.sortDescending, elements.sortAscending));
  elements.convert.addEventListener("click", () => { render(); showStatus("変換しました"); });
  elements.clear.addEventListener("click", () => { elements.input.value = ""; render(); elements.input.focus(); showStatus("クリアしました"); });
  elements.copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(elements.output.value); }
    catch { elements.output.select(); document.execCommand("copy"); elements.output.setSelectionRange(0, 0); }
    showStatus("結果をコピーしました");
  });
  render();
}

if (typeof module !== "undefined") module.exports = { splitLines, processItems, formatItems, convertList };
