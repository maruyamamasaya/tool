"use strict";

function splitLines(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  return normalized === "" ? [] : normalized.split("\n");
}

function findDuplicates(text, options = {}) {
  const lines = splitLines(text);
  const groups = new Map();

  lines.forEach((original, index) => {
    const display = options.trimWhitespace ? original.trim() : original;
    if (options.ignoreEmpty && display === "") return;
    const key = options.ignoreCase ? display.toLocaleLowerCase() : display;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.lineNumbers.push(index + 1);
    } else {
      groups.set(key, { value: display, count: 1, lineNumbers: [index + 1] });
    }
  });

  const duplicates = [...groups.values()].filter((group) => group.count > 1);
  const totalCount = [...groups.values()].reduce((sum, group) => sum + group.count, 0);
  return {
    lineCount: lines.length,
    totalCount,
    uniqueCount: groups.size,
    duplicateGroupCount: duplicates.length,
    duplicateLineCount: duplicates.reduce((sum, group) => sum + group.count - 1, 0),
    duplicates
  };
}

function duplicateText(groups) {
  return groups.map((group) => group.value).join("\n");
}

if (typeof document !== "undefined") {
  const elements = {
    input: document.querySelector("#inputText"), clear: document.querySelector("#clearButton"),
    copy: document.querySelector("#copyButton"), ignoreEmpty: document.querySelector("#ignoreEmpty"),
    trimWhitespace: document.querySelector("#trimWhitespace"), ignoreCase: document.querySelector("#ignoreCase"),
    lineCount: document.querySelector("#lineCount"), totalCount: document.querySelector("#totalCount"),
    uniqueCount: document.querySelector("#uniqueCount"), duplicateGroupCount: document.querySelector("#duplicateGroupCount"),
    duplicateLineCount: document.querySelector("#duplicateLineCount"), empty: document.querySelector("#emptyState"),
    noDuplicates: document.querySelector("#noDuplicates"), list: document.querySelector("#duplicateList"),
    status: document.querySelector("#status")
  };
  let currentResult = findDuplicates("");
  let statusTimer;
  const number = (value) => value.toLocaleString("ja-JP");

  function showStatus(message) {
    clearTimeout(statusTimer);
    elements.status.textContent = message;
    statusTimer = setTimeout(() => { elements.status.textContent = ""; }, 1800);
  }

  function createDuplicateRow(group) {
    const row = document.createElement("article");
    row.className = "duplicate-row";
    const content = document.createElement("div");
    content.className = "duplicate-content";
    const value = document.createElement("code");
    value.textContent = group.value === "" ? "（空行）" : group.value;
    const locations = document.createElement("span");
    locations.textContent = `行 ${group.lineNumbers.join(", ")}`;
    content.append(value, locations);
    const badge = document.createElement("strong");
    badge.className = "count-badge";
    badge.textContent = `${number(group.count)} 回`;
    row.append(content, badge);
    return row;
  }

  function render() {
    currentResult = findDuplicates(elements.input.value, {
      ignoreEmpty: elements.ignoreEmpty.checked,
      trimWhitespace: elements.trimWhitespace.checked,
      ignoreCase: elements.ignoreCase.checked
    });
    elements.lineCount.textContent = `${number(currentResult.lineCount)} 行`;
    elements.totalCount.textContent = number(currentResult.totalCount);
    elements.uniqueCount.textContent = number(currentResult.uniqueCount);
    elements.duplicateGroupCount.textContent = number(currentResult.duplicateGroupCount);
    elements.duplicateLineCount.textContent = number(currentResult.duplicateLineCount);
    const hasInput = elements.input.value !== "";
    elements.empty.hidden = hasInput;
    elements.noDuplicates.hidden = !hasInput || currentResult.duplicates.length > 0;
    elements.list.hidden = currentResult.duplicates.length === 0;
    elements.copy.disabled = currentResult.duplicates.length === 0;
    elements.list.replaceChildren(...currentResult.duplicates.map(createDuplicateRow));
  }

  elements.input.addEventListener("input", render);
  [elements.ignoreEmpty, elements.trimWhitespace, elements.ignoreCase].forEach((element) => element.addEventListener("change", render));
  elements.clear.addEventListener("click", () => {
    elements.input.value = "";
    render();
    elements.input.focus();
    showStatus("クリアしました");
  });
  elements.copy.addEventListener("click", async () => {
    const text = duplicateText(currentResult.duplicates);
    try { await navigator.clipboard.writeText(text); }
    catch {
      const helper = document.createElement("textarea");
      helper.value = text;
      document.body.append(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    showStatus("重複行をコピーしました");
  });
  render();
}

if (typeof module !== "undefined") module.exports = { splitLines, findDuplicates, duplicateText };
