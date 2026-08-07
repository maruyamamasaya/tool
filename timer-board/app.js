(() => {
  "use strict";
  const STORAGE_KEY = "timer-board.v1";
  const MAX_TIMERS = 12;
  let timers = loadTimers();
  let toastTimeout;

  const grid = document.querySelector("#timerGrid");
  const emptyState = document.querySelector("#emptyState");
  const addButtons = [document.querySelector("#addTimer"), document.querySelector("#emptyAddTimer")];

  function createTimer(source = {}) {
    const number = source.number || 1;
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name: source.name ? `${source.name} copy` : `Timer ${String(number).padStart(2, "0")}`,
      mode: source.mode || "stopwatch",
      durationMs: source.durationMs ?? 300000,
      elapsedMs: 0,
      status: "ready",
      anchorTime: null,
      anchorElapsed: 0,
      blinkEnabled: source.blinkEnabled ?? true,
      blinkAt: source.blinkAt ?? 10,
      note: source.note || "",
      settingsOpen: false
    };
  }

  function normalizeTimer(timer) {
    const clean = { ...createTimer(), ...timer, settingsOpen: false };
    if (clean.status === "running" && !Number.isFinite(clean.anchorTime)) clean.status = "paused";
    return clean;
  }

  function loadTimers() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved.slice(0, MAX_TIMERS).map(normalizeTimer) : [];
    } catch (_) { return []; }
  }

  function saveTimers() {
    const persisted = timers.map(({ settingsOpen, ...timer }) => timer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }

  function currentElapsed(timer, now = Date.now()) {
    if (timer.status !== "running") return timer.elapsedMs;
    return timer.anchorElapsed + Math.max(0, now - timer.anchorTime);
  }

  function displayMs(timer, now = Date.now()) {
    const elapsed = currentElapsed(timer, now);
    return timer.mode === "timer" ? Math.max(0, timer.durationMs - elapsed) : elapsed;
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
  }

  function statusLabel(status) { return ({ ready: "READY", running: "RUNNING", paused: "PAUSED", finished: "FINISHED" })[status]; }

  function render() {
    grid.innerHTML = "";
    timers.forEach((timer, index) => grid.append(createCard(timer, index)));
    emptyState.hidden = timers.length > 0;
    addButtons.forEach(button => button.disabled = timers.length >= MAX_TIMERS);
    updateSummary();
    tick();
  }

  function createCard(timer, index) {
    const card = document.createElement("article");
    card.className = `timer-card ${timer.status}`;
    card.dataset.id = timer.id;
    const hours = Math.floor(timer.durationMs / 3600000);
    const minutes = Math.floor(timer.durationMs % 3600000 / 60000);
    const seconds = Math.floor(timer.durationMs % 60000 / 1000);
    card.innerHTML = `
      <div class="card-head">
        <span class="status">${statusLabel(timer.status)}</span>
        <input class="timer-name" value="${escapeHtml(timer.name)}" maxlength="50" aria-label="タイマー名">
        <div class="head-actions">
          <button data-action="move-left" title="前へ移動" aria-label="前へ移動" ${index === 0 ? "disabled" : ""}>←</button>
          <button data-action="move-right" title="後へ移動" aria-label="後へ移動" ${index === timers.length - 1 ? "disabled" : ""}>→</button>
          <button data-action="duplicate" title="複製" aria-label="複製">⧉</button>
          <button data-action="delete" title="削除" aria-label="削除">×</button>
        </div>
      </div>
      <div class="mode-tabs" role="group" aria-label="タイマーモード">
        <button data-mode="stopwatch" class="${timer.mode === "stopwatch" ? "active" : ""}">STOPWATCH</button>
        <button data-mode="timer" class="${timer.mode === "timer" ? "active" : ""}">TIMER</button>
      </div>
      <div class="display"><div class="time">${formatTime(displayMs(timer))}</div><p class="time-caption">${timer.mode === "timer" ? "remaining" : "elapsed time"}</p></div>
      <div class="progress-track"><div class="progress"></div></div>
      <div class="card-controls">
        <button class="button primary" data-action="toggle">${timer.status === "running" ? "Ⅱ PAUSE" : timer.status === "paused" ? "▶ RESUME" : "▶ START"}</button>
        <button class="button" data-action="reset">↻ RESET</button>
        <button class="button icon" data-action="settings" aria-expanded="${timer.settingsOpen}" title="設定" aria-label="設定">⚙</button>
      </div>
      <div class="settings-panel" ${timer.settingsOpen ? "" : "hidden"}>
        <div class="settings-grid">
          <div class="field full duration-field" ${timer.mode === "timer" ? "" : "hidden"}><span>カウントダウン時間</span><div class="duration-inputs">
            <label><input data-setting="hours" type="number" min="0" max="99" value="${hours}" aria-label="時間"><span>時</span></label>
            <label><input data-setting="minutes" type="number" min="0" max="59" value="${minutes}" aria-label="分"><span>分</span></label>
            <label><input data-setting="seconds" type="number" min="0" max="59" value="${seconds}" aria-label="秒"><span>秒</span></label>
          </div></div>
          <label class="field"><span>点滅通知</span><span class="toggle-line">通知を使う <span class="switch"><input data-setting="blink" type="checkbox" ${timer.blinkEnabled ? "checked" : ""}><span></span></span></span></label>
          <label class="field"><span>点滅開始</span><select data-setting="blinkAt" ${timer.mode !== "timer" || !timer.blinkEnabled ? "disabled" : ""}>
            <option value="0" ${timer.blinkAt === 0 ? "selected" : ""}>終了時のみ</option><option value="10" ${timer.blinkAt === 10 ? "selected" : ""}>残り10秒</option><option value="30" ${timer.blinkAt === 30 ? "selected" : ""}>残り30秒</option><option value="60" ${timer.blinkAt === 60 ? "selected" : ""}>残り1分</option>
          </select></label>
          <label class="field full"><span>メモ</span><textarea data-setting="note" maxlength="300" placeholder="このタイマーについてのメモ">${escapeHtml(timer.note)}</textarea></label>
        </div>
      </div>`;
    bindCard(card, timer, index);
    return card;
  }

  function bindCard(card, timer, index) {
    card.querySelector(".timer-name").addEventListener("change", event => { timer.name = event.target.value.trim() || "Untitled timer"; event.target.value = timer.name; saveTimers(); });
    card.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => { if (timer.mode === button.dataset.mode) return; timer.mode = button.dataset.mode; reset(timer); saveTimers(); render(); }));
    card.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => handleAction(button.dataset.action, timer, index)));
    card.querySelectorAll("[data-setting]").forEach(input => input.addEventListener("change", () => updateSetting(timer, card, input)));
  }

  function handleAction(action, timer, index) {
    if (action === "toggle") toggle(timer);
    if (action === "reset") reset(timer);
    if (action === "settings") timer.settingsOpen = !timer.settingsOpen;
    if (action === "delete") { timers.splice(index, 1); showToast("タイマーを削除しました"); }
    if (action === "duplicate") {
      if (timers.length >= MAX_TIMERS) return showToast("タイマーは最大12個です");
      timers.splice(index + 1, 0, createTimer(timer)); showToast("タイマーを複製しました");
    }
    if (action === "move-left" && index > 0) [timers[index - 1], timers[index]] = [timers[index], timers[index - 1]];
    if (action === "move-right" && index < timers.length - 1) [timers[index + 1], timers[index]] = [timers[index], timers[index + 1]];
    saveTimers(); render();
  }

  function toggle(timer) {
    const now = Date.now();
    if (timer.status === "running") { timer.elapsedMs = currentElapsed(timer, now); timer.status = "paused"; }
    else {
      if (timer.status === "finished") reset(timer);
      if (timer.mode === "timer" && timer.durationMs <= 0) return showToast("カウントダウン時間を設定してください");
      timer.anchorElapsed = timer.elapsedMs; timer.anchorTime = now; timer.status = "running";
    }
  }

  function reset(timer) { timer.elapsedMs = 0; timer.anchorElapsed = 0; timer.anchorTime = null; timer.status = "ready"; }

  function updateSetting(timer, card, input) {
    if (["hours", "minutes", "seconds"].includes(input.dataset.setting)) {
      const value = key => Math.max(0, Number(card.querySelector(`[data-setting="${key}"]`).value) || 0);
      timer.durationMs = Math.min(359999000, (value("hours") * 3600 + value("minutes") * 60 + value("seconds")) * 1000); reset(timer);
    } else if (input.dataset.setting === "blink") timer.blinkEnabled = input.checked;
    else if (input.dataset.setting === "blinkAt") timer.blinkAt = Number(input.value);
    else if (input.dataset.setting === "note") timer.note = input.value;
    saveTimers(); render();
  }

  function tick() {
    const now = Date.now();
    let finishedChanged = false;
    timers.forEach(timer => {
      if (timer.status === "running" && timer.mode === "timer" && currentElapsed(timer, now) >= timer.durationMs) {
        timer.elapsedMs = timer.durationMs; timer.anchorTime = null; timer.status = "finished"; finishedChanged = true;
      }
      const card = grid.querySelector(`[data-id="${CSS.escape(timer.id)}"]`);
      if (!card) return;
      card.className = `timer-card ${timer.status}`;
      card.querySelector(".status").textContent = statusLabel(timer.status);
      card.querySelector(".time").textContent = formatTime(displayMs(timer, now));
      const percent = timer.mode === "timer" && timer.durationMs ? Math.min(100, currentElapsed(timer, now) / timer.durationMs * 100) : 0;
      card.querySelector(".progress").style.width = `${percent}%`;
      const remaining = displayMs(timer, now);
      const alerting = timer.blinkEnabled && timer.mode === "timer" && (timer.status === "finished" || (timer.status === "running" && timer.blinkAt > 0 && remaining <= timer.blinkAt * 1000));
      card.classList.toggle("alerting", alerting);
    });
    if (finishedChanged) { saveTimers(); render(); return; }
    updateSummary();
  }

  function updateSummary() {
    const running = timers.filter(timer => timer.status === "running").length;
    const finished = timers.filter(timer => timer.status === "finished").length;
    document.querySelector("#boardSummary").textContent = `${timers.length} timer${timers.length === 1 ? "" : "s"}`;
    document.querySelector("#runningSummary").textContent = running ? `${running}件 実行中${finished ? ` · ${finished}件 完了` : ""}` : finished ? `${finished}件 完了` : "すべて停止中";
  }

  function addTimer() {
    if (timers.length >= MAX_TIMERS) return showToast("タイマーは最大12個です");
    timers.push(createTimer({ number: timers.length + 1 })); saveTimers(); render();
  }

  function showToast(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove("show"), 2200); }
  function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

  addButtons.forEach(button => button.addEventListener("click", addTimer));
  document.querySelector("#pauseAll").addEventListener("click", () => { timers.filter(t => t.status === "running").forEach(t => { t.elapsedMs = currentElapsed(t); t.status = "paused"; }); saveTimers(); render(); });
  document.querySelector("#resetAll").addEventListener("click", () => { timers.forEach(reset); saveTimers(); render(); });
  document.querySelector("#resetFinished").addEventListener("click", () => { timers.filter(t => t.status === "finished").forEach(reset); saveTimers(); render(); });

  function updateClock() {
    const now = new Date();
    document.querySelector("#currentTime").textContent = now.toLocaleTimeString("ja-JP", { hour12: false });
    document.querySelector("#currentDate").textContent = now.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", weekday: "short" });
  }
  updateClock(); render(); setInterval(() => { updateClock(); tick(); }, 250);
})();
