"use strict";

const STORAGE_KEY = "file-tree-builder.state.v1";
let sequence = 0;
const makeNode = (name, type = "file", children = []) => ({ id: `node-${Date.now()}-${sequence++}`, name: String(name).trim(), type, open: true, children: type === "folder" ? children : [] });
const sampleTree = () => [makeNode("my-project", "folder", [makeNode("src", "folder", [makeNode("components", "folder", [makeNode("Header.tsx"), makeNode("Footer.tsx")]), makeNode("pages", "folder", [makeNode("index.tsx")]), makeNode("app.ts")]), makeNode("public", "folder", [makeNode("favicon.ico")]), makeNode("package.json"), makeNode("README.md")])];
const clone = (value) => JSON.parse(JSON.stringify(value));

function walk(nodes, callback, depth = 0) { nodes.forEach((node) => { callback(node, depth); walk(node.children || [], callback, depth + 1); }); }
function findNode(nodes, id, parent = null) { for (const node of nodes) { if (node.id === id) return { node, parent }; const found = findNode(node.children || [], id, node); if (found) return found; } return null; }
function detachNode(nodes, id) { const index = nodes.findIndex((node) => node.id === id); if (index >= 0) return nodes.splice(index, 1)[0]; for (const node of nodes) { const found = detachNode(node.children || [], id); if (found) return found; } return null; }
function contains(node, id) { return node.id === id || (node.children || []).some((child) => contains(child, id)); }

function formatTree(nodes, format = "tree", custom = {}) {
  const slash = (node) => node.type === "folder" ? "/" : "";
  if (format === "tree" || format === "ascii") {
    const unicode = format === "tree";
    const lines = [];
    function branch(items, prefixes = []) { items.forEach((node, index) => { const last = index === items.length - 1; const stem = prefixes.map((isLast) => isLast ? "    " : unicode ? "│   " : "|   ").join(""); lines.push(`${stem}${unicode ? (last ? "└── " : "├── ") : (last ? "`-- " : "|-- ")}${node.name}${slash(node)}`); branch(node.children || [], [...prefixes, last]); }); }
    nodes.forEach((root) => { lines.push(`${root.name}${slash(root)}`); branch(root.children || []); });
    return lines.join("\n");
  }
  const lines = [];
  function flat(items, depth) { items.forEach((node) => { const indent = "  ".repeat(depth); let value;
    if (format === "simple") value = `${node.type === "folder" ? "+" : "-"} ${node.name}`;
    else if (format === "bullet") value = `- ${node.name}`;
    else if (format === "markdown") value = `- \`${node.name}${slash(node)}\``;
    else value = `${depth ? "→ " : ""}${node.name}`;
    lines.push(indent + value); flat(node.children || [], depth + 1); }); }
  if (format !== "custom") { flat(nodes, 0); return lines.join("\n"); }
  const width = Math.max(1, Math.min(8, Number(custom.indentWidth) || 2));
  function customFlat(items, depth) { items.forEach((node) => { const icon = custom.showEmoji ? `${node.type === "folder" ? custom.folderSymbol : custom.fileSymbol} ` : ""; const marker = depth ? (custom.branchSymbol || custom.arrowSymbol || custom.bulletSymbol) + " " : (custom.bulletSymbol ? custom.bulletSymbol + " " : ""); const end = node.type === "folder" && custom.trailingSlash ? "/" : ""; lines.push(" ".repeat(depth * width) + marker + icon + node.name + end); customFlat(node.children || [], depth + 1); }); }
  customFlat(nodes, 0); return lines.join("\n");
}

function parseTreeText(text) {
  const roots = [], stack = [];
  String(text).split(/\r?\n/).forEach((raw) => {
    if (!raw.trim()) return;
    const normalized = raw.replace(/\t/g, "    ");
    const marker = normalized.search(/(?:├──|└──|\|--|`--)/);
    let depth, name;
    if (marker >= 0) { depth = Math.floor(marker / 4) + 1; name = normalized.slice(marker).replace(/^(?:├──|└──|\|--|`--)\s*/, "").trim(); }
    else { const match = normalized.match(/^(\s*)(?:[-+→]\s+)?(.+?)\s*$/); if (!match) return; depth = Math.floor(match[1].length / 2); name = match[2]; }
    name = name.replace(/^`|`$/g, ""); const folder = /\/$/.test(name); name = name.replace(/\/$/, "").trim(); if (!name) return;
    depth = Math.min(depth, stack.length); const node = makeNode(name, folder ? "folder" : "file");
    if (depth === 0) roots.push(node); else { const parent = stack[depth - 1]; if (!parent) roots.push(node); else { parent.type = "folder"; parent.children.push(node); } }
    stack[depth] = node; stack.length = depth + 1;
  });
  if (!roots.length) throw new Error("読み取れるノードがありません。形式を確認してください。");
  return roots;
}

function validateImport(value) {
  if (!Array.isArray(value)) throw new Error("JSONのルートは配列にしてください。");
  function safe(node, depth = 0) { if (!node || typeof node.name !== "string" || !["file", "folder"].includes(node.type) || depth > 50) throw new Error("File Tree Builder形式のJSONではありません。"); return makeNode(node.name.slice(0, 200), node.type, node.type === "folder" && Array.isArray(node.children) ? node.children.map((child) => safe(child, depth + 1)) : []); }
  return value.map((node) => safe(node));
}

if (typeof document !== "undefined") {
  const $ = (selector) => document.querySelector(selector);
  const el = { tree: $("#tree"), empty: $("#emptyState"), preview: $("#preview"), format: $("#formatSelect"), status: $("#status"), custom: $("#customPanel"), dialog: $("#importDialog"), dialogTitle: $("#dialogTitle"), dialogHelp: $("#dialogHelp"), importText: $("#importText"), importError: $("#importError"), undo: $("#undoButton"), redo: $("#redoButton") };
  let nodes; try { nodes = validateImport(JSON.parse(localStorage.getItem(STORAGE_KEY))).map((node) => node); } catch { nodes = sampleTree(); }
  let undoStack = [], redoStack = [], draggedId = null, importMode = "text", statusTimer;
  const customOptions = () => ({ folderSymbol: $("#folderSymbol").value, fileSymbol: $("#fileSymbol").value, branchSymbol: $("#branchSymbol").value, bulletSymbol: $("#bulletSymbol").value, arrowSymbol: $("#arrowSymbol").value, indentWidth: $("#indentWidth").value, trailingSlash: $("#trailingSlash").checked, showEmoji: $("#showEmoji").checked });
  function announce(message) { clearTimeout(statusTimer); el.status.textContent = message; statusTimer = setTimeout(() => { el.status.textContent = ""; }, 2400); }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes)); }
  function snapshot() { undoStack.push(clone(nodes)); if (undoStack.length > 60) undoStack.shift(); redoStack = []; }
  function commit() { save(); render(); }
  function change(callback) { snapshot(); callback(); commit(); }
  function startEdit(row, node) { const name = row.querySelector(".node-name"), input = document.createElement("input"); input.className = "name-input"; input.value = node.name; input.maxLength = 200; input.setAttribute("aria-label", "名前を編集"); name.replaceWith(input); input.focus(); input.select(); let done = false; const finish = (cancel = false) => { if (done) return; done = true; const value = input.value.trim(); if (!cancel && value && value !== node.name) change(() => { node.name = value; }); else render(); }; input.addEventListener("keydown", (event) => { if (event.key === "Enter") finish(); if (event.key === "Escape") finish(true); }); input.addEventListener("blur", () => finish()); }
  function addChild(parent, type) { const node = makeNode(type === "folder" ? "new-folder" : "new-file.txt", type); change(() => { if (parent) { parent.type = "folder"; parent.open = true; parent.children.push(node); } else nodes.push(node); }); requestAnimationFrame(() => { const row = document.querySelector(`[data-id="${node.id}"]`); if (row) startEdit(row, node); }); }
  function createRow(node, depth) { const row = document.createElement("div"); row.className = "node-row"; row.dataset.id = node.id; row.style.setProperty("--depth", depth); row.draggable = true; row.setAttribute("role", "treeitem"); row.setAttribute("aria-level", depth + 1); row.setAttribute("aria-expanded", node.type === "folder" ? String(node.open) : "false");
    const handle = document.createElement("span"); handle.className = "drag-handle"; handle.textContent = "⠿"; handle.title = "ドラッグして移動";
    const toggle = document.createElement("button"); toggle.className = `toggle${node.type === "file" ? " placeholder" : ""}`; toggle.textContent = node.open ? "▾" : "▸"; toggle.setAttribute("aria-label", node.open ? "折りたたむ" : "展開する"); toggle.onclick = () => { node.open = !node.open; commit(); };
    const icon = document.createElement("span"); icon.className = "node-icon"; icon.textContent = node.type === "folder" ? (node.open ? "📂" : "📁") : "📄";
    const name = document.createElement("span"); name.className = "node-name"; name.textContent = node.name;
    const actions = document.createElement("span"); actions.className = "node-actions";
    const action = (label, symbol, callback, className = "") => { const button = document.createElement("button"); button.type = "button"; button.title = label; button.setAttribute("aria-label", label); button.textContent = symbol; button.className = className; button.onclick = callback; actions.append(button); };
    action("子フォルダを追加", "＋📁", () => addChild(node, "folder")); action("子ファイルを追加", "＋📄", () => addChild(node, "file")); action("名前変更", "✎", () => startEdit(row, node)); action("削除", "×", () => { if (node.children.length && !confirm(`「${node.name}」とその中身を削除しますか？`)) return; change(() => detachNode(nodes, node.id)); }, "delete");
    row.append(handle, toggle, icon, name, actions);
    row.addEventListener("dragstart", (event) => { draggedId = node.id; row.classList.add("dragging"); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", node.id); }); row.addEventListener("dragend", () => { draggedId = null; document.querySelectorAll(".node-row").forEach((item) => item.classList.remove("dragging", "drop-before", "drop-after", "drop-inside")); });
    row.addEventListener("dragover", (event) => { if (!draggedId || draggedId === node.id) return; const source = findNode(nodes, draggedId)?.node; if (!source || contains(source, node.id)) return; event.preventDefault(); document.querySelectorAll(".node-row").forEach((item) => item.classList.remove("drop-before", "drop-after", "drop-inside")); const ratio = (event.clientY - row.getBoundingClientRect().top) / row.offsetHeight; row.classList.add(node.type === "folder" && ratio > .25 && ratio < .75 ? "drop-inside" : ratio <= .5 ? "drop-before" : "drop-after"); });
    row.addEventListener("drop", (event) => { event.preventDefault(); const mode = row.classList.contains("drop-inside") ? "inside" : row.classList.contains("drop-before") ? "before" : "after"; const source = findNode(nodes, draggedId)?.node; if (!source || contains(source, node.id)) return; change(() => { const moved = detachNode(nodes, draggedId); const target = findNode(nodes, node.id); if (mode === "inside") { node.open = true; node.children.push(moved); } else { const list = target.parent ? target.parent.children : nodes; list.splice(list.indexOf(node) + (mode === "after" ? 1 : 0), 0, moved); } }); }); return row; }
  function render() { el.tree.replaceChildren(); walk(nodes, (node, depth) => { let visible = true, current = findNode(nodes, node.id); while (current?.parent) { if (!current.parent.open) visible = false; current = findNode(nodes, current.parent.id); } if (visible) el.tree.append(createRow(node, depth)); }); el.tree.hidden = !nodes.length; el.empty.classList.toggle("visible", !nodes.length); el.preview.textContent = formatTree(nodes, el.format.value, customOptions()) || "ツリーは空です。"; el.custom.open = el.format.value === "custom"; el.undo.disabled = !undoStack.length; el.redo.disabled = !redoStack.length; }
  $("#addRootButton").onclick = () => addChild(null, "folder"); $("#sampleButton").onclick = () => change(() => { nodes = sampleTree(); }); $("#clearButton").onclick = () => { if (nodes.length && confirm("ツリーをすべて削除しますか？")) change(() => { nodes = []; }); };
  $("#expandButton").onclick = () => { walk(nodes, (node) => { node.open = true; }); commit(); }; $("#collapseButton").onclick = () => { walk(nodes, (node) => { node.open = false; }); commit(); };
  el.undo.onclick = () => { if (!undoStack.length) return; redoStack.push(clone(nodes)); nodes = undoStack.pop(); commit(); }; el.redo.onclick = () => { if (!redoStack.length) return; undoStack.push(clone(nodes)); nodes = redoStack.pop(); commit(); };
  el.format.onchange = render; document.querySelectorAll(".custom-grid input").forEach((input) => input.addEventListener("input", render));
  $("#copyButton").onclick = async () => { try { await navigator.clipboard.writeText(formatTree(nodes, el.format.value, customOptions())); announce("コピーしました"); } catch { const range = document.createRange(); range.selectNodeContents(el.preview); getSelection().removeAllRanges(); getSelection().addRange(range); announce("選択しました。Ctrl / ⌘ + C でコピーしてください"); } };
  function openImport(mode) { importMode = mode; el.dialogTitle.textContent = mode === "json" ? "JSONから読み込む" : "Treeテキストを読み込む"; el.dialogHelp.textContent = mode === "json" ? "このツールから保存したJSONを貼り付けてください。" : "一般的な tree コマンド形式を貼り付けてください。"; el.importText.value = ""; el.importError.textContent = ""; el.dialog.showModal(); el.importText.focus(); }
  $("#textImportButton").onclick = () => openImport("text"); $("#jsonImportButton").onclick = () => openImport("json"); $("#importConfirmButton").onclick = () => { try { const imported = importMode === "json" ? validateImport(JSON.parse(el.importText.value)) : parseTreeText(el.importText.value); change(() => { nodes = imported; }); el.dialog.close(); announce("ツリーを読み込みました"); } catch (error) { el.importError.textContent = error instanceof SyntaxError ? "JSONの構文を確認してください。" : error.message; } };
  $("#jsonExportButton").onclick = () => { const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "file-tree.json"; link.click(); URL.revokeObjectURL(link.href); announce("JSONを保存しました"); };
  render();
}

if (typeof module !== "undefined") module.exports = { makeNode, sampleTree, formatTree, parseTreeText, validateImport, contains };
