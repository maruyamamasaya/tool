"use strict";

const elements = {
  dropZone: document.querySelector("#dropZone"),
  fileInput: document.querySelector("#fileInput"),
  selectButton: document.querySelector("#selectButton"),
  changeFileButton: document.querySelector("#changeFileButton"),
  errorMessage: document.querySelector("#errorMessage"),
  viewer: document.querySelector("#viewer"),
  fileName: document.querySelector("#fileName"),
  encodingLabel: document.querySelector("#encodingLabel"),
  rowCount: document.querySelector("#rowCount"),
  columnCount: document.querySelector("#columnCount"),
  filteredCount: document.querySelector("#filteredCount"),
  searchInput: document.querySelector("#searchInput"),
  autoFitButton: document.querySelector("#autoFitButton"),
  fullscreenButton: document.querySelector("#fullscreenButton"),
  fullscreenButtonLabel: document.querySelector("#fullscreenButtonLabel"),
  dataTable: document.querySelector("#dataTable"),
  tableColumns: document.querySelector("#tableColumns"),
  tableHead: document.querySelector("#tableHead"),
  tableBody: document.querySelector("#tableBody"),
  emptyResult: document.querySelector("#emptyResult")
};

let headers = [];
let rows = [];
let sortState = { column: -1, direction: "none" };
const MIN_COLUMN_WIDTH = 90;
const MAX_COLUMN_WIDTH = 420;
const DEFAULT_COLUMN_WIDTH = 180;
let columnWidths = [];

elements.selectButton.addEventListener("click", (event) => {
  event.stopPropagation();
  elements.fileInput.click();
});
elements.changeFileButton.addEventListener("click", () => elements.fileInput.click());
elements.dropZone.addEventListener("click", () => elements.fileInput.click());
elements.dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.fileInput.click();
  }
});
elements.fileInput.addEventListener("change", () => loadFile(elements.fileInput.files[0]));
elements.searchInput.addEventListener("input", renderBody);
elements.autoFitButton.addEventListener("click", autoFitAllColumns);
elements.fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenControl);
const desktopMedia = window.matchMedia("(min-width: 701px)");
desktopMedia.addEventListener("change", updateFullscreenControl);
updateFullscreenControl();

["dragenter", "dragover"].forEach((name) => elements.dropZone.addEventListener(name, (event) => {
  event.preventDefault();
  elements.dropZone.classList.add("is-dragging");
}));
["dragleave", "drop"].forEach((name) => elements.dropZone.addEventListener(name, (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove("is-dragging");
}));
elements.dropZone.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));

function updateFullscreenControl() {
  const isFullscreen = document.fullscreenElement === elements.viewer;
  const isAvailable = typeof elements.viewer.requestFullscreen === "function" && desktopMedia.matches;
  elements.fullscreenButton.hidden = !isAvailable;
  elements.fullscreenButtonLabel.textContent = isFullscreen ? "全画面を終了" : "全画面表示";
  elements.fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
  elements.fullscreenButton.title = isFullscreen ? "全画面表示を終了" : "CSVビューアーを全画面表示";
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement === elements.viewer) await document.exitFullscreen();
    else await elements.viewer.requestFullscreen();
  } catch {
    showError("全画面表示を開始できませんでした。ブラウザの設定をご確認ください。");
  }
}

async function loadFile(file) {
  if (!file) return;
  hideError();
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    showError("CSVファイルを選択してください。");
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const decoded = decodeCsv(buffer);
    const parsed = parseCsv(decoded.text);
    if (!parsed.length || (parsed.length === 1 && parsed[0].every((cell) => cell === ""))) {
      throw new Error("データが含まれていません。");
    }

    headers = parsed[0].map((header, index) => header || `列 ${index + 1}`);
    rows = parsed.slice(1).map((row, originalIndex) => ({
      cells: Array.from({ length: headers.length }, (_, index) => row[index] ?? ""),
      originalIndex
    }));
    sortState = { column: -1, direction: "none" };
    columnWidths = headers.map(() => DEFAULT_COLUMN_WIDTH);
    elements.searchInput.value = "";
    elements.fileName.textContent = file.name;
    elements.encodingLabel.textContent = decoded.encoding;
    elements.rowCount.textContent = rows.length.toLocaleString("ja-JP");
    elements.columnCount.textContent = headers.length.toLocaleString("ja-JP");
    renderHeader();
    renderBody();
    autoFitAllColumns();
    elements.dropZone.hidden = true;
    elements.viewer.hidden = false;
  } catch (error) {
    showError(`ファイルを読み込めませんでした: ${error.message}`);
  } finally {
    elements.fileInput.value = "";
  }
}

function decodeCsv(buffer) {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), encoding: "UTF-8" };
  } catch {
    try {
      return { text: new TextDecoder("shift_jis", { fatal: true }).decode(buffer), encoding: "Shift_JIS" };
    } catch {
      throw new Error("文字コードを判別できません。UTF-8またはShift_JISのCSVを選択してください。");
    }
  }
}

function parseCsv(text) {
  const normalized = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const result = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (quoted) {
      if (character === '"' && normalized[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell === "") {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && normalized[index + 1] === "\n") index += 1;
      row.push(cell);
      result.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("引用符が閉じられていないCSVです。");
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    result.push(row);
  }
  return result;
}

function renderHeader() {
  elements.tableHead.replaceChildren();
  elements.tableColumns.replaceChildren();
  const headerRow = document.createElement("tr");
  headers.forEach((header, index) => {
    const column = document.createElement("col");
    column.style.width = `${columnWidths[index]}px`;
    elements.tableColumns.append(column);
    const th = document.createElement("th");
    const button = document.createElement("button");
    const label = document.createElement("span");
    const mark = document.createElement("span");
    button.type = "button";
    button.title = `${header}で並べ替え`;
    button.addEventListener("click", () => updateSort(index));
    label.textContent = header;
    mark.className = "sort-mark";
    mark.textContent = "◇";
    const resizer = document.createElement("button");
    resizer.type = "button";
    resizer.className = "column-resizer";
    resizer.setAttribute("aria-label", `${header}列の幅を調節`);
    resizer.title = "ドラッグで列幅を調節・ダブルクリックで自動調節";
    resizer.addEventListener("click", (event) => event.stopPropagation());
    resizer.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      autoFitColumn(index);
    });
    resizer.addEventListener("keydown", (event) => resizeColumnWithKeyboard(event, index));
    resizer.addEventListener("pointerdown", (event) => startColumnResize(event, index, resizer));
    button.append(label, mark);
    th.append(button, resizer);
    headerRow.append(th);
  });
  elements.tableHead.append(headerRow);
  updateSortIndicators();
}

function clampColumnWidth(width) {
  return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(width)));
}

function setColumnWidth(index, width) {
  columnWidths[index] = clampColumnWidth(width);
  const column = elements.tableColumns.children[index];
  if (column) column.style.width = `${columnWidths[index]}px`;
}

function startColumnResize(event, index, resizer) {
  if (event.button !== 0) return;
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = columnWidths[index];
  resizer.classList.add("is-resizing");
  resizer.setPointerCapture(event.pointerId);
  const move = (moveEvent) => setColumnWidth(index, startWidth + moveEvent.clientX - startX);
  const end = () => {
    resizer.classList.remove("is-resizing");
    resizer.removeEventListener("pointermove", move);
    resizer.removeEventListener("pointerup", end);
    resizer.removeEventListener("pointercancel", end);
  };
  resizer.addEventListener("pointermove", move);
  resizer.addEventListener("pointerup", end);
  resizer.addEventListener("pointercancel", end);
}

function resizeColumnWithKeyboard(event, index) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  setColumnWidth(index, columnWidths[index] + (event.key === "ArrowRight" ? 10 : -10));
}

function measureColumnWidth(index) {
  const canvas = measureColumnWidth.canvas || (measureColumnWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  if (!context) return DEFAULT_COLUMN_WIDTH;
  context.font = getComputedStyle(elements.dataTable).font;
  let widest = context.measureText(headers[index]).width + 58;
  rows.forEach((row) => {
    widest = Math.max(widest, context.measureText(row.cells[index]).width + 28);
  });
  return clampColumnWidth(widest);
}

function autoFitColumn(index) {
  setColumnWidth(index, measureColumnWidth(index));
}

function autoFitAllColumns() {
  headers.forEach((_, index) => autoFitColumn(index));
}

function updateSort(column) {
  if (sortState.column !== column) sortState = { column, direction: "ascending" };
  else if (sortState.direction === "ascending") sortState.direction = "descending";
  else if (sortState.direction === "descending") sortState = { column: -1, direction: "none" };
  else sortState = { column, direction: "ascending" };
  updateSortIndicators();
  renderBody();
}

function updateSortIndicators() {
  [...elements.tableHead.querySelectorAll("th")].forEach((th, index) => {
    const active = index === sortState.column;
    th.setAttribute("aria-sort", active ? sortState.direction : "none");
    th.querySelector(".sort-mark").textContent = active
      ? (sortState.direction === "ascending" ? "▲" : "▼")
      : "◇";
  });
}

function renderBody() {
  const keyword = elements.searchInput.value.trim().toLocaleLowerCase("ja-JP");
  let visibleRows = keyword
    ? rows.filter((row) => row.cells.some((cell) => cell.toLocaleLowerCase("ja-JP").includes(keyword)))
    : [...rows];

  if (sortState.column >= 0) {
    const multiplier = sortState.direction === "ascending" ? 1 : -1;
    visibleRows.sort((left, right) => {
      const comparison = left.cells[sortState.column].localeCompare(
        right.cells[sortState.column], "ja", { numeric: true, sensitivity: "base" }
      );
      return comparison === 0 ? left.originalIndex - right.originalIndex : comparison * multiplier;
    });
  }

  const fragment = document.createDocumentFragment();
  visibleRows.forEach((row) => {
    const tr = document.createElement("tr");
    row.cells.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      td.title = cell;
      tr.append(td);
    });
    fragment.append(tr);
  });
  elements.tableBody.replaceChildren(fragment);
  elements.emptyResult.hidden = visibleRows.length !== 0;
  elements.filteredCount.textContent = keyword ? `${visibleRows.length.toLocaleString("ja-JP")} / ${rows.length.toLocaleString("ja-JP")} 行` : "";
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.hidden = false;
}

function hideError() {
  elements.errorMessage.textContent = "";
  elements.errorMessage.hidden = true;
}
