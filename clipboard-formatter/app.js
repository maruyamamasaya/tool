"use strict";

function parseDelimited(text, delimiter) {
  const rows = [[]];
  let cell = "";
  let quoted = false;
  const normalized = String(text).replace(/\r\n?/g, "\n");
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    if (char === '"') {
      if (quoted && normalized[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      rows[rows.length - 1].push(cell); cell = "";
    } else if (char === "\n" && !quoted) {
      rows[rows.length - 1].push(cell); cell = ""; rows.push([]);
    } else cell += char;
  }
  rows[rows.length - 1].push(cell);
  if (normalized.endsWith("\n") && rows.at(-1).length === 1 && rows.at(-1)[0] === "") rows.pop();
  return rows;
}

function detectAndParse(text) {
  const value = String(text).replace(/\r\n?/g, "\n");
  if (value.includes("\t")) return { delimiter: "tab", rows: parseDelimited(value, "\t") };
  if (value.includes(",")) return { delimiter: "comma", rows: parseDelimited(value, ",") };
  const lines = value.split("\n").filter((line) => line.length);
  const spaceTable = lines.length > 0 && lines.every((line) => line.trim().split(/\s+/).length > 1);
  if (spaceTable) return { delimiter: "space", rows: value.split("\n").map((line) => line.trim() ? line.trim().split(/\s+/) : [""]) };
  return { delimiter: "newline", rows: value.split("\n").map((line) => [line]) };
}

function escapeValue(value, quote) {
  if (!quote) return value;
  const mark = quote === "double" ? '"' : "'";
  return `${mark}${value.replaceAll(mark, mark + mark)}${mark}`;
}

function formatRows(rows, options) {
  let data = rows.map((row) => row.map((value) => {
    let next = String(value);
    if (options.trim) next = next.trim();
    if (options.spaces) next = next.replace(/[ \u3000]+/g, " ");
    return next;
  }));
  if (options.empty) data = data.filter((row) => row.some((value) => value !== ""));
  if (options.duplicate) {
    const seen = new Set();
    data = data.filter((row) => { const key = JSON.stringify(row); if (seen.has(key)) return false; seen.add(key); return true; });
  }
  const quoted = data.map((row) => row.map((value) => escapeValue(value, options.quote)));
  if (options.format === "markdown") {
    if (!data.length) return "";
    const safe = data.map((row) => row.map((value) => value.replaceAll("|", "\\|").replaceAll("\n", "<br>")));
    const line = (row) => `| ${row.join(" | ")} |`;
    return [line(safe[0]), line(safe[0].map(() => "---")), ...safe.slice(1).map(line)].join("\n");
  }
  if (options.format.startsWith("sql-")) {
    const values = data.flat().map((value) => `'${value.replaceAll("'", "''")}'`).join(",");
    return options.format === "sql-in" ? `IN (${values})` : values;
  }
  if (options.format === "newline") return quoted.flat().join("\n");
  const separators = { comma: ",", tab: "\t", space: " " };
  return quoted.map((row) => row.join(separators[options.format])).join("\n");
}

function setCellValue(rows, rowIndex, columnIndex, value) {
  if (!Array.isArray(rows[rowIndex]) || rowIndex < 0 || columnIndex < 0) return false;
  while (rows[rowIndex].length <= columnIndex) rows[rowIndex].push("");
  rows[rowIndex][columnIndex] = String(value);
  return true;
}

if (typeof document !== "undefined") {
  const $ = (selector) => document.querySelector(selector);
  const source = $("#source"); const workspace = $("#workspace"); const result = $("#result");
  let parsed = []; let selected = []; let statusTimer;
  const names = { tab: "タブ区切り", comma: "カンマ区切り", space: "スペース区切り", newline: "改行（1列）" };

  function renderPreview() {
    const columnCount = Math.max(0, ...parsed.map((row) => row.length));
    if (selected.length !== columnCount) selected = Array.from({ length: columnCount }, () => true);
    $("#columnChoices").innerHTML = Array.from({ length: columnCount }, (_, index) => `<label><input type="checkbox" data-column="${index}" ${selected[index] ? "checked" : ""}> 列${index + 1}</label>`).join("");
    $("#previewHead").innerHTML = `<tr>${Array.from({ length: columnCount }, (_, i) => `<th>列${i + 1}</th>`).join("")}</tr>`;
    $("#previewBody").innerHTML = parsed.map((row, rowIndex) => `<tr>${Array.from({ length: columnCount }, (_, columnIndex) => `<td><input class="cell-input" type="text" value="${escapeHtml(row[columnIndex] ?? "").replaceAll('"', "&quot;")}" data-row="${rowIndex}" data-column="${columnIndex}" aria-label="${rowIndex + 1}行目、列${columnIndex + 1}"></td>`).join("")}</tr>`).join("");
    $("#previewNote").textContent = `${parsed.length.toLocaleString("ja-JP")}行すべてを表示しています。編集内容は変換結果へすぐに反映されます。`;
  }
  function escapeHtml(value) { const el = document.createElement("span"); el.textContent = value; return el.innerHTML; }
  function updateResult() {
    const chosen = parsed.map((row) => selected.flatMap((isSelected, index) => isSelected ? [row[index] ?? ""] : []));
    result.value = formatRows(chosen, { trim: $("#trim").checked, empty: $("#empty").checked, duplicate: $("#duplicate").checked, spaces: $("#spaces").checked, format: $("#format").value, quote: $("#quote").value });
    $("#resultCount").textContent = `${result.value ? result.value.split("\n").length.toLocaleString("ja-JP") : 0} 行・${[...result.value].length.toLocaleString("ja-JP")} 文字`;
    $("#copyButton").disabled = !result.value;
  }
  function update() {
    const hasText = source.value.length > 0;
    workspace.hidden = !hasText; $("#clearButton").disabled = !hasText;
    $("#inputCount").textContent = `${hasText ? source.value.replace(/\r\n?/g, "\n").split("\n").length : 0} 行`;
    if (!hasText) { parsed = []; selected = []; result.value = ""; return; }
    const detected = detectAndParse(source.value); parsed = detected.rows;
    $("#detected").textContent = `${names[detected.delimiter]}として認識 ・ ${parsed.length.toLocaleString("ja-JP")}行 × ${Math.max(...parsed.map((row) => row.length))}列`;
    renderPreview(); updateResult();
  }
  source.addEventListener("input", update);
  $("#columnChoices").addEventListener("change", (event) => { if (!event.target.matches("[data-column]")) return; selected[Number(event.target.dataset.column)] = event.target.checked; updateResult(); });
  $("#previewBody").addEventListener("input", (event) => {
    if (!event.target.matches(".cell-input")) return;
    setCellValue(parsed, Number(event.target.dataset.row), Number(event.target.dataset.column), event.target.value);
    updateResult();
  });
  document.querySelectorAll("#trim, #empty, #duplicate, #spaces, #format, #quote").forEach((control) => control.addEventListener("change", updateResult));
  $("#clearButton").addEventListener("click", () => { source.value = ""; update(); source.focus(); });
  $("#copyButton").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(result.value); } catch { result.select(); document.execCommand("copy"); }
    clearTimeout(statusTimer); $("#status").textContent = "✓ コピーしました"; statusTimer = setTimeout(() => { $("#status").textContent = ""; }, 1800);
  });
  update();
}

if (typeof module !== "undefined") module.exports = { parseDelimited, detectAndParse, formatRows, setCellValue };
