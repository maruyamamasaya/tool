(function () {
  "use strict";

  const KEYWORDS = new Set(("SELECT FROM WHERE AND OR JOIN INNER LEFT RIGHT FULL OUTER CROSS ON GROUP BY HAVING ORDER LIMIT OFFSET INSERT INTO UPDATE DELETE VALUES VALUE SET AS DISTINCT ALL UNION EXCEPT INTERSECT CASE WHEN THEN ELSE END ASC DESC NULL IS NOT IN LIKE BETWEEN EXISTS TRUE FALSE CREATE ALTER DROP TABLE WITH RETURNING USING OVER PARTITION BY PRIMARY KEY FOREIGN REFERENCES DEFAULT DATABASE VIEW INDEX PROCEDURE FUNCTION BEGIN COMMIT ROLLBACK").split(" "));
  const PHRASES = new Set(["GROUP BY", "ORDER BY", "PARTITION BY", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "FULL OUTER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "CROSS JOIN", "UNION ALL", "INSERT INTO", "DELETE FROM", "IS NOT", "NOT IN", "PRIMARY KEY", "FOREIGN KEY"]);
  const CLAUSES = new Set(["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT", "OFFSET", "VALUES", "SET", "RETURNING", "INSERT INTO", "UPDATE", "DELETE FROM", "UNION", "UNION ALL", "EXCEPT", "INTERSECT"]);

  function tokenize(sql) {
    const tokens = [];
    let i = 0;
    let valid = true;
    while (i < sql.length) {
      const ch = sql[i];
      if (/\s/.test(ch)) { i += 1; continue; }
      if (ch === "'" || ch === '"' || ch === "`") {
        const quote = ch;
        let value = ch;
        let closed = false;
        i += 1;
        while (i < sql.length) {
          value += sql[i];
          if (sql[i] === quote) {
            if (sql[i + 1] === quote) { value += sql[++i]; i += 1; continue; }
            closed = true; i += 1; break;
          }
          if (sql[i] === "\\" && i + 1 < sql.length) value += sql[++i];
          i += 1;
        }
        if (!closed) valid = false;
        tokens.push({ type: quote === "'" ? "string" : "identifier", value });
        continue;
      }
      if (ch === "-" && sql[i + 1] === "-") {
        let value = "";
        while (i < sql.length && sql[i] !== "\n") value += sql[i++];
        tokens.push({ type: "line-comment", value });
        continue;
      }
      if (ch === "/" && sql[i + 1] === "*") {
        const end = sql.indexOf("*/", i + 2);
        if (end < 0) { tokens.push({ type: "block-comment", value: sql.slice(i) }); valid = false; break; }
        tokens.push({ type: "block-comment", value: sql.slice(i, end + 2) }); i = end + 2; continue;
      }
      const operator = sql.slice(i).match(/^(?:<>|!=|<=|>=|::|:=|->>|->|\|\||&&|[-+*/%=<>])/);
      if (operator) { tokens.push({ type: "operator", value: operator[0] }); i += operator[0].length; continue; }
      if ("(),;.".includes(ch)) { tokens.push({ type: "punctuation", value: ch }); i += 1; continue; }
      const word = sql.slice(i).match(/^[\p{L}_$@#][\p{L}\p{N}_$@#]*/u);
      if (word) { tokens.push({ type: "word", value: word[0] }); i += word[0].length; continue; }
      const number = sql.slice(i).match(/^\d+(?:\.\d+)?(?:e[+-]?\d+)?/i);
      if (number) { tokens.push({ type: "number", value: number[0] }); i += number[0].length; continue; }
      tokens.push({ type: "unknown", value: ch }); i += 1;
    }
    return { tokens: combinePhrases(tokens), valid };
  }

  function combinePhrases(tokens) {
    const result = [];
    for (let i = 0; i < tokens.length;) {
      let found = null;
      for (const size of [3, 2]) {
        const part = tokens.slice(i, i + size);
        if (part.length === size && part.every(t => t.type === "word")) {
          const phrase = part.map(t => t.value.toUpperCase()).join(" ");
          if (PHRASES.has(phrase)) { found = { type: "word", value: phrase }; i += size; break; }
        }
      }
      if (!found) found = tokens[i++];
      result.push(found);
    }
    return result;
  }

  function formatSql(sql, keywordCase = "upper") {
    const parsed = tokenize(String(sql || ""));
    const tokens = parsed.tokens;
    if (!tokens.length) return "";
    const lines = [];
    let current = "";
    let indent = 0;
    let parens = 0;
    let clause = "";
    let caseDepth = 0;
    let valid = parsed.valid;
    const pad = () => "    ".repeat(Math.max(0, indent));
    const flush = () => { if (current.trim()) lines.push(pad() + current.trim()); current = ""; };
    const newline = (nextIndent = indent) => { flush(); indent = Math.max(0, nextIndent); };
    const keyword = value => keywordCase === "lower" ? value.toLowerCase() : value.toUpperCase();
    const display = token => token.type === "word" && (KEYWORDS.has(token.value.toUpperCase()) || PHRASES.has(token.value.toUpperCase())) ? keyword(token.value) : token.value;
    const append = (value, tight = false) => {
      if (!current) current = value;
      else if (tight || current.endsWith("(") || current.endsWith(".") || value === ".") current += value;
      else current += " " + value;
    };

    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      const upper = token.type === "word" ? token.value.toUpperCase() : token.value;
      const value = display(token);
      const next = tokens[i + 1];

      if (token.type.includes("comment")) {
        newline(); append(token.value); newline(); continue;
      }
      if (upper === ";") {
        if (parens !== 0 || caseDepth !== 0) valid = false;
        append(";", true); flush();
        if (i < tokens.length - 1) lines.push("");
        indent = 0; parens = 0; clause = ""; caseDepth = 0; continue;
      }
      if (CLAUSES.has(upper)) {
        newline(Math.max(0, parens)); append(value); newline(Math.max(0, parens) + 1);
        clause = upper; continue;
      }
      if (upper.endsWith("JOIN") || upper === "JOIN") {
        newline(Math.max(0, parens)); append(value); newline(Math.max(0, parens) + 1); clause = "JOIN"; continue;
      }
      if (upper === "ON") {
        newline(Math.max(0, parens) + 1); append(value); continue;
      }
      if ((upper === "AND" || upper === "OR") && parens >= 0) {
        newline(Math.max(0, parens) + 1 + (caseDepth > 0 ? 1 : 0)); append(value); continue;
      }
      if (upper === "CASE") {
        append(value); caseDepth += 1; newline(indent + 1); continue;
      }
      if (upper === "WHEN") { newline(indent); append(value); continue; }
      if (upper === "THEN") { append(value); newline(indent + 1); continue; }
      if (upper === "ELSE") { newline(Math.max(0, indent - 1)); append(value); newline(indent + 1); continue; }
      if (upper === "END") { newline(Math.max(0, indent - 1)); append(value); caseDepth = Math.max(0, caseDepth - 1); continue; }
      if (upper === "(") {
        append("(", true); parens += 1;
        if (next && next.type === "word" && next.value.toUpperCase() === "SELECT") newline(indent + 1);
        continue;
      }
      if (upper === ")") {
        parens -= 1; if (parens < 0) { valid = false; parens = 0; }
        append(")", true); continue;
      }
      if (upper === ",") {
        append(",", true);
        if (parens === 0) newline(indent);
        continue;
      }
      if (upper === ".") { append(".", true); continue; }
      if (token.type === "operator") { append(value); continue; }
      append(value);
    }
    flush();
    if (parens !== 0 || caseDepth !== 0) valid = false;
    formatSql.lastValid = valid;
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  formatSql.lastValid = true;

  if (typeof module !== "undefined" && module.exports) module.exports = { formatSql, tokenize };

  if (typeof document !== "undefined") {
    const input = document.getElementById("sqlInput");
    const output = document.getElementById("sqlOutput");
    const inputCount = document.getElementById("inputCount");
    const outputCount = document.getElementById("outputCount");
    const copyButton = document.getElementById("copyButton");
    const notice = document.getElementById("notice");
    const updateCounts = () => { inputCount.textContent = `${input.value.length} 文字`; outputCount.textContent = `${output.value.length} 文字`; };
    const showNotice = (message, success = false) => { notice.textContent = message; notice.className = `notice${success ? " success" : ""}`; notice.hidden = false; };
    const runFormat = () => {
      if (!input.value.trim()) { output.value = ""; copyButton.disabled = true; showNotice("整形するSQLを入力してください。"); updateCounts(); return; }
      const mode = document.querySelector('input[name="keywordCase"]:checked').value;
      output.value = formatSql(input.value, mode);
      copyButton.disabled = !output.value;
      showNotice(formatSql.lastValid ? "SQLを整形しました。" : "一部を整形しました。SQLを確認してください。", formatSql.lastValid);
      updateCounts();
    };
    document.getElementById("formatButton").addEventListener("click", runFormat);
    input.addEventListener("input", updateCounts);
    document.querySelectorAll('input[name="keywordCase"]').forEach(radio => radio.addEventListener("change", () => { if (output.value) runFormat(); }));
    document.getElementById("clearButton").addEventListener("click", () => { input.value = ""; output.value = ""; notice.hidden = true; copyButton.disabled = true; updateCounts(); input.focus(); });
    copyButton.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(output.value); showNotice("整形結果をコピーしました。", true); }
      catch (_) { output.select(); document.execCommand("copy"); showNotice("整形結果をコピーしました。", true); }
    });
    document.addEventListener("keydown", event => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); runFormat(); } });
    updateCounts();
  }
})();
