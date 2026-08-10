"use strict";

const STORAGE_KEY = "kgiKpiBuilderDataV1";
const BACKUP_VERSION = 1;
const fields = ["name", "current", "target", "unit", "deadline", "memo"];

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
function emptyKpi(values = {}) { return { id: uid(), name: "", current: "", target: "", unit: "", deadline: "", memo: "", ...values }; }
function emptySet(values = {}) { return { id: uid(), theme: "新しいテーマ", kgi: { goal: "", deadline: "", memo: "" }, kpis: [], updatedAt: new Date().toISOString(), ...values }; }

function achievement(current, target) {
  if (String(current).trim() === "" || String(target).trim() === "") return null;
  const currentNumber = Number(current); const targetNumber = Number(target);
  if (!Number.isFinite(currentNumber) || !Number.isFinite(targetNumber) || targetNumber === 0) return null;
  return Math.round((currentNumber / targetNumber) * 100);
}

function clean(value) { return String(value ?? "").trim(); }
function generateMarkdown(set) {
  const lines = [`# ${clean(set.theme) || "無題のテーマ"}`, "", "## KGI", ""];
  if (clean(set.kgi.goal)) lines.push(`**目標:** ${clean(set.kgi.goal)}  `);
  if (clean(set.kgi.deadline)) lines.push(`**期限:** ${clean(set.kgi.deadline)}  `);
  if (clean(set.kgi.memo)) lines.push(`**メモ:** ${clean(set.kgi.memo)}  `);
  while (lines.at(-1) === "") lines.pop();
  if (set.kpis.length) lines.push("", "## KPI");
  set.kpis.forEach((kpi) => {
    lines.push("", `### ${clean(kpi.name) || "名称未設定"}`, "");
    const unit = clean(kpi.unit);
    if (clean(kpi.current)) lines.push(`- 現在：${clean(kpi.current)}${unit}`);
    if (clean(kpi.target)) lines.push(`- 目標：${clean(kpi.target)}${unit}`);
    const rate = achievement(kpi.current, kpi.target);
    if (rate !== null) lines.push(`- 達成率：${rate}%`);
    if (clean(kpi.deadline)) lines.push(`- 期限：${clean(kpi.deadline)}`);
    if (clean(kpi.memo)) lines.push(`- メモ：${clean(kpi.memo)}`);
  });
  return `${lines.join("\n").trim()}\n`;
}

function splitValueUnit(value) {
  const match = clean(value).match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(.*)$/);
  return match ? { value: match[1], unit: match[2] } : { value: clean(value), unit: "" };
}

function parseMarkdown(markdown) {
  const lines = String(markdown).replace(/\r/g, "").split("\n");
  const heading = lines.find((line) => /^#\s+/.test(line));
  if (!heading) throw new Error("テーマを表す「# 見出し」が見つかりません。");
  const result = emptySet({ theme: heading.replace(/^#\s+/, "").trim(), kpis: [] });
  let section = ""; let currentKpi = null;
  lines.forEach((line) => {
    if (/^##\s+KGI\s*$/i.test(line)) { section = "kgi"; currentKpi = null; return; }
    if (/^##\s+KPI\s*$/i.test(line)) { section = "kpi"; currentKpi = null; return; }
    const kpiHeading = line.match(/^###\s+(.+?)\s*$/);
    if (section === "kpi" && kpiHeading) { currentKpi = emptyKpi({ name: kpiHeading[1] }); result.kpis.push(currentKpi); return; }
    if (section === "kgi") {
      const item = line.match(/^\*\*(目標|期限|メモ):\*\*\s*(.*?)\s{0,2}$/);
      if (item) result.kgi[{ 目標: "goal", 期限: "deadline", メモ: "memo" }[item[1]]] = item[2].trim();
    } else if (section === "kpi" && currentKpi) {
      const item = line.match(/^[-*]\s*(現在|目標|達成率|期限|メモ)[：:]\s*(.*?)\s*$/);
      if (!item || item[1] === "達成率") return;
      if (item[1] === "現在" || item[1] === "目標") {
        const parsed = splitValueUnit(item[2]);
        currentKpi[item[1] === "現在" ? "current" : "target"] = parsed.value;
        if (!currentKpi.unit && parsed.unit) currentKpi.unit = parsed.unit;
      } else currentKpi[item[1] === "期限" ? "deadline" : "memo"] = item[2].trim();
    }
  });
  return result;
}

function normalizeBackup(value) {
  const rawSets = Array.isArray(value) ? value : value?.sets;
  if (!Array.isArray(rawSets) || !rawSets.length) throw new Error("有効なテーマデータがありません。");
  return rawSets.map((raw) => emptySet({ id: clean(raw.id) || uid(), theme: clean(raw.theme) || "無題のテーマ", kgi: { goal: clean(raw.kgi?.goal), deadline: clean(raw.kgi?.deadline), memo: clean(raw.kgi?.memo) }, kpis: Array.isArray(raw.kpis) ? raw.kpis.map((kpi) => emptyKpi(Object.fromEntries(fields.map((field) => [field, clean(kpi[field])])))) : [], updatedAt: clean(raw.updatedAt) || new Date().toISOString() }));
}

if (typeof document !== "undefined") {
  const $ = (selector) => document.querySelector(selector);
  let state = { sets: [], activeId: "" }; let draggedId = null; let statusTimer;
  function active() { return state.sets.find((set) => set.id === state.activeId); }
  function announce(text) { $("#message").textContent = text; clearTimeout(statusTimer); statusTimer = setTimeout(() => { $("#message").textContent = ""; }, 3500); }
  function save() {
    const set = active(); if (set) set.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $("#saveStatus").textContent = `保存済み ${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
    renderSidebar(); $("#markdownOutput").value = generateMarkdown(active());
  }
  function load() {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (saved?.sets?.length) state = { sets: normalizeBackup(saved.sets), activeId: saved.sets.some((set) => set.id === saved.activeId) ? saved.activeId : saved.sets[0].id }; }
    catch (_) { /* Start with a clean local document if storage is malformed. */ }
    if (!state.sets.length) { const first = emptySet({ theme: "応用情報技術者試験", kgi: { goal: "応用情報技術者試験に合格する", deadline: "2026/10/XX", memo: "" }, kpis: [emptyKpi({ name: "過去問正答率", current: "65", target: "80", unit: "%", deadline: "2026/09/30" })] }); state.sets = [first]; state.activeId = first.id; }
  }
  function renderSidebar() {
    const nav = $("#setList"); nav.replaceChildren();
    state.sets.forEach((set) => { const button = document.createElement("button"); button.type = "button"; button.className = set.id === state.activeId ? "theme-button active" : "theme-button"; button.innerHTML = `<span class="theme-dot"></span><span></span>`; button.lastElementChild.textContent = set.theme || "無題のテーマ"; button.addEventListener("click", () => { state.activeId = set.id; render(); }); nav.append(button); });
    $("#setCount").textContent = `${state.sets.length}件`;
  }
  function renderProgress(card, kpi) {
    const rate = achievement(kpi.current, kpi.target); card.querySelector(".progress-value").textContent = rate === null ? "—" : `${rate}%`;
    card.querySelector(".progress-fill").style.width = `${Math.max(0, Math.min(100, rate ?? 0))}%`;
    card.querySelector(".progress-detail").textContent = clean(kpi.current) || clean(kpi.target) ? `${clean(kpi.current) || "—"}${clean(kpi.unit)} → ${clean(kpi.target) || "—"}${clean(kpi.unit)}` : "現在値と目標値を入力してください";
  }
  function renderKpis() {
    const list = $("#kpiList"); list.replaceChildren(); const set = active();
    set.kpis.forEach((kpi, index) => {
      const card = $("#kpiTemplate").content.firstElementChild.cloneNode(true); card.dataset.id = kpi.id; card.querySelector(".kpi-number").textContent = `KPI ${String(index + 1).padStart(2, "0")}`;
      fields.forEach((field) => { const input = card.querySelector(`[data-field="${field}"]`); input.value = kpi[field]; input.addEventListener("input", () => { kpi[field] = input.value; renderProgress(card, kpi); save(); }); });
      card.querySelector(".delete-button").addEventListener("click", () => { set.kpis = set.kpis.filter((item) => item.id !== kpi.id); renderKpis(); save(); });
      card.addEventListener("dragstart", () => { draggedId = kpi.id; card.classList.add("dragging"); }); card.addEventListener("dragend", () => { draggedId = null; card.classList.remove("dragging"); });
      card.addEventListener("dragover", (event) => { event.preventDefault(); }); card.addEventListener("drop", (event) => { event.preventDefault(); if (!draggedId || draggedId === kpi.id) return; const from = set.kpis.findIndex((item) => item.id === draggedId); const to = set.kpis.findIndex((item) => item.id === kpi.id); const [moved] = set.kpis.splice(from, 1); set.kpis.splice(to, 0, moved); renderKpis(); save(); });
      renderProgress(card, kpi); list.append(card);
    });
    $("#kpiCount").textContent = `${set.kpis.length}件`;
  }
  function render() { const set = active(); renderSidebar(); $("#theme").value = set.theme; $("#kgiGoal").value = set.kgi.goal; $("#kgiDeadline").value = set.kgi.deadline; $("#kgiMemo").value = set.kgi.memo; renderKpis(); $("#markdownOutput").value = generateMarkdown(set); }
  [["#theme", "theme"], ["#kgiGoal", "goal"], ["#kgiDeadline", "deadline"], ["#kgiMemo", "memo"]].forEach(([selector, field]) => $(selector).addEventListener("input", (event) => { if (field === "theme") active().theme = event.target.value; else active().kgi[field] = event.target.value; save(); }));
  $("#addKpi").addEventListener("click", () => { active().kpis.push(emptyKpi()); renderKpis(); save(); $("#kpiList").lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" }); });
  $("#newSet").addEventListener("click", () => { const set = emptySet(); state.sets.push(set); state.activeId = set.id; render(); save(); $("#theme").select(); });
  $("#loadMarkdown").addEventListener("click", () => { try { const parsed = parseMarkdown($("#markdownImport").value); parsed.id = active().id; state.sets[state.sets.findIndex((set) => set.id === state.activeId)] = parsed; render(); save(); announce("MarkdownからGUIへ復元しました。"); } catch (error) { announce(error.message); } });
  $("#copyMarkdown").addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#markdownOutput").value); } catch (_) { $("#markdownOutput").select(); document.execCommand("copy"); } announce("Markdownをコピーしました。"); });
  $("#exportJson").addEventListener("click", () => { const blob = new Blob([JSON.stringify({ version: BACKUP_VERSION, exportedAt: new Date().toISOString(), sets: state.sets }, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `kgi-kpi-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); announce("JSONバックアップを保存しました。"); });
  $("#importJsonButton").addEventListener("click", () => $("#importJsonFile").click());
  $("#importJsonFile").addEventListener("change", async (event) => { const file = event.target.files[0]; if (!file) return; try { state.sets = normalizeBackup(JSON.parse(await file.text())); state.activeId = state.sets[0].id; render(); save(); announce(`${state.sets.length}件のテーマを復元しました。`); } catch (error) { announce(`インポートできませんでした：${error.message}`); } event.target.value = ""; });
  load(); render(); save();
}

if (typeof module !== "undefined") module.exports = { achievement, emptyKpi, emptySet, generateMarkdown, normalizeBackup, parseMarkdown, splitValueUnit };
