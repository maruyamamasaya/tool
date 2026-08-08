"use strict";

const collator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });

function splitLines(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  return normalized === "" ? [] : normalized.split("\n");
}

function parseDelimited(text, delimiter) {
  const items = [];
  let item = "";
  let quote = "";

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (character === quote && text[index + 1] === quote) {
        item += quote;
        index += 1;
      } else if (character === quote) {
        quote = "";
      } else {
        item += character;
      }
    } else if ((character === '"' || character === "'") && item.trim() === "") {
      quote = character;
    } else if (text.startsWith(delimiter, index)) {
      items.push(item);
      item = "";
      index += delimiter.length - 1;
    } else {
      item += character;
    }
  }
  items.push(item);
  return items;
}

function splitItems(text, inputFormat = "auto", customSeparator = "") {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  if (normalized === "") return [];

  if (inputFormat === "json") {
    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch { /* Keep the original text when the JSON is incomplete. */ }
    return [normalized];
  }
  if (inputFormat === "custom") {
    return customSeparator ? parseDelimited(normalized, customSeparator) : [normalized];
  }
  if (inputFormat === "space") return normalized.split(/\s+/);

  const delimiters = {
    newline: "\n",
    comma: ",",
    tab: "\t",
    semicolon: ";"
  };
  if (delimiters[inputFormat]) return parseDelimited(normalized, delimiters[inputFormat]);

  // 自動判定では、文章中の空白は項目の一部として残し、代表的な区切り文字だけを対象にする。
  const delimiter = normalized.includes("\n") ? "\n"
    : normalized.includes("\t") ? "\t"
      : normalized.includes(",") ? ","
        : normalized.includes(";") ? ";" : null;
  return delimiter ? parseDelimited(normalized, delimiter) : [normalized];
}

function processItems(text, options = {}) {
  let items = splitItems(text, options.inputFormat, options.customSeparator);
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
    inputFormat: document.querySelector("#inputFormat"), customSeparator: document.querySelector("#customSeparator"),
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
      inputFormat: elements.inputFormat.value, customSeparator: elements.customSeparator.value,
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
    elements.inputCount.textContent = countLabel(splitItems(elements.input.value, elements.inputFormat.value, elements.customSeparator.value).length);
    elements.outputCount.textContent = countLabel(result.items.length);
    elements.copy.disabled = result.items.length === 0;
    elements.customSeparator.hidden = elements.inputFormat.value !== "custom";
  }
  function makeSortExclusive(selected, other) {
    if (selected.checked) other.checked = false;
    render();
  }

  elements.input.addEventListener("input", render);
  [elements.inputFormat, elements.format, elements.removeEmpty, elements.trimWhitespace, elements.removeDuplicates].forEach((element) => element.addEventListener("change", render));
  [elements.customSeparator, elements.prefix, elements.suffix].forEach((element) => element.addEventListener("input", render));
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

if (typeof module !== "undefined") module.exports = { splitLines, splitItems, parseDelimited, processItems, formatItems, convertList };
