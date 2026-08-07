(function (root) {
  "use strict";

  function byteLength(text) {
    return typeof TextEncoder !== "undefined" ? new TextEncoder().encode(text).length : Buffer.byteLength(text, "utf8");
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (!quoted && char === ",") { row.push(field); field = ""; }
      else if (!quoted && (char === "\n" || char === "\r")) {
        row.push(field); field = ""; rows.push(row); row = [];
        if (char === "\r" && text[i + 1] === "\n") i += 1;
      } else field += char;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function scalar(value) {
    const source = value.trim();
    if (/^(null|~)$/i.test(source)) return null;
    if (/^(true|false)$/i.test(source)) return source.toLowerCase() === "true";
    if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(source)) return Number(source);
    return source.replace(/^(["'])(.*)\1$/, "$2");
  }

  // A deliberately small, dependency-free YAML reader for common maps and lists.
  function parseYaml(text) {
    const lines = text.split(/\r?\n/).filter(function (line) { return line.trim() && !/^\s*#/.test(line); });
    if (!lines.length) return {};
    const rootValue = /^\s*-\s/.test(lines[0]) ? [] : {};
    const stack = [{ indent: -1, value: rootValue }];
    lines.forEach(function (line, index) {
      const indent = (line.match(/^\s*/) || [""])[0].length;
      const content = line.trim().replace(/\s+#.*$/, "");
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
      const parent = stack[stack.length - 1].value;
      if (content.indexOf("- ") === 0 || content === "-") {
        if (!Array.isArray(parent)) throw new Error((index + 1) + "行目: リストの位置が正しくありません");
        const item = content.slice(1).trim();
        if (!item) { const child = {}; parent.push(child); stack.push({ indent: indent, value: child }); }
        else if (/^[^:]+:/.test(item)) {
          const split = item.indexOf(":"); const child = {}; const rest = item.slice(split + 1).trim();
          child[item.slice(0, split).trim()] = rest ? scalar(rest) : {};
          parent.push(child); stack.push({ indent: indent, value: child });
        } else parent.push(scalar(item));
      } else {
        const split = content.indexOf(":");
        if (split < 1 || Array.isArray(parent)) throw new Error((index + 1) + "行目: key: value の形式ではありません");
        const key = content.slice(0, split).trim(); const rest = content.slice(split + 1).trim();
        if (rest) parent[key] = scalar(rest);
        else {
          const next = lines[index + 1];
          const child = next && /^\s*-\s/.test(next) && (next.match(/^\s*/) || [""])[0].length > indent ? [] : {};
          parent[key] = child; stack.push({ indent: indent, value: child });
        }
      }
    });
    return rootValue;
  }

  function depthOf(value) {
    if (value === null || typeof value !== "object") return 0;
    const values = Array.isArray(value) ? value : Object.values(value);
    return values.length ? 1 + Math.max.apply(null, values.map(depthOf)) : 1;
  }

  function collect(value, totals) {
    if (value === null) totals.nulls += 1;
    else if (Array.isArray(value)) value.forEach(function (item) { collect(item, totals); });
    else if (typeof value === "object") Object.values(value).forEach(function (item) { collect(item, totals); });
    else if (typeof value === "string") totals.strings += 1;
    else if (typeof value === "number") totals.numbers += 1;
    else if (typeof value === "boolean") totals.booleans += 1;
  }

  function textStats(text) {
    let half = 0, full = 0;
    Array.from(text).forEach(function (char) {
      const code = char.codePointAt(0);
      if (code <= 0x7f || (code >= 0xff61 && code <= 0xff9f)) half += 1;
      else full += 1;
    });
    return { characters: Array.from(text).length, bytes: byteLength(text), lines: text ? text.split(/\r\n|\r|\n/).length : 0, halfWidth: half, fullWidth: full };
  }

  function inspect(text, name) {
    const base = textStats(text); const trimmed = text.trim(); const lowerName = (name || "").toLowerCase();
    let format = "TEXT", data = null, records = null;
    if (/\.json$/.test(lowerName) || /^[\[{]/.test(trimmed)) { format = "JSON"; data = JSON.parse(trimmed); }
    else if (/\.csv$/.test(lowerName) || (/^[^\n,]+,[^\n]+/.test(trimmed) && trimmed.indexOf("\n") >= 0)) {
      format = "CSV"; data = parseCsv(text); records = Math.max(0, data.length - 1);
    } else if (/\.ya?ml$/.test(lowerName) || (/^[\w"'][^\n:]*:\s*.+/m.test(trimmed) && !/^https?:/i.test(trimmed))) {
      format = "YAML"; data = parseYaml(text);
    } else if (/\.xml$/.test(lowerName) || /^<\?xml|^<[\w:-]+[\s>]/.test(trimmed)) {
      format = "XML";
      if (typeof DOMParser === "undefined") throw new Error("この環境ではXMLを解析できません");
      const doc = new DOMParser().parseFromString(trimmed, "application/xml");
      const parseError = doc.querySelector("parsererror");
      if (parseError) throw new Error("XMLの構文を確認してください");
      function xmlValue(node) {
        const children = Array.from(node.children); if (!children.length) return node.textContent.trim();
        const out = {}; children.forEach(function (child) { const value = xmlValue(child); if (out[child.tagName] === undefined) out[child.tagName] = value; else if (Array.isArray(out[child.tagName])) out[child.tagName].push(value); else out[child.tagName] = [out[child.tagName], value]; }); return out;
      }
      data = {}; data[doc.documentElement.tagName] = xmlValue(doc.documentElement);
    }
    const totals = { nulls: 0, strings: 0, numbers: 0, booleans: 0 };
    if (data !== null) collect(data, totals);
    if (records === null && data !== null) records = Array.isArray(data) ? data.length : 1;
    return Object.assign(base, totals, { format: format, records: records, depth: data === null ? null : depthOf(data) });
  }

  const api = { inspect: inspect, parseCsv: parseCsv, parseYaml: parseYaml, textStats: textStats };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!root.document) return;

  const $ = function (id) { return document.getElementById(id); };
  const input = $("dataInput"), fileInput = $("fileInput"), dropZone = $("dropZone"), results = $("results"), error = $("errorMessage");
  let fileName = "";
  function readableBytes(bytes) { if (bytes < 1024) return bytes.toLocaleString() + " B"; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"; return (bytes / 1048576).toFixed(1) + " MB"; }
  function run() {
    error.hidden = true;
    if (!input.value) { error.textContent = "解析するデータを入力してください。"; error.hidden = false; results.hidden = true; return; }
    try {
      const stats = inspect(input.value, fileName); const items = [
        ["形式", stats.format], ["サイズ", readableBytes(stats.bytes)], ["文字数", stats.characters.toLocaleString()], ["行数", stats.lines.toLocaleString()]
      ];
      if (stats.format !== "TEXT") items.push(["レコード", stats.records.toLocaleString()], ["階層", stats.depth.toLocaleString()], ["NULL", stats.nulls.toLocaleString()], ["Boolean", stats.booleans.toLocaleString()], ["文字列", stats.strings.toLocaleString()], ["数値", stats.numbers.toLocaleString()]);
      $("statGrid").innerHTML = items.map(function (item) { return '<div class="stat"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>'; }).join("");
      $("formatBadge").textContent = stats.format; $("resultTitle").textContent = fileName || "貼り付けたデータ";
      const widthTotal = stats.halfWidth + stats.fullWidth || 1;
      $("halfBar").value = stats.halfWidth / widthTotal * 100; $("fullBar").value = stats.fullWidth / widthTotal * 100;
      $("halfCount").textContent = stats.halfWidth.toLocaleString() + " 文字"; $("fullCount").textContent = stats.fullWidth.toLocaleString() + " 文字";
      results.hidden = false; results.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caught) { error.textContent = "解析できませんでした: " + caught.message; error.hidden = false; results.hidden = true; }
  }
  function readFile(file) { if (!file) return; fileName = file.name; const reader = new FileReader(); reader.onload = function () { input.value = String(reader.result); $("liveCount").textContent = textStats(input.value).characters.toLocaleString() + " 文字"; run(); }; reader.onerror = function () { error.textContent = "ファイルを読み込めませんでした。"; error.hidden = false; }; reader.readAsText(file); }
  input.addEventListener("input", function () { fileName = ""; $("liveCount").textContent = textStats(input.value).characters.toLocaleString() + " 文字"; });
  $("inspectButton").addEventListener("click", run); $("selectButton").addEventListener("click", function (event) { event.stopPropagation(); fileInput.click(); });
  dropZone.addEventListener("click", function () { fileInput.click(); }); dropZone.addEventListener("keydown", function (event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener("change", function () { readFile(fileInput.files[0]); });
  ["dragenter", "dragover"].forEach(function (type) { dropZone.addEventListener(type, function (event) { event.preventDefault(); dropZone.classList.add("is-dragging"); }); });
  ["dragleave", "drop"].forEach(function (type) { dropZone.addEventListener(type, function (event) { event.preventDefault(); dropZone.classList.remove("is-dragging"); }); });
  dropZone.addEventListener("drop", function (event) { readFile(event.dataTransfer.files[0]); });
}(typeof globalThis !== "undefined" ? globalThis : this));
