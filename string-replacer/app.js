(function () {
  "use strict";

  function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function buildRegex(query, options = {}) {
    if (!query) throw new Error("検索する文字列を入力してください。");
    const source = options.useRegex ? query : escapeRegex(query);
    const pattern = options.exactMatch ? `^(?:${source})$` : source;
    const flags = `g${options.caseSensitive ? "" : "i"}${options.dotAll ? "s" : ""}${options.exactMatch ? "m" : ""}u`;
    try { return new RegExp(pattern, flags); } catch (_error) { throw new Error("正規表現の形式が正しくありません。"); }
  }

  function findMatches(text, query, options = {}) {
    const regex = buildRegex(query, options);
    return [...text.matchAll(regex)].map((match) => ({ index: match.index, value: match[0] }));
  }

  function replaceAll(text, query, replacement, options = {}) {
    const regex = buildRegex(query, options);
    const matches = [...text.matchAll(regex)];
    const safeReplacement = options.useRegex ? replacement : replacement.replace(/\$/g, "$$$$");
    return { result: text.replace(regex, safeReplacement), count: matches.length, matches };
  }

  function parseRules(value) {
    return value.split(/\r?\n/).map((line, index) => {
      if (!line.trim()) return null;
      const separator = line.indexOf("=>");
      if (separator < 0) throw new Error(`${index + 1}行目に「=>」がありません。`);
      const search = line.slice(0, separator).trim();
      if (!search) throw new Error(`${index + 1}行目の検索文字列が空です。`);
      return { search, replacement: line.slice(separator + 2).trim() };
    }).filter(Boolean);
  }

  function applyRules(text, rules, options = {}) {
    return rules.reduce((state, rule) => {
      const applied = replaceAll(state.result, rule.search, rule.replacement, options);
      return { result: applied.result, count: state.count + applied.count };
    }, { result: text, count: 0 });
  }

  function initialize(doc, browserWindow) {
    const byId = (id) => doc.getElementById(id);
    const input = byId("inputText"), output = byId("outputText"), search = byId("searchText"), replacement = byId("replacementText");
    let mode = "search", deleteListMode = false;
    const options = () => ({ caseSensitive: byId("caseSensitive").checked, exactMatch: byId("exactMatch").checked, useRegex: byId("useRegex").checked, dotAll: byId("dotAll").checked });
    const labels = { search: "検索", replace: "すべて置換", delete: "すべて削除", multiple: "複数ルールを置換" };

    function setResult(value, count, matches) {
      output.value = value;
      byId("matchCount").textContent = `該当：${count}件`;
      byId("copyButton").disabled = false;
      byId("swapButton").disabled = false;
      const panel = byId("highlightPanel"); panel.replaceChildren();
      if (!matches || !matches.length) { const span = doc.createElement("span"); span.className = "empty-preview"; span.textContent = "一致する箇所はありません"; panel.append(span); return; }
      let cursor = 0;
      matches.slice(0, 1000).forEach((match) => { const value = match.value === undefined ? match[0] : match.value; panel.append(doc.createTextNode(input.value.slice(cursor, match.index))); const mark = doc.createElement("mark"); mark.textContent = value || "（空の一致）"; panel.append(mark); cursor = match.index + value.length; });
      panel.append(doc.createTextNode(input.value.slice(cursor)));
    }

    function selectMode(next) {
      mode = next; deleteListMode = false;
      doc.querySelectorAll(".tab").forEach((tab) => { const active = tab.dataset.mode === mode; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
      byId("singleFields").hidden = mode === "multiple";
      byId("multipleFields").hidden = mode !== "multiple";
      byId("deleteListField").hidden = true;
      byId("replacementField").hidden = mode === "search" || mode === "delete";
      byId("deleteListToggle").hidden = mode !== "delete";
      byId("deleteListToggle").textContent = "複数削除に切り替え";
      byId("runButton").textContent = labels[mode]; byId("message").textContent = "";
    }

    function run() {
      byId("message").textContent = ""; byId("status").textContent = "";
      try {
        if (mode === "multiple") { const applied = applyRules(input.value, parseRules(byId("rulesText").value), options()); setResult(applied.result, applied.count); return; }
        if (mode === "delete" && deleteListMode) { const rules = byId("deleteListText").value.split(/\r?\n/).filter(Boolean).map((item) => ({ search: item, replacement: "" })); const applied = applyRules(input.value, rules, options()); setResult(applied.result, applied.count); return; }
        const matches = findMatches(input.value, search.value, options());
        if (mode === "search") setResult(input.value, matches.length, matches);
        else { const applied = replaceAll(input.value, search.value, mode === "delete" ? "" : replacement.value, options()); setResult(applied.result, applied.count, applied.matches); }
      } catch (error) { byId("message").textContent = error.message; }
    }

    doc.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => selectMode(tab.dataset.mode)));
    byId("runButton").addEventListener("click", run);
    byId("deleteListToggle").addEventListener("click", () => { deleteListMode = !deleteListMode; byId("singleFields").hidden = deleteListMode; byId("deleteListField").hidden = !deleteListMode; byId("deleteListToggle").textContent = deleteListMode ? "1件削除に戻す" : "複数削除に切り替え"; });
    input.addEventListener("input", () => { const lines = input.value ? input.value.split(/\r\n?|\n/).length : 0; byId("inputStats").textContent = `${input.value.length}文字・${lines}行`; });
    byId("copyButton").addEventListener("click", async () => { try { await browserWindow.navigator.clipboard.writeText(output.value); byId("status").textContent = "コピーしました"; } catch (_error) { byId("status").textContent = "コピーできませんでした。結果欄から手動でコピーしてください。"; } });
    byId("swapButton").addEventListener("click", () => { const old = input.value; input.value = output.value; output.value = old; input.dispatchEvent(new browserWindow.Event("input")); byId("status").textContent = "入力と結果を入れ替えました"; });
    byId("clearButton").addEventListener("click", () => { [input, output, search, replacement, byId("rulesText"), byId("deleteListText")].forEach((element) => { element.value = ""; }); byId("inputStats").textContent = "0文字・0行"; byId("matchCount").textContent = "該当：0件"; byId("copyButton").disabled = true; byId("swapButton").disabled = true; byId("message").textContent = ""; byId("status").textContent = ""; const panel = byId("highlightPanel"); panel.innerHTML = '<span class="empty-preview">検索すると一致箇所をハイライト表示します</span>'; input.focus(); });
  }

  if (typeof module !== "undefined") module.exports = { applyRules, buildRegex, escapeRegex, findMatches, parseRules, replaceAll };
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initialize(document, window));
})();
