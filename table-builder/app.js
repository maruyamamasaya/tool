"use strict";

const STORAGE_KEY = "table-builder.state.v1";
const SAMPLE = [["商品", "価格", "在庫"], ["ノート", "240円", "12"], ["ペン", "120円", "35"], ["付箋", "380円", "8"]];

function normalizeTable(data) {
  if (!Array.isArray(data) || !data.length) return [["", "", ""], ["", "", ""], ["", "", ""]];
  const width = Math.max(1, ...data.map((row) => Array.isArray(row) ? row.length : 0));
  return data.map((row) => Array.from({ length: width }, (_, i) => String(Array.isArray(row) ? row[i] ?? "" : "")));
}
function escapeMarkdown(value) { return String(value).replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>"); }
function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function toMarkdown(data, header = true, alignment = "left") {
  const rows = normalizeTable(data); const rule = { left: ":---", center: ":---:", right: "---:" }[alignment] || ":---";
  const render = (row) => `| ${row.map(escapeMarkdown).join(" | ")} |`;
  if (header) return [render(rows[0]), render(rows[0].map(() => rule)), ...rows.slice(1).map(render)].join("\n");
  return [render(rows[0].map(() => "")), render(rows[0].map(() => rule)), ...rows.map(render)].join("\n");
}
function toHtml(data, header = true, alignment = "left") {
  const rows = normalizeTable(data); const cell = (tag, value) => `    <${tag} style="text-align: ${alignment}">${escapeHtml(value)}</${tag}>`;
  const groups = []; let start = 0;
  if (header) { groups.push(`  <thead>\n  <tr>\n${rows[0].map((v) => cell("th", v)).join("\n")}\n  </tr>\n  </thead>`); start = 1; }
  groups.push(`  <tbody>\n${rows.slice(start).map((row) => `  <tr>\n${row.map((v) => cell("td", v)).join("\n")}\n  </tr>`).join("\n")}\n  </tbody>`);
  return `<table>\n${groups.join("\n")}\n</table>`;
}
function csvCell(value) { const text = String(value); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function toCsv(data) { return normalizeTable(data).map((row) => row.map(csvCell).join(",")).join("\r\n"); }
function convert(data, format, header, alignment) { return format === "html" ? toHtml(data, header, alignment) : format === "csv" ? toCsv(data) : toMarkdown(data, header, alignment); }

if (typeof document !== "undefined") {
  const table = document.querySelector("#editorTable"), output = document.querySelector("#outputCode"), status = document.querySelector("#status");
  const headerToggle = document.querySelector("#headerToggle"), alignment = document.querySelector("#alignment");
  let state = { data: SAMPLE.map((r) => [...r]), header: true, alignment: "left", format: "markdown" }; let timer;
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (saved?.data) state = { ...state, ...saved, data: normalizeTable(saved.data) }; } catch {}
  headerToggle.checked = state.header; alignment.value = state.alignment;

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function announce(text) { status.textContent = text; clearTimeout(timer); timer = setTimeout(() => { status.textContent = "編集内容はブラウザに自動保存されます"; }, 2200); }
  function renderTable() {
    table.replaceChildren(); const body = document.createElement("tbody");
    state.data.forEach((row, rowIndex) => { const tr = document.createElement("tr");
      const marker = document.createElement("th"); marker.scope = "row"; marker.className = "row-marker"; marker.textContent = rowIndex + 1;
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.title = `${rowIndex + 1}行目を削除`; remove.addEventListener("click", () => removeRow(rowIndex)); marker.append(remove); tr.append(marker);
      row.forEach((value, colIndex) => { const cell = document.createElement(rowIndex === 0 && state.header ? "th" : "td"); cell.contentEditable = "true"; cell.spellcheck = false; cell.textContent = value; cell.dataset.row = rowIndex; cell.dataset.col = colIndex; cell.setAttribute("aria-label", `${rowIndex + 1}行 ${colIndex + 1}列`); tr.append(cell); }); body.append(tr);
    });
    const controls = document.createElement("tr"); controls.className = "column-controls"; controls.append(document.createElement("th"));
    state.data[0].forEach((_, i) => { const td = document.createElement("td"), button = document.createElement("button"); button.type = "button"; button.textContent = "列を削除"; button.addEventListener("click", () => removeColumn(i)); td.append(button); controls.append(td); }); body.append(controls); table.append(body);
  }
  function renderOutput() { output.textContent = convert(state.data, state.format, state.header, state.alignment); document.querySelector("#sizeLabel").textContent = `${state.data.length} 行 × ${state.data[0].length} 列`; save(); }
  function commit() { renderTable(); renderOutput(); }
  function removeRow(i) { if (state.data.length === 1) return announce("行は1つ以上必要です"); state.data.splice(i, 1); commit(); }
  function removeColumn(i) { if (state.data[0].length === 1) return announce("列は1つ以上必要です"); state.data.forEach((row) => row.splice(i, 1)); commit(); }
  table.addEventListener("input", (event) => { const cell = event.target.closest("[data-row]"); if (!cell) return; state.data[+cell.dataset.row][+cell.dataset.col] = cell.innerText.replace(/\n$/, ""); renderOutput(); });
  table.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.target.blur(); } });
  document.querySelector("#addRowButton").addEventListener("click", () => { state.data.push(state.data[0].map(() => "")); commit(); });
  document.querySelector("#addColumnButton").addEventListener("click", () => { state.data.forEach((row) => row.push("")); commit(); });
  document.querySelector("#sampleButton").addEventListener("click", () => { state.data = SAMPLE.map((r) => [...r]); commit(); announce("サンプルを読み込みました"); });
  document.querySelector("#clearButton").addEventListener("click", () => { if (!confirm("テーブルの内容をクリアしますか？")) return; state.data = [["", "", ""], ["", "", ""], ["", "", ""]]; commit(); announce("テーブルをクリアしました"); });
  headerToggle.addEventListener("change", () => { state.header = headerToggle.checked; commit(); }); alignment.addEventListener("change", () => { state.alignment = alignment.value; renderOutput(); });
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => { state.format = tab.dataset.format; document.querySelectorAll(".tab").forEach((t) => { const active = t === tab; t.classList.toggle("active", active); t.setAttribute("aria-selected", active); }); renderOutput(); }));
  document.querySelector(`[data-format="${state.format}"]`)?.click();
  async function copy() { try { await navigator.clipboard.writeText(output.textContent); } catch { const area = document.createElement("textarea"); area.value = output.textContent; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); } announce(`${state.format.toUpperCase()}をコピーしました`); }
  document.querySelector("#copyButton").addEventListener("click", copy);
  document.querySelector("#downloadButton").addEventListener("click", () => { const ext = { markdown: "md", html: "html", csv: "csv" }[state.format]; const blob = new Blob([state.format === "csv" ? "\ufeff" + output.textContent : output.textContent], { type: "text/plain;charset=utf-8" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `table.${ext}`; link.click(); URL.revokeObjectURL(link.href); announce(`table.${ext} を保存しました`); });
  commit();
}

if (typeof module !== "undefined") module.exports = { normalizeTable, escapeMarkdown, escapeHtml, toMarkdown, toHtml, toCsv, convert };
