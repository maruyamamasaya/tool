"use strict";

const dom = typeof document === "undefined" ? {} : {
  input: document.querySelector("#csvInput"), fileInput: document.querySelector("#fileInput"), fileName: document.querySelector("#fileName"), nullValues: document.querySelector("#nullValues"), clear: document.querySelector("#clearButton"), copy: document.querySelector("#copyButton"),
  inputSize: document.querySelector("#inputSize"), nullSummary: document.querySelector("#nullSummary"), status: document.querySelector("#status"), message: document.querySelector("#message"), results: document.querySelector("#results"),
  dimension: document.querySelector("#dimension"), rowCount: document.querySelector("#rowCount"), columnCount: document.querySelector("#columnCount"), nullCount: document.querySelector("#nullCount"), duplicateCount: document.querySelector("#duplicateCount"), nullDetail: document.querySelector("#nullDetail"), duplicateDetail: document.querySelector("#duplicateDetail"),
  columnBody: document.querySelector("#columnBody"), numericSection: document.querySelector("#numericSection"), numericBody: document.querySelector("#numericBody"), toast: document.querySelector("#toast")
};
let timer;
let latestAnalysis;

if (typeof document !== "undefined") {
  dom.input.addEventListener("input", () => { dom.fileInput.value = ""; dom.fileName.textContent = "ファイル未選択"; scheduleAnalysis(); });
  dom.fileInput.addEventListener("change", loadSelectedFile);
  dom.nullValues.addEventListener("input", scheduleAnalysis);
  dom.clear.addEventListener("click", () => { dom.input.value = ""; dom.fileInput.value = ""; dom.fileName.textContent = "ファイル未選択"; scheduleAnalysis(); dom.input.focus(); });
  dom.copy.addEventListener("click", copyResults);
}

async function loadSelectedFile() {
  const [file] = dom.fileInput.files;
  if (!file) return;
  dom.fileName.textContent = file.name;
  dom.message.hidden = true;
  try {
    dom.input.value = await file.text();
    scheduleAnalysis();
  } catch {
    dom.input.value = "";
    scheduleAnalysis();
    dom.message.textContent = "ファイルを読み込めませんでした。別のCSVファイルを選択してください。";
    dom.message.hidden = false;
  }
}

function scheduleAnalysis() {
  clearTimeout(timer);
  dom.inputSize.textContent = `${dom.input.value.length.toLocaleString("ja-JP")} 文字`;
  dom.clear.disabled = !dom.input.value;
  dom.message.hidden = true;
  dom.results.hidden = true;
  latestAnalysis = null;
  const labels = getNullValues(dom.nullValues.value);
  dom.nullSummary.textContent = labels.map((value) => value === "" ? "空欄" : value).join(", ") || "なし";
  if (!dom.input.value.trim()) { dom.status.classList.remove("active"); return; }
  dom.status.classList.add("active");
  timer = setTimeout(runAnalysis, 180);
}

function runAnalysis() {
  try {
    const parsed = parseCsv(dom.input.value);
    latestAnalysis = analyzeCsv(parsed, getNullValues(dom.nullValues.value));
    render(latestAnalysis);
    dom.results.hidden = false;
  } catch (error) {
    dom.message.textContent = error.message;
    dom.message.hidden = false;
  } finally { dom.status.classList.remove("active"); }
}

function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, "");
  if (!source.trim()) throw new Error("CSVデータが空です。ヘッダーとデータ行を貼り付けてください。");
  const rows = []; let row = []; let cell = ""; let quoted = false; let afterQuote = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') { quoted = false; afterQuote = true; }
      else cell += char;
    } else if (afterQuote) {
      if (char === ",") { row.push(cell); cell = ""; afterQuote = false; }
      else if (char === "\n" || char === "\r") { if (char === "\r" && source[i + 1] === "\n") i += 1; row.push(cell); rows.push(row); row = []; cell = ""; afterQuote = false; }
      else if (char !== " " && char !== "\t") throw new Error(`CSVを解析できません。${rows.length + 1}行目の閉じ引用符の後に不正な文字があります。`);
    } else if (char === '"') {
      if (cell !== "") throw new Error(`CSVを解析できません。${rows.length + 1}行目の引用符の位置を確認してください。`);
      quoted = true;
    } else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") { if (char === "\r" && source[i + 1] === "\n") i += 1; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (quoted) throw new Error("CSVを解析できません。ダブルクォートが閉じられていません。");
  if (cell !== "" || row.length || afterQuote) { row.push(cell); rows.push(row); }
  while (rows.length && rows.at(-1).length === 1 && rows.at(-1)[0] === "") rows.pop();
  if (!rows.length) throw new Error("CSVデータが空です。ヘッダーとデータ行を貼り付けてください。");
  const width = rows[0].length;
  if (rows[0].some((header) => !header.trim())) throw new Error("ヘッダー名が空の列があります。1行目にすべてのカラム名を入力してください。");
  if (rows.length < 2) throw new Error("データ行がありません。1行目をヘッダー、その後をデータとして入力してください。");
  const badIndex = rows.findIndex((candidate, index) => index > 0 && candidate.length !== width);
  if (badIndex >= 0) throw new Error(`${badIndex + 1}行目の列数がヘッダーと異なります（${rows[badIndex].length}列 / ${width}列）。`);
  return rows;
}

function getNullValues(text) { return [...new Set(text.split(/\r?\n/))]; }
function isNull(value, nullSet) { return nullSet.has(value.trim()); }
function inferType(values) {
  if (!values.length) return "Text";
  if (values.every((v) => /^(true|false)$/i.test(v.trim()))) return "Boolean";
  if (values.every((v) => v.trim() !== "" && Number.isFinite(Number(v)))) return "Number";
  if (values.every((v) => /^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T].*)?$/.test(v.trim()) && !Number.isNaN(Date.parse(v)))) return "Date";
  return "Text";
}
function analyzeCsv(parsed, nullValues) {
  const headers = parsed[0]; const rows = parsed.slice(1); const nullSet = new Set(nullValues);
  const rowKeys = new Set(); let duplicates = 0; let totalNulls = 0;
  rows.forEach((row) => { const key = JSON.stringify(row); if (rowKeys.has(key)) duplicates += 1; else rowKeys.add(key); });
  const columns = headers.map((name, index) => {
    const values = rows.map((row) => row[index]); const present = values.filter((v) => !isNull(v, nullSet)); const nulls = values.length - present.length; totalNulls += nulls;
    const counts = new Map(); present.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    let mode = "—"; let max = 0; counts.forEach((count, value) => { if (count > max) { mode = value; max = count; } });
    const type = inferType(present); let numeric = null;
    if (type === "Number") { const nums = present.map(Number).sort((a, b) => a - b); const middle = Math.floor(nums.length / 2); numeric = { count: nums.length, min: nums[0], max: nums.at(-1), mean: nums.reduce((sum, n) => sum + n, 0) / nums.length, median: nums.length % 2 ? nums[middle] : (nums[middle - 1] + nums[middle]) / 2 }; }
    return { name, type, nulls, nullRate: ratio(nulls, rows.length), unique: counts.size, uniqueRate: ratio(counts.size, present.length), mode, numeric };
  });
  return { headers, rows, columns, totalNulls, duplicates };
}
function ratio(value, total) { return total ? value / total * 100 : 0; }
function percent(value) { return `${value.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%`; }
function number(value) { return value.toLocaleString("ja-JP", { maximumFractionDigits: 4 }); }
function cell(value, className = "") { const td = document.createElement("td"); td.textContent = value; if (className) td.className = className; return td; }

function render(data) {
  const rowCount = data.rows.length; const columnCount = data.headers.length; const totalCells = rowCount * columnCount;
  dom.dimension.textContent = `${number(rowCount)} rows × ${number(columnCount)} columns`; dom.rowCount.textContent = number(rowCount); dom.columnCount.textContent = number(columnCount); dom.nullCount.textContent = number(data.totalNulls); dom.duplicateCount.textContent = number(data.duplicates);
  dom.nullDetail.textContent = `全セルの ${percent(ratio(data.totalNulls, totalCells))}`; dom.duplicateDetail.textContent = `全行の ${percent(ratio(data.duplicates, rowCount))}`;
  const columnFragment = document.createDocumentFragment(); const numericFragment = document.createDocumentFragment();
  data.columns.forEach((column) => {
    const tr = document.createElement("tr"); const typeCell = cell(""); const badge = document.createElement("span"); badge.className = "type"; badge.textContent = column.type; typeCell.append(badge);
    tr.append(cell(column.name, "column-name"), typeCell, cell(number(column.nulls)), cell(percent(column.nullRate), "muted"), cell(number(column.unique)), cell(percent(column.uniqueRate), "muted"), cell(column.mode)); columnFragment.append(tr);
    if (column.numeric) { const n = column.numeric; const numericRow = document.createElement("tr"); numericRow.append(cell(column.name, "column-name"), cell(number(n.count)), cell(number(n.min)), cell(number(n.max)), cell(number(n.mean)), cell(number(n.median))); numericFragment.append(numericRow); }
  });
  dom.columnBody.replaceChildren(columnFragment); dom.numericBody.replaceChildren(numericFragment); dom.numericSection.hidden = !data.columns.some((column) => column.numeric);
}

function formatResults(data) {
  const lines = ["CSV Statistics", `${data.rows.length} rows × ${data.headers.length} columns`, `NULL: ${data.totalNulls} / 重複行: ${data.duplicates}`, "", "カラム統計", "Column\tType\tNULL\tNULL率\tUnique\tUnique率\t最頻値"];
  data.columns.forEach((c) => lines.push(`${c.name}\t${c.type}\t${c.nulls}\t${percent(c.nullRate)}\t${c.unique}\t${percent(c.uniqueRate)}\t${c.mode}`));
  const numeric = data.columns.filter((c) => c.numeric); if (numeric.length) { lines.push("", "数値カラム", "Column\t件数\t最小値\t最大値\t平均値\t中央値"); numeric.forEach((c) => lines.push(`${c.name}\t${c.numeric.count}\t${c.numeric.min}\t${c.numeric.max}\t${number(c.numeric.mean)}\t${number(c.numeric.median)}`)); }
  return lines.join("\n");
}
async function copyResults() {
  if (!latestAnalysis) return;
  try { await navigator.clipboard.writeText(formatResults(latestAnalysis)); dom.toast.textContent = "統計結果をコピーしました"; }
  catch { dom.toast.textContent = "コピーできませんでした"; }
  dom.toast.hidden = false; setTimeout(() => { dom.toast.hidden = true; }, 1800);
}

if (typeof module !== "undefined") module.exports = { parseCsv, getNullValues, inferType, analyzeCsv, formatResults };
