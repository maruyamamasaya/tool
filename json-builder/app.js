"use strict";

let nextId = 1;
const primitiveDefaults = { string: "", number: 0, boolean: true, null: null, object: {}, array: [] };
const templates = [
  { id: "blank", icon: "＋", name: "空から作る", note: "まっさらなJSON", value: {} },
  { id: "profile", icon: "♙", name: "プロフィール", note: "ユーザー情報", value: { name: "山田 太郎", age: 30, active: true, skills: ["JavaScript", "Python"] } },
  { id: "api", icon: "↔", name: "APIレスポンス", note: "一覧データ", value: { status: "success", data: [{ id: 1, title: "サンプル" }], total: 1 } },
  { id: "config", icon: "⚙", name: "設定ファイル", note: "アプリの設定", value: { appName: "My App", debug: false, theme: { mode: "light", color: "green" } } }
];

function valueType(value) { if (value === null) return "null"; if (Array.isArray(value)) return "array"; return typeof value === "object" ? "object" : typeof value; }
function makeNode(key, value) { return { id: nextId++, key: String(key), type: valueType(value), value: (value && typeof value === "object") ? Object.entries(value).map(([k, v]) => makeNode(k, v)) : value }; }
function nodesFromValue(value) { return Object.entries(value).map(([key, item]) => makeNode(key, item)); }
function nodesToValue(nodes, containerType = "object") {
  if (containerType === "array") return nodes.map(nodeToValue);
  return Object.fromEntries(nodes.map((node) => [node.key, nodeToValue(node)]));
}
function nodeToValue(node) {
  if (node.type === "object" || node.type === "array") return nodesToValue(node.value, node.type);
  if (node.type === "number") { const number = Number(node.value); return Number.isFinite(number) ? number : 0; }
  if (node.type === "boolean") return Boolean(node.value);
  if (node.type === "null") return null;
  return String(node.value ?? "");
}
function changeNodeType(node, type) { node.type = type; node.value = (type === "object" || type === "array") ? [] : primitiveDefaults[type]; return node; }
function formatBytes(value) { const bytes = new TextEncoder().encode(value).length; return bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1)} KB`; }

if (typeof document !== "undefined") {
  const builder = document.querySelector("#builder"), preview = document.querySelector("#preview"), template = document.querySelector("#rowTemplate"), status = document.querySelector("#status");
  let rootType = "object", nodes = [], toastTimer;

  function announce(text) { status.textContent = text; status.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => status.classList.remove("show"), 1800); }
  function highlightJSON(json) { return json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|\b(true|false)\b|\b(null)\b|-?\d+(?:\.\d+)?/g, (match, key, string, bool, nil) => `<span class="${key ? "json-key" : string ? "json-string" : bool ? "json-boolean" : nil ? "json-null" : "json-number"}">${match}</span>`); }
  function getJSON() { return JSON.stringify(nodesToValue(nodes, rootType), null, 2); }
  function updatePreview() { const json = getJSON(); preview.innerHTML = highlightJSON(json); document.querySelector("#sizeText").textContent = formatBytes(json); }
  function addNode(list) { list.push(makeNode(rootType === "array" || list !== nodes ? "" : `key${list.length + 1}`, "")); render(); requestAnimationFrame(() => builder.querySelector(`[data-id="${list.at(-1).id}"] .key-input:not([hidden]), [data-id="${list.at(-1).id}"] .value-slot input`)?.focus()); }

  function renderList(list, containerType, host) {
    if (!list.length && host.classList.contains("children")) { const empty = document.createElement("div"); empty.className = "empty-collection"; empty.textContent = "まだ項目がありません"; host.append(empty); }
    list.forEach((node, index) => {
      const wrapper = document.createElement("div"); wrapper.className = "node"; wrapper.dataset.id = node.id; wrapper.append(template.content.cloneNode(true));
      const key = wrapper.querySelector(".key-input"), select = wrapper.querySelector(".type-select"), slot = wrapper.querySelector(".value-slot");
      if (containerType === "array") { key.hidden = true; key.value = String(index); } else { key.value = node.key; key.addEventListener("input", () => { node.key = key.value; updatePreview(); }); }
      select.value = node.type; select.addEventListener("change", () => { changeNodeType(node, select.value); render(); });
      if (node.type === "object" || node.type === "array") {
        const label = document.createElement("span"); label.className = "null-value"; label.textContent = node.type === "object" ? `{ ${node.value.length} 項目 }` : `[ ${node.value.length} 項目 ]`; slot.append(label);
        const children = document.createElement("div"); children.className = "children"; const head = document.createElement("div"); head.className = "collection-head"; head.textContent = node.type === "object" ? "オブジェクトの中身" : "配列の中身"; children.append(head); renderList(node.value, node.type, children); wrapper.append(children);
        const add = document.createElement("button"); add.className = "add-button nested-add"; add.type = "button"; add.textContent = node.type === "object" ? "＋ キーを追加" : "＋ 要素を追加"; add.addEventListener("click", () => addNode(node.value)); wrapper.append(add);
      } else if (node.type === "boolean") { slot.innerHTML = `<label class="boolean-control"><input type="checkbox" ${node.value ? "checked" : ""}><span>${node.value ? "true" : "false"}</span></label>`; const check = slot.querySelector("input"); check.addEventListener("change", () => { node.value = check.checked; render(); }); }
      else if (node.type === "null") { slot.innerHTML = '<span class="null-value">null</span>'; }
      else { const input = document.createElement("input"); input.type = node.type === "number" ? "number" : "text"; input.value = node.value; input.placeholder = node.type === "number" ? "0" : "値を入力"; input.setAttribute("aria-label", "値"); input.addEventListener("input", () => { node.value = input.value; updatePreview(); }); slot.append(input); }
      wrapper.querySelector(".delete-button").addEventListener("click", () => { list.splice(index, 1); render(); announce("項目を削除しました"); }); host.append(wrapper);
    });
  }
  function render() { builder.replaceChildren(); renderList(nodes, rootType, builder); const add = document.createElement("button"); add.className = "add-button"; add.type = "button"; add.textContent = rootType === "object" ? "＋ キーを追加" : "＋ 配列に要素を追加"; add.addEventListener("click", () => addNode(nodes)); builder.append(add); document.querySelectorAll("[data-root-type]").forEach((button) => button.classList.toggle("active", button.dataset.rootType === rootType)); updatePreview(); }
  function loadTemplate(item) { const copy = JSON.parse(JSON.stringify(item.value)); rootType = Array.isArray(copy) ? "array" : "object"; nodes = nodesFromValue(copy); document.querySelectorAll(".template-card").forEach((card) => card.classList.toggle("active", card.dataset.template === item.id)); render(); announce(`${item.name}を読み込みました`); }
  templates.forEach((item) => { const button = document.createElement("button"); button.className = "template-card"; button.type = "button"; button.dataset.template = item.id; button.innerHTML = `<span class="template-icon">${item.icon}</span><span><strong>${item.name}</strong><small>${item.note}</small></span>`; button.addEventListener("click", () => loadTemplate(item)); document.querySelector("#templates").append(button); });
  document.querySelectorAll("[data-root-type]").forEach((button) => button.addEventListener("click", () => { rootType = button.dataset.rootType; nodes = []; render(); }));
  document.querySelector("#clearButton").addEventListener("click", () => { nodes = []; render(); announce("内容をクリアしました"); });
  document.querySelector("#copyButton").addEventListener("click", async () => { const json = getJSON(); try { await navigator.clipboard.writeText(json); } catch { const area = document.createElement("textarea"); area.value = json; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); } announce("JSONをコピーしました"); });
  loadTemplate(templates[1]);
}

if (typeof module !== "undefined") module.exports = { valueType, makeNode, nodesFromValue, nodesToValue, nodeToValue, changeNodeType, formatBytes, templates };
