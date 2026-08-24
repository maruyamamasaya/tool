(function () {
  "use strict";
  const STORAGE_KEY = "sqlPlaygroundTablesV1";
  const WARNING_LIMIT = 100;
  const SAMPLE_SQL = "CREATE TABLE projects (id INTEGER, name TEXT, active BOOLEAN);\n\nINSERT INTO projects (id, name, active) VALUES\n  (1, 'Webサイト更新', true),\n  (2, 'マニュアル作成', false);\n\nSELECT * FROM projects ORDER BY id;";
  const DEFAULT_TABLES = {
    users: { columns: ["id", "name", "role", "active"], rows: [[1, "佐藤 花子", "admin", true], [2, "鈴木 一郎", "editor", true], [3, "高橋 美咲", "viewer", false], [4, "田中 健太", "editor", true]] },
    orders: { columns: ["id", "user_id", "amount", "status"], rows: [[101, 1, 12800, "paid"], [102, 2, 6500, "pending"], [103, 1, 3200, "paid"]] }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function parseValue(value) {
    const text = String(value).trim();
    if (/^null$/i.test(text)) return null;
    if (/^true$/i.test(text)) return true;
    if (/^false$/i.test(text)) return false;
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    const quote = text.match(/^(['"])([\s\S]*)\1$/);
    return quote ? quote[2].replace(/''/g, "'") : text;
  }
  function splitComma(text) {
    const parts = []; let current = ""; let quote = null;
    for (const char of text) {
      if ((char === "'" || char === '"') && (!quote || quote === char)) quote = quote ? null : char;
      if (char === "," && !quote) { parts.push(current.trim()); current = ""; } else current += char;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }
  function splitStatements(sql) {
    const statements = []; let current = ""; let quote = null; let depth = 0;
    for (let index = 0; index < sql.length; index += 1) {
      const char = sql[index]; const next = sql[index + 1];
      if (quote) {
        current += char;
        if (char === quote && next === quote) { current += next; index += 1; }
        else if (char === quote) quote = null;
      } else if (char === "'" || char === '"') { quote = char; current += char; }
      else if (char === "(") { depth += 1; current += char; }
      else if (char === ")") { depth -= 1; current += char; }
      else if (char === ";" && depth === 0) { if (current.trim()) statements.push(current.trim()); current = ""; }
      else current += char;
    }
    if (quote || depth !== 0) throw new Error("引用符または括弧が閉じられていません。");
    if (current.trim()) statements.push(current.trim());
    if (!statements.length) throw new Error("SQLを入力してください。");
    return statements;
  }
  function parseSQL(sql) {
    const clean = sql.trim().replace(/;\s*$/, "");
    if (!clean) throw new Error("SQLを入力してください。");
    if (!/^select\b/i.test(clean)) throw new Error("SELECT文の形式を確認してください。");
    const match = clean.match(/^select\s+([\s\S]+?)\s+from\s+([a-zA-Z_]\w*)(?:\s+(?:as\s+)?[a-zA-Z_]\w*)?(?:\s+where\s+([\s\S]*?))?(?:\s+order\s+by\s+([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)?)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/i);
    if (!match) throw new Error("SQLを解析できません。SELECT / FROM / WHERE / ORDER BY / LIMIT の形式を確認してください。");
    return { fields: splitComma(match[1]), table: match[2], where: match[3], order: match[4] && match[4].split(".").pop(), direction: (match[5] || "asc").toLowerCase(), limit: match[6] ? Number(match[6]) : null };
  }
  function matchesWhere(row, expression) {
    if (!expression) return true;
    return expression.split(/\s+and\s+/i).every((condition) => {
      const match = condition.trim().match(/^(?:\w+\.)?([a-zA-Z_]\w*)\s*(=|!=|<>|>=|<=|>|<|like)\s*([\s\S]+)$/i);
      if (!match) throw new Error(`WHERE条件「${condition.trim()}」には対応していません。`);
      if (!Object.prototype.hasOwnProperty.call(row, match[1])) throw new Error(`列「${match[1]}」が見つかりません。`);
      const left = row[match[1]]; const right = parseValue(match[3]); const operator = match[2].toLowerCase();
      if (operator === "like") { const pattern = String(right).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, "."); return new RegExp(`^${pattern}$`, "i").test(String(left)); }
      if (operator === "=") return left === right || String(left) === String(right);
      if (operator === "!=" || operator === "<>") return !(left === right || String(left) === String(right));
      return operator === ">" ? left > right : operator === "<" ? left < right : operator === ">=" ? left >= right : left <= right;
    });
  }
  function executeSelect(sql, tables) {
    const query = parseSQL(sql); const table = tables[query.table];
    if (!table) throw new Error(`テーブル「${query.table}」が見つかりません。`);
    let rows = table.rows.map((values) => Object.fromEntries(table.columns.map((column, index) => [column, values[index]]))).filter((row) => matchesWhere(row, query.where));
    if (query.order) {
      if (!table.columns.includes(query.order)) throw new Error(`列「${query.order}」が見つかりません。`);
      rows.sort((a, b) => (a[query.order] === b[query.order] ? 0 : a[query.order] > b[query.order] ? 1 : -1) * (query.direction === "desc" ? -1 : 1));
    }
    if (query.limit !== null) rows = rows.slice(0, query.limit);
    const count = query.fields.length === 1 && /^count\(\*\)(?:\s+(?:as\s+)?([a-zA-Z_]\w*))?$/i.test(query.fields[0]);
    if (count) { const name = query.fields[0].match(/^count\(\*\)(?:\s+(?:as\s+)?([a-zA-Z_]\w*))?$/i)[1] || "count"; return { columns: [name], rows: [[rows.length]] }; }
    const fields = query.fields[0] === "*" ? table.columns.map((name) => ({ source: name, name })) : query.fields.map((field) => {
      const match = field.match(/^(?:\w+\.)?([a-zA-Z_]\w*)(?:\s+(?:as\s+)?([a-zA-Z_]\w*))?$/i);
      if (!match || !table.columns.includes(match[1])) throw new Error(`列指定「${field}」を確認してください。`);
      return { source: match[1], name: match[2] || match[1] };
    });
    return { columns: fields.map((field) => field.name), rows: rows.map((row) => fields.map((field) => row[field.source])) };
  }
  function safeName(value) { return /^[a-zA-Z_]\w*$/.test(value); }
  function executeStatement(sql, tables) {
    if (/^select\b/i.test(sql)) return executeSelect(sql, tables);
    let match = sql.match(/^create\s+table\s+([a-zA-Z_]\w*)\s*\(([\s\S]+)\)$/i);
    if (match) {
      const name = match[1];
      if (tables[name]) throw new Error(`テーブル「${name}」は既に存在します。`);
      const columns = splitComma(match[2]).map((definition) => definition.trim().split(/\s+/)[0]);
      if (!columns.length || columns.some((column) => !safeName(column)) || new Set(columns).size !== columns.length) throw new Error("CREATE TABLEの列名を確認してください。");
      tables[name] = { columns, rows: [] };
      return { columns: [], rows: [], message: `テーブル「${name}」を作成しました。` };
    }
    match = sql.match(/^insert\s+into\s+([a-zA-Z_]\w*)(?:\s*\(([^)]+)\))?\s+values\s+([\s\S]+)$/i);
    if (match) {
      const name = match[1]; const table = tables[name];
      if (!table) throw new Error(`テーブル「${name}」が見つかりません。`);
      const columns = match[2] ? splitComma(match[2]) : table.columns.slice();
      if (columns.some((column) => !table.columns.includes(column)) || new Set(columns).size !== columns.length) throw new Error("INSERTの列名を確認してください。");
      const groups = []; const source = match[3]; let start = -1; let depth = 0; let quote = null;
      for (let index = 0; index < source.length; index += 1) {
        const char = source[index]; const next = source[index + 1];
        if (quote) { if (char === quote && next === quote) index += 1; else if (char === quote) quote = null; }
        else if (char === "'" || char === '"') quote = char;
        else if (char === "(") { if (depth === 0) start = index + 1; depth += 1; }
        else if (char === ")") { depth -= 1; if (depth === 0) groups.push(source.slice(start, index)); }
        else if (depth === 0 && !/[\s,]/.test(char)) throw new Error("VALUES句の形式を確認してください。");
      }
      if (!groups.length || quote || depth !== 0) throw new Error("VALUES句の形式を確認してください。");
      groups.forEach((group) => {
        const values = splitComma(group).map(parseValue);
        if (values.length !== columns.length) throw new Error("INSERTの列数と値の数が一致しません。");
        const row = table.columns.map(() => null); columns.forEach((column, index) => { row[table.columns.indexOf(column)] = values[index]; }); table.rows.push(row);
      });
      return { columns: [], rows: [], message: `${groups.length}行を追加しました。` };
    }
    match = sql.match(/^delete\s+from\s+([a-zA-Z_]\w*)(?:\s+where\s+([\s\S]+))?$/i);
    if (match) {
      const name = match[1]; const table = tables[name];
      if (!table) throw new Error(`テーブル「${name}」が見つかりません。`);
      const before = table.rows.length;
      table.rows = table.rows.filter((values) => !matchesWhere(Object.fromEntries(table.columns.map((column, index) => [column, values[index]])), match[2]));
      return { columns: [], rows: [], message: `${before - table.rows.length}行を削除しました。` };
    }
    throw new Error("対応しているSQLは CREATE TABLE / INSERT INTO / SELECT / DELETE FROM です。");
  }
  function executeSQL(sql, tables) {
    const working = clone(tables); let result; let changed = false;
    splitStatements(sql).forEach((statement) => { result = executeStatement(statement, working); if (!/^select\b/i.test(statement)) changed = true; });
    if (changed) { Object.keys(tables).forEach((name) => delete tables[name]); Object.assign(tables, working); }
    Object.defineProperty(result, "changed", { value: changed, enumerable: false });
    return result;
  }

  function initialize(documentObject, browserWindow) {
    const get = (id) => documentObject.getElementById(id); let tables; let active; let pendingSQL = null;
    try { tables = JSON.parse(browserWindow.localStorage.getItem(STORAGE_KEY)) || clone(DEFAULT_TABLES); } catch (_) { tables = clone(DEFAULT_TABLES); }
    if (!tables || !Object.keys(tables).length) tables = clone(DEFAULT_TABLES); active = Object.keys(tables)[0];
    const save = () => { try { browserWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(tables)); } catch (_) { showMessage("保存できませんでした。", true); } };
    const cellText = (value) => value === null ? "NULL" : String(value);
    function tableMarkup(columns, rows, editable) { return `<table><thead><tr>${editable ? "<th></th>" : ""}${columns.map((c) => `<th>${escapeHTML(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((row, ri) => `<tr>${editable ? `<td><button class="row-delete" data-row="${ri}" aria-label="${ri + 1}行目を削除">×</button></td>` : ""}${row.map((v, ci) => `<td${editable ? ` contenteditable="true" data-row="${ri}" data-column="${ci}"` : ""}>${escapeHTML(cellText(v))}</td>`).join("")}</tr>`).join("")}</tbody></table>`; }
    function escapeHTML(value) { return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
    function showMessage(text, error) { get("message").hidden = false; get("message").className = `message${error ? " error" : ""}`; get("message").textContent = text; }
    function renderEditor() {
      get("tabs").innerHTML = Object.keys(tables).map((name) => `<button type="button" role="tab" data-table="${escapeHTML(name)}" aria-selected="${name === active}">${escapeHTML(name)}</button>`).join("");
      const table = tables[active]; get("tableName").textContent = active; get("tableMeta").textContent = `${table.rows.length} rows × ${table.columns.length} columns`; get("dataTable").innerHTML = tableMarkup(table.columns, table.rows, true);
    }
    function run(force) {
      try { const sql = get("sqlInput").value; const result = executeSQL(sql, tables); if (!force && !result.changed && result.rows.length > WARNING_LIMIT) { pendingSQL = sql; showMessage(`結果は${result.rows.length}件です。100件を超えています。もう一度「SQLを実行」を押すと表示します。`, false); return; } pendingSQL = null; if (result.changed) { save(); active = Object.keys(tables).includes(active) ? active : Object.keys(tables)[0]; renderEditor(); } get("message").hidden = !result.message; if (result.message) showMessage(result.message, false); get("resultEmpty").hidden = result.columns.length > 0; get("resultTable").hidden = result.columns.length === 0; get("resultTable").innerHTML = result.columns.length ? tableMarkup(result.columns, result.rows, false) : ""; get("resultMeta").textContent = result.columns.length ? `${result.rows.length} rows` : "実行完了"; } catch (error) { get("resultTable").hidden = true; get("resultEmpty").hidden = false; get("resultMeta").textContent = "エラー"; showMessage(`エラー: ${error.message}`, true); }
    }
    get("runButton").addEventListener("click", () => run(pendingSQL === get("sqlInput").value)); get("sqlInput").addEventListener("input", () => { pendingSQL = null; }); get("sqlInput").addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") run(false); });
    get("sampleButton").addEventListener("click", () => { get("sqlInput").value = SAMPLE_SQL; pendingSQL = null; });
    get("tabs").addEventListener("click", (event) => { const button = event.target.closest("[data-table]"); if (button) { active = button.dataset.table; renderEditor(); } });
    get("dataTable").addEventListener("input", (event) => { const cell = event.target.closest("[data-row]"); if (cell && cell.contentEditable === "true") { tables[active].rows[+cell.dataset.row][+cell.dataset.column] = parseValue(cell.textContent); save(); get("tableMeta").textContent = `${tables[active].rows.length} rows × ${tables[active].columns.length} columns`; } });
    get("dataTable").addEventListener("click", (event) => { const button = event.target.closest(".row-delete"); if (button) { tables[active].rows.splice(+button.dataset.row, 1); save(); renderEditor(); } });
    get("addRow").addEventListener("click", () => { tables[active].rows.push(tables[active].columns.map(() => "")); save(); renderEditor(); });
    get("addColumn").addEventListener("click", () => { const name = browserWindow.prompt("追加する列名を入力してください。"); if (!name) return; if (!safeName(name) || tables[active].columns.includes(name)) return showMessage("列名は英数字とアンダースコアで、重複しない名前にしてください。", true); tables[active].columns.push(name); tables[active].rows.forEach((row) => row.push("")); save(); renderEditor(); });
    get("addTable").addEventListener("click", () => { const name = browserWindow.prompt("新しいテーブル名を入力してください。"); if (!name) return; if (!safeName(name) || tables[name]) return showMessage("テーブル名は英数字とアンダースコアで、重複しない名前にしてください。", true); tables[name] = { columns: ["id", "value"], rows: [[1, "sample"]] }; active = name; save(); renderEditor(); });
    get("deleteTable").addEventListener("click", () => { if (Object.keys(tables).length === 1) return showMessage("最後のテーブルは削除できません。", true); if (browserWindow.confirm(`テーブル「${active}」を削除しますか？`)) { delete tables[active]; active = Object.keys(tables)[0]; save(); renderEditor(); } });
    get("toggleData").addEventListener("click", () => { const hidden = !get("dataBody").hidden; get("dataBody").hidden = hidden; get("toggleData").setAttribute("aria-expanded", String(!hidden)); get("toggleData").textContent = hidden ? "▾ データを表示" : "▴ データを非表示"; }); renderEditor();
  }
  if (typeof module !== "undefined") module.exports = { DEFAULT_TABLES, executeSQL, matchesWhere, parseSQL, parseValue, splitStatements };
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initialize(document, window));
}());
