(function (root) {
  "use strict";

  const SAMPLE = `# Application settings
app:
  name: Atlas Portal
  version: 2.4.0
  enabled: true
  features:
    - authentication
    - search
    - analytics
  database:
    host: localhost
    port: 5432
    credentials:
      username: admin
      password: null
services:
  - name: web
    replicas: 3
  - name: worker
    replicas: 2`;

  function valueType(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value === "object" ? "object" : typeof value;
  }
  function formatValue(value) {
    return typeof value === "string" ? JSON.stringify(value) : value === null ? "null" : String(value);
  }
  function pathFor(parent, key, arrayItem) {
    if (arrayItem) return parent + "[" + key + "]";
    const safe = /^[A-Za-z_$][\w$-]*$/.test(String(key));
    return parent ? parent + (safe ? "." + key : "[" + JSON.stringify(String(key)) + "]") : (safe ? String(key) : "[" + JSON.stringify(String(key)) + "]");
  }
  function countNodes(value) {
    let count = 1;
    if (value && typeof value === "object") Object.values(value).forEach(function (child) { count += countNodes(child); });
    return count;
  }
  function normalizeTabs(source) {
    return source.split("\n").map(function (line) { return line.replace(/^\t+/, function (tabs) { return "  ".repeat(tabs.length); }); }).join("\n");
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { valueType, formatValue, pathFor, countNodes, normalizeTabs };
  if (!root.document) return;

  const byId = (id) => document.getElementById(id);
  const input = byId("yamlInput"), lineNumbers = byId("lineNumbers"), tree = byId("treeView"), codeView = byId("codeView");
  const empty = byId("emptyState"), errorBox = byId("inputError"), detail = byId("errorDetail"), selectionBar = byId("selectionBar");
  let documents = [], formatted = "", json = "", activeView = "tree", selectedValue, toastTimer;

  function updateInputMeta() {
    const lines = input.value.split("\n");
    lineNumbers.innerHTML = lines.map(function (_, i) { return "<span>" + (i + 1) + "</span>"; }).join("");
    byId("inputStats").textContent = lines.length.toLocaleString() + " lines · " + new Blob([input.value]).size.toLocaleString() + " B";
    lineNumbers.scrollTop = input.scrollTop;
  }
  function showToast(message) {
    const toast = byId("toast"); toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); showToast("Copied!"); }
    catch (_) { showToast("Copy failed"); }
  }
  function selectNode(row, path, value) {
    tree.querySelectorAll(".node-row.selected").forEach((node) => node.classList.remove("selected"));
    row.classList.add("selected"); byId("selectedPath").textContent = path || "$"; selectedValue = value; selectionBar.hidden = false;
  }
  function createNode(key, value, path, isArrayItem) {
    const type = valueType(value), container = type === "array" || type === "object";
    const item = document.createElement("div"); item.className = "tree-node"; item.setAttribute("role", "treeitem");
    const row = document.createElement("div"); row.className = "node-row"; row.dataset.search = (String(key) + " " + formatValue(value)).toLowerCase();
    const toggle = document.createElement("button"); toggle.className = container ? "toggle" : "toggle spacer"; toggle.type = "button"; toggle.textContent = container ? "▾" : ""; toggle.tabIndex = container ? 0 : -1; row.appendChild(toggle);
    const keyEl = document.createElement("span"); keyEl.className = isArrayItem ? "key index" : "key"; keyEl.textContent = isArrayItem ? "[" + key + "]" : String(key); row.appendChild(keyEl);
    if (container) {
      const badge = document.createElement("span"); badge.className = "type-label type-" + type; badge.textContent = type;
      const count = document.createElement("span"); count.className = "count"; count.textContent = (type === "array" ? value.length : Object.keys(value).length) + (type === "array" ? " items" : " keys"); row.append(badge, count);
    } else {
      const colon = document.createElement("span"); colon.className = "colon"; colon.textContent = ":";
      const val = document.createElement("span"); val.className = "value type-" + type; val.textContent = formatValue(value); row.append(colon, val);
    }
    row.addEventListener("click", () => selectNode(row, path, value)); item.appendChild(row);
    if (container) {
      const children = document.createElement("div"); children.className = "children"; children.setAttribute("role", "group");
      Object.entries(value).forEach(function ([childKey, child]) { children.appendChild(createNode(childKey, child, pathFor(path, childKey, type === "array"), type === "array")); });
      if (!Object.keys(value).length) { const none = document.createElement("span"); none.className = "empty-value"; none.textContent = "Empty " + type; children.appendChild(none); }
      toggle.setAttribute("aria-expanded", "true"); toggle.addEventListener("click", function (event) { event.stopPropagation(); const closed = children.hidden; children.hidden = !closed; toggle.textContent = closed ? "▾" : "›"; toggle.setAttribute("aria-expanded", String(closed)); });
      item.appendChild(children);
    }
    return item;
  }
  function renderTree() {
    tree.replaceChildren();
    documents.forEach(function (doc, i) {
      if (documents.length > 1) { const label = document.createElement("div"); label.className = "document-label"; label.textContent = "DOCUMENT " + (i + 1); tree.appendChild(label); }
      tree.appendChild(createNode(documents.length > 1 ? "document " + (i + 1) : "root", doc, documents.length > 1 ? "$[" + i + "]" : "", false));
    });
  }
  function setView(view) {
    activeView = view;
    document.querySelectorAll(".tab").forEach(function (tab) { const active = tab.dataset.view === view; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
    tree.hidden = view !== "tree"; codeView.hidden = view === "tree"; byId("treeControls").hidden = view !== "tree"; byId("copyOutputButton").hidden = view === "tree";
    if (view !== "tree") codeView.querySelector("code").textContent = view === "yaml" ? formatted : json;
  }
  function parseYaml() {
    errorBox.hidden = true; input.classList.remove("has-error"); selectionBar.hidden = true;
    if (!input.value.trim()) { documents = []; tree.replaceChildren(); empty.hidden = false; byId("documentStats").textContent = "Waiting for input"; return; }
    if (!root.jsyaml) { errorBox.hidden = false; detail.textContent = "YAML parser could not be loaded. Check your connection and reload."; return; }
    try {
      const source = normalizeTabs(input.value); documents = [];
      root.jsyaml.loadAll(source, function (doc) { if (doc !== undefined) documents.push(doc); });
      if (!documents.length) documents.push(null);
      formatted = documents.map((doc) => root.jsyaml.dump(doc, { indent: 2, noRefs: true, lineWidth: 100 })).join("---\n");
      json = JSON.stringify(documents.length === 1 ? documents[0] : documents, null, 2);
      renderTree(); empty.hidden = true; byId("documentStats").textContent = documents.length + (documents.length === 1 ? " document" : " documents") + " · " + documents.reduce((n, doc) => n + countNodes(doc), 0).toLocaleString() + " nodes";
      byId("expandButton").disabled = false; byId("collapseButton").disabled = false; setView(activeView); filterTree();
    } catch (error) {
      documents = []; tree.replaceChildren(); empty.hidden = true; errorBox.hidden = false; input.classList.add("has-error");
      const mark = error.mark; detail.textContent = (mark ? "Line " + (mark.line + 1) + ", column " + (mark.column + 1) + ": " : "") + (error.reason || error.message || "Unable to parse YAML");
      if (mark) { input.focus(); const lines = input.value.split("\n"), start = lines.slice(0, mark.line).reduce((n, line) => n + line.length + 1, 0); input.setSelectionRange(start, start + (lines[mark.line] || "").length); lineNumbers.querySelectorAll("span")[mark.line]?.classList.add("error-line"); }
    }
  }
  function setAll(expanded) { tree.querySelectorAll(".children").forEach((child) => child.hidden = !expanded); tree.querySelectorAll(".toggle:not(.spacer)").forEach(function (toggle) { toggle.textContent = expanded ? "▾" : "›"; toggle.setAttribute("aria-expanded", String(expanded)); }); }
  function filterTree() {
    const query = byId("searchInput").value.trim().toLowerCase();
    tree.querySelectorAll(".node-row").forEach(function (row) { row.classList.toggle("match", !!query && row.dataset.search.includes(query)); });
    if (query) tree.querySelectorAll(".node-row.match").forEach(function (row) { let parent = row.parentElement; while (parent && parent !== tree) { parent.hidden = false; parent = parent.parentElement; } });
  }
  input.addEventListener("input", updateInputMeta); input.addEventListener("scroll", updateInputMeta);
  input.addEventListener("keydown", function (event) { if (event.key === "Tab") { event.preventDefault(); input.setRangeText("  ", input.selectionStart, input.selectionEnd, "end"); updateInputMeta(); } if ((event.ctrlKey || event.metaKey) && event.key === "Enter") parseYaml(); });
  byId("viewButton").addEventListener("click", parseYaml); byId("sampleButton").addEventListener("click", function () { input.value = SAMPLE; updateInputMeta(); parseYaml(); });
  byId("clearButton").addEventListener("click", function () { input.value = ""; errorBox.hidden = true; input.classList.remove("has-error"); updateInputMeta(); parseYaml(); input.focus(); });
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
  byId("expandButton").addEventListener("click", () => setAll(true)); byId("collapseButton").addEventListener("click", () => setAll(false)); byId("searchInput").addEventListener("input", filterTree);
  byId("copyOutputButton").addEventListener("click", () => copy(activeView === "yaml" ? formatted : json)); byId("copyPathButton").addEventListener("click", () => copy(byId("selectedPath").textContent)); byId("copyValueButton").addEventListener("click", () => copy(typeof selectedValue === "string" ? selectedValue : JSON.stringify(selectedValue, null, 2)));
  const dropZone = byId("dropZone"); ["dragenter", "dragover"].forEach((name) => dropZone.addEventListener(name, function (event) { event.preventDefault(); dropZone.classList.add("dragging"); })); ["dragleave", "drop"].forEach((name) => dropZone.addEventListener(name, () => dropZone.classList.remove("dragging")));
  dropZone.addEventListener("drop", function (event) { event.preventDefault(); const file = event.dataTransfer.files[0]; if (!file || !/\.ya?ml$/i.test(file.name)) { showToast("Please choose a .yaml or .yml file"); return; } const reader = new FileReader(); reader.onload = () => { input.value = reader.result; updateInputMeta(); parseYaml(); }; reader.readAsText(file); });
  updateInputMeta();
}(typeof globalThis !== "undefined" ? globalThis : this));
