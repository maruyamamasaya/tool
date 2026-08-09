"use strict";

const LEVELS = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE", "OTHER"];

function detectLevel(line) {
  const checks = [
    ["FATAL", /\b(?:FATAL|CRITICAL)\b/i], ["ERROR", /\bERROR\b/i],
    ["WARN", /\b(?:WARN|WARNING)\b/i], ["INFO", /\bINFO\b/i],
    ["DEBUG", /\bDEBUG\b/i], ["TRACE", /\bTRACE\b/i]
  ];
  return (checks.find(([, pattern]) => pattern.test(line)) || ["OTHER"])[0];
}

function parseLogs(text) {
  const normalized = String(text).replace(/\r\n?/g, "\n");
  if (!normalized) return [];
  return normalized.split("\n").map((text, index) => ({ text, number: index + 1, level: detectLevel(text) }));
}

function countLevels(lines) {
  const counts = Object.fromEntries(LEVELS.map((level) => [level, 0]));
  lines.forEach((line) => { counts[line.level] += 1; });
  return counts;
}

function visibleIndexes(lines, selectedLevels, context = 0) {
  const indexes = new Set();
  lines.forEach((line, index) => {
    if (!selectedLevels.has(line.level)) return;
    for (let current = Math.max(0, index - context); current <= Math.min(lines.length - 1, index + context); current += 1) indexes.add(current);
  });
  return [...indexes].sort((a, b) => a - b);
}

function textSegments(text, terms) {
  const active = terms.filter(Boolean).sort((a, b) => b.value.length - a.value.length);
  if (!active.length) return [{ text, type: "plain" }];
  const escaped = active.map((term) => term.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(regex).filter(Boolean).map((part) => {
    const found = active.find((term) => term.value.toLocaleLowerCase() === part.toLocaleLowerCase());
    return { text: part, type: found ? found.type : "plain" };
  });
}

if (typeof document !== "undefined") {
  const $ = (selector) => document.querySelector(selector);
  const elements = { input: $("#logInput"), filters: $("#levelFilters"), viewer: $("#logViewer"), search: $("#searchInput"), matchCount: $("#matchCount"), context: $("#contextLines"), customInput: $("#customInput"), customList: $("#customList"), status: $("#status") };
  let lines = [], selected = new Set(LEVELS), customTerms = [], searchMatches = [], currentMatch = -1, timer;

  function renderFilters() {
    const counts = countLevels(lines);
    elements.filters.replaceChildren();
    LEVELS.forEach((level) => {
      const label = document.createElement("label"); label.className = `level-chip level-${level.toLowerCase()}`;
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = selected.has(level); checkbox.dataset.level = level;
      checkbox.addEventListener("change", () => { checkbox.checked ? selected.add(level) : selected.delete(level); render(); });
      const name = document.createElement("span"); name.textContent = level;
      const count = document.createElement("strong"); count.textContent = counts[level].toLocaleString("ja-JP");
      label.append(checkbox, name, count); elements.filters.append(label);
    });
    const all = document.createElement("button"); all.type = "button"; all.className = "all-count"; all.textContent = `ALL ${lines.length.toLocaleString("ja-JP")}`;
    all.addEventListener("click", () => { selected = new Set(LEVELS); render(); }); elements.filters.prepend(all);
  }

  function render() {
    const indexes = visibleIndexes(lines, selected, Number(elements.context.value));
    const query = elements.search.value;
    elements.viewer.replaceChildren(); searchMatches = [];
    indexes.forEach((index) => {
      const line = lines[index], row = document.createElement("div"); row.className = `log-row level-${line.level.toLowerCase()}`; row.dataset.line = String(line.number);
      const number = document.createElement("span"); number.className = "line-number"; number.textContent = String(line.number);
      const code = document.createElement("code");
      const terms = [...(query ? [{ value: query, type: "search" }] : []), ...customTerms.map((value) => ({ value, type: "custom" }))];
      textSegments(line.text, terms).forEach((segment) => {
        if (segment.type === "plain") code.append(document.createTextNode(segment.text));
        else { const mark = document.createElement("mark"); mark.className = segment.type; mark.textContent = segment.text; code.append(mark); if (segment.type === "search") searchMatches.push(mark); }
      });
      row.append(number, code); elements.viewer.append(row);
    });
    if (!indexes.length) { const empty = document.createElement("p"); empty.className = "empty"; empty.textContent = lines.length ? "選択条件に一致するログはありません。" : "ログを貼り付けると、ここに解析結果が表示されます。"; elements.viewer.append(empty); }
    currentMatch = searchMatches.length ? Math.min(Math.max(currentMatch, 0), searchMatches.length - 1) : -1;
    $("#visibleCount").textContent = `${indexes.length.toLocaleString("ja-JP")} 行を表示`; elements.matchCount.textContent = `一致：${searchMatches.length.toLocaleString("ja-JP")}件`;
    searchMatches.forEach((match, index) => match.classList.toggle("current", index === currentMatch));
    renderFilters();
  }

  function analyze() { lines = parseLogs(elements.input.value); selected = new Set(LEVELS); currentMatch = -1; $("#inputCount").textContent = `${lines.length.toLocaleString("ja-JP")} 行`; render(); }
  function selectOnly(levels) { selected = new Set(levels); render(); }
  function moveMatch(delta) { if (!searchMatches.length) return; currentMatch = (currentMatch + delta + searchMatches.length) % searchMatches.length; searchMatches.forEach((match, index) => match.classList.toggle("current", index === currentMatch)); searchMatches[currentMatch].scrollIntoView({ block: "center", behavior: "smooth" }); }
  function showStatus(message) { clearTimeout(timer); elements.status.textContent = message; timer = setTimeout(() => { elements.status.textContent = ""; }, 1800); }
  function renderCustom() { elements.customList.replaceChildren(); customTerms.forEach((term, index) => { const chip = document.createElement("button"); chip.type = "button"; chip.textContent = `${term} ×`; chip.setAttribute("aria-label", `${term} のハイライトを削除`); chip.addEventListener("click", () => { customTerms.splice(index, 1); renderCustom(); render(); }); elements.customList.append(chip); }); $("#customSummary").textContent = `${customTerms.length} / 10`; }

  elements.input.addEventListener("input", analyze); $("#analyzeButton").addEventListener("click", analyze); $("#errorOnly").addEventListener("click", () => selectOnly(["ERROR", "FATAL"])); $("#warnAbove").addEventListener("click", () => selectOnly(["WARN", "ERROR", "FATAL"])); $("#showAll").addEventListener("click", () => selectOnly(LEVELS));
  elements.search.addEventListener("input", () => { currentMatch = 0; render(); }); $("#previousMatch").addEventListener("click", () => moveMatch(-1)); $("#nextMatch").addEventListener("click", () => moveMatch(1)); elements.context.addEventListener("change", render); $("#wrapLines").addEventListener("change", (event) => elements.viewer.classList.toggle("wrap-lines", event.target.checked));
  $("#addCustom").addEventListener("click", () => { const value = elements.customInput.value.trim(); if (!value || customTerms.some((term) => term.toLocaleLowerCase() === value.toLocaleLowerCase())) return; if (customTerms.length >= 10) { showStatus("カスタムハイライトは10個までです"); return; } customTerms.push(value); elements.customInput.value = ""; renderCustom(); render(); });
  elements.customInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); $("#addCustom").click(); } });
  $("#clearButton").addEventListener("click", () => { elements.input.value = ""; elements.search.value = ""; lines = []; selected = new Set(LEVELS); $("#inputCount").textContent = "0 行"; render(); elements.input.focus(); showStatus("入力をクリアしました"); });
  $("#copyButton").addEventListener("click", async () => { const text = visibleIndexes(lines, selected, Number(elements.context.value)).map((index) => lines[index].text).join("\n"); if (!text) return; try { await navigator.clipboard.writeText(text); } catch (_error) { const area = document.createElement("textarea"); area.value = text; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); } showStatus("表示中のログをコピーしました"); });
  render();
}

if (typeof module !== "undefined") module.exports = { LEVELS, detectLevel, parseLogs, countLevels, visibleIndexes, textSegments };
