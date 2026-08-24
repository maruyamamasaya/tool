"use strict";

function parseCsv(text) {
  const source = String(text).replace(/^\ufeff/, "");
  if (!source.trim()) throw new Error("CSVテキストを入力してください。");
  const data = []; let row = []; let cell = ""; let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell === "") quoted = true;
    else if (character === ",") { row.push(cell); cell = ""; }
    else if (character === "\r" || character === "\n") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell); data.push(row); row = []; cell = "";
    } else cell += character;
  }
  if (quoted) throw new Error("閉じられていない引用符があります。");
  if (cell !== "" || row.length) { row.push(cell); data.push(row); }
  const width = Math.max(...data.map((item) => item.length));
  return data.map((item) => Array.from({ length: width }, (_, index) => item[index] ?? ""));
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function toCsv(data) { return data.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n"); }
function safeFileName(value) { return String(value).trim().replace(/[\\/:*?"<>|]/g, "_").replace(/\.(csv|txt)$/i, "") || "edited-data"; }

if (typeof document !== "undefined") {
  const input = document.querySelector("#csvInput");
  const panel = document.querySelector("#editorPanel");
  const table = document.querySelector("#editorTable");
  const error = document.querySelector("#errorMessage");
  const summary = document.querySelector("#tableSummary");
  const status = document.querySelector("#status");
  let data = [];

  function render() {
    table.replaceChildren();
    const body = document.createElement("tbody");
    data.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      const marker = document.createElement("th"); marker.scope = "row"; marker.textContent = rowIndex + 1;
      const removeRow = document.createElement("button"); removeRow.type = "button"; removeRow.textContent = "×"; removeRow.title = `${rowIndex + 1}行目を削除`;
      removeRow.addEventListener("click", () => { if (data.length === 1) return announce("行は1つ以上必要です"); data.splice(rowIndex, 1); update(); });
      marker.append(removeRow); tr.append(marker);
      row.forEach((value, columnIndex) => {
        const cell = document.createElement(rowIndex === 0 ? "th" : "td");
        cell.contentEditable = "true"; cell.spellcheck = false; cell.textContent = value;
        cell.dataset.row = rowIndex; cell.dataset.column = columnIndex;
        cell.setAttribute("aria-label", `${rowIndex + 1}行 ${columnIndex + 1}列`); tr.append(cell);
      }); body.append(tr);
    });
    const controls = document.createElement("tr"); controls.className = "column-controls"; controls.append(document.createElement("th"));
    data[0].forEach((_, index) => { const td = document.createElement("td"); const button = document.createElement("button"); button.type = "button"; button.textContent = "列を削除"; button.addEventListener("click", () => { if (data[0].length === 1) return announce("列は1つ以上必要です"); data.forEach((row) => row.splice(index, 1)); update(); }); td.append(button); controls.append(td); });
    body.append(controls); table.append(body);
    summary.textContent = `${data.length} 行 × ${data[0].length} 列`;
  }
  function update() { render(); input.value = toCsv(data); }
  function announce(message) { status.textContent = message; }
  function importCsv() {
    try { data = parseCsv(input.value); error.hidden = true; panel.hidden = false; render(); panel.scrollIntoView({ behavior: "smooth", block: "start" }); announce("CSVを表に反映しました"); }
    catch (exception) { error.textContent = exception.message; error.hidden = false; panel.hidden = true; }
  }
  table.addEventListener("input", (event) => { const cell = event.target.closest("[data-row]"); if (!cell) return; data[+cell.dataset.row][+cell.dataset.column] = cell.innerText.replace(/\n$/, ""); input.value = toCsv(data); });
  table.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.target.blur(); } });
  document.querySelector("#importButton").addEventListener("click", importCsv);
  document.querySelector("#sampleButton").addEventListener("click", () => { input.value = '名前,部署,メールアドレス\r\n山田 太郎,営業部,taro@example.com\r\n佐藤 花子,"企画, 広報部",hanako@example.com'; input.focus(); });
  document.querySelector("#addRowButton").addEventListener("click", () => { data.push(data[0].map(() => "")); update(); });
  document.querySelector("#addColumnButton").addEventListener("click", () => { data.forEach((row) => row.push("")); update(); });
  document.querySelector("#clearButton").addEventListener("click", () => { input.value = ""; data = []; panel.hidden = true; error.hidden = true; input.focus(); });
  function download(extension) { const name = `${safeFileName(document.querySelector("#fileName").value)}.${extension}`; const blob = new Blob(["\ufeff", toCsv(data)], { type: "text/plain;charset=utf-8" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = name; link.click(); URL.revokeObjectURL(link.href); announce(`${name} を保存しました`); }
  document.querySelector("#downloadCsvButton").addEventListener("click", () => download("csv"));
  document.querySelector("#downloadTxtButton").addEventListener("click", () => download("txt"));
}

if (typeof module !== "undefined") module.exports = { parseCsv, escapeCsvCell, toCsv, safeFileName };
