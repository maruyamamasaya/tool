(function () {
  "use strict";

  function parseDelimited(text, delimiter) {
    const values = []; let field = ""; let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (char === '"') {
        if (quoted && text[i + 1] === '"') { field += '"'; i += 1; } else quoted = !quoted;
      } else if (!quoted && (char === delimiter || char === "\n" || char === "\r")) {
        values.push(field); field = "";
        if (char === "\r" && text[i + 1] === "\n") i += 1;
      } else field += char;
    }
    values.push(field); return values;
  }

  function detectFormat(text) {
    const sample = String(text).split(/\r?\n/).filter((line) => line.trim()).slice(0, 8);
    if (sample.length > 1) return "newline";
    if (String(text).includes("\t")) return "tab";
    if (String(text).includes(",")) return "comma";
    if (String(text).includes(";")) return "semicolon";
    return "newline";
  }

  function parseItems(value, format = "auto", unique = true) {
    const text = String(value || "").trim(); if (!text) return [];
    if (format === "auto" && /^\s*\[/.test(text)) {
      try { const data = JSON.parse(text); if (Array.isArray(data)) return normalize(data, unique); } catch (_) { /* fall through */ }
    }
    const resolved = format === "auto" ? detectFormat(text) : format;
    let raw;
    if (resolved === "newline") raw = text.split(/\r?\n/);
    else raw = parseDelimited(text, { comma: ",", tab: "\t", semicolon: ";" }[resolved]);
    return normalize(raw, unique);
  }

  function normalize(values, unique) {
    const cleaned = values.map((item) => String(item).trim().replace(/^(?:[-*•▪◦]|\d+[.)])\s+/, "")).filter(Boolean);
    return unique ? [...new Set(cleaned)] : cleaned;
  }

  function pick(items, random = Math.random) {
    if (!items.length) throw new Error("候補を1件以上入力してください");
    return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
  }

  if (typeof module !== "undefined") module.exports = { detectFormat, parseDelimited, parseItems, pick };
  if (typeof document === "undefined") return;

  const $ = (selector) => document.querySelector(selector); const history = []; let items = [];
  function escapeHtml(value) { const node = document.createElement("div"); node.textContent = value; return node.innerHTML; }
  function update() {
    items = parseItems($("#source").value, $("#format").value, $("#unique").checked);
    $("#count").textContent = items.length.toLocaleString("ja-JP"); $("#odds").textContent = items.length ? `当選確率 1 / ${items.length}` : "候補がありません";
    $("#chips").innerHTML = items.slice(0, 8).map((item) => `<span>${escapeHtml(item)}</span>`).join("") + (items.length > 8 ? `<span class="more">+${items.length - 8}</span>` : "");
    $("#draw").disabled = !items.length; $("#error").hidden = true;
  }
  function renderHistory() { $("#history").innerHTML = history.length ? history.map((item, index) => `<li><span>${history.length - index}</span><b>${escapeHtml(item)}</b></li>`).join("") : '<li class="empty">まだ抽選していません</li>'; }
  function draw() {
    try {
      const chosen = pick(items); $("#picked").textContent = chosen; $("#resultNote").textContent = `${items.length}件の中から選ばれました`;
      const result = $("#result"); result.classList.remove("reveal"); void result.offsetWidth; result.classList.add("reveal"); history.unshift(chosen); if (history.length > 10) history.pop(); renderHistory();
    } catch (error) { $("#error").textContent = error.message; $("#error").hidden = false; }
  }
  function loadFile(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { $("#source").value = reader.result; $("#format").value = "auto"; update(); }; reader.readAsText(file); }
  $("#source").addEventListener("input", update); $("#format").addEventListener("change", update); $("#unique").addEventListener("change", update); $("#draw").addEventListener("click", draw);
  $("#clear").addEventListener("click", () => { $("#source").value = ""; update(); $("#source").focus(); }); $("#clearHistory").addEventListener("click", () => { history.length = 0; renderHistory(); }); $("#fileInput").addEventListener("change", (event) => loadFile(event.target.files[0]));
  const drop = $("#dropZone"); ["dragenter", "dragover"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add("dragging"); })); ["dragleave", "drop"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove("dragging"); })); drop.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));
  update();
}());
