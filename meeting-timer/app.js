(function (root) {
  "use strict";

  const STORAGE_KEY = "meeting-timer.v1";

  function calculateSchedule(settings, nowMs) {
    const start = new Date(settings.startAt).getTime();
    const end = settings.endMode === "duration"
      ? start + Number(settings.durationHours) * 3600000
      : new Date(settings.endAt).getTime();
    const split = settings.splitAt ? new Date(settings.splitAt).getTime() : start;
    const count = Math.max(1, Math.floor(Number(settings.splitCount) || 1));
    const firstTurn = Math.max(1, Math.floor(Number(settings.startTurn) || 1));
    if (![start, end, split].every(Number.isFinite) || end <= start) return { valid: false, error: "終了は開始より後に設定してください。" };
    if (split < start || split >= end) return { valid: false, error: "分割開始は会議時間内に設定してください。" };

    const turnLength = (end - split) / count;
    const elapsed = Math.max(0, nowMs - start);
    const remainingMs = Math.max(0, end - nowMs);
    const state = nowMs < start ? "before" : nowMs >= end ? "finished" : "running";
    const turnIndex = nowMs < split ? -1 : Math.min(count - 1, Math.floor((nowMs - split) / turnLength));
    const activeIndex = state === "finished" ? count - 1 : turnIndex;
    const turnEnd = activeIndex >= 0 ? Math.min(end, split + (activeIndex + 1) * turnLength) : split;
    return { valid: true, start, end, split, count, firstTurn, turnLength, elapsed, remainingMs, state, turnIndex: activeIndex, turnEnd };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calculateSchedule };
    return;
  }

  const $ = selector => document.querySelector(selector);
  const form = $("#settings");
  let settings = loadSettings();

  function localInputValue(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function defaultSettings() {
    const start = new Date();
    start.setSeconds(0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    return { startAt: localInputValue(start), endAt: localInputValue(end), endMode: "datetime", durationHours: 1, splitAt: localInputValue(start), splitCount: 4, startTurn: 1 };
  }

  function loadSettings() {
    try { return { ...defaultSettings(), ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; }
    catch (_) { return defaultSettings(); }
  }

  function setFormValues() {
    ["startAt", "endAt", "durationHours", "splitAt", "splitCount", "startTurn"].forEach(id => { $("#" + id).value = settings[id]; });
    setEndMode(settings.endMode);
  }

  function setEndMode(mode) {
    settings.endMode = mode;
    document.querySelectorAll("[data-end-mode]").forEach(button => button.classList.toggle("active", button.dataset.endMode === mode));
    $("#endAtField").hidden = mode !== "datetime";
    $("#durationField").hidden = mode !== "duration";
    $("#endAt").required = mode === "datetime";
  }

  function collectSettings() {
    return { startAt: $("#startAt").value, endAt: $("#endAt").value, endMode: settings.endMode, durationHours: Number($("#durationHours").value), splitAt: $("#splitAt").value, splitCount: Number($("#splitCount").value), startTurn: Number($("#startTurn").value) };
  }

  function formatClock(ms) { return new Date(ms).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }); }
  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }

  function render() {
    const now = Date.now();
    $("#currentTime").textContent = new Date(now).toLocaleTimeString("ja-JP", { hour12: false });
    const result = calculateSchedule(settings, now);
    if (!result.valid) return;
    const labels = { before: "開始前", running: "進行中", finished: "終了" };
    $("#stateBadge").textContent = labels[result.state];
    $("#stateBadge").className = `badge ${result.state}`;
    $("#meetingRange").textContent = `${formatClock(result.start)} → ${formatClock(result.end)}`;
    $("#remainingMinutes").textContent = Math.ceil(result.remainingMs / 60000);
    $("#remainingDetail").textContent = result.state === "before" ? `開始まで ${formatCountdown(result.start - now)}` : result.state === "finished" ? "会議は終了しました" : `${formatClock(result.end)} 終了予定`;
    const duration = result.end - result.start;
    $("#meetingProgress").style.width = `${Math.min(100, result.elapsed / duration * 100)}%`;
    const beforeTurns = result.turnIndex < 0;
    $("#turnNumber").textContent = beforeTurns ? "--" : result.firstTurn + result.turnIndex;
    $("#turnTotal").textContent = `/ ${result.firstTurn + result.count - 1}`;
    $("#turnRemaining").textContent = result.state === "finished" ? "00:00" : formatCountdown(result.turnEnd - now);
    $("#nextChange").textContent = result.state === "finished" ? "終了" : formatClock(result.turnEnd);
    $("#turnLength").textContent = `1ターン ${Math.round(result.turnLength / 60000)}分`;
    $("#turnDots").innerHTML = Array.from({ length: result.count }, (_, index) => `<span class="${index < result.turnIndex ? "done" : index === result.turnIndex ? "active" : ""}" title="ターン ${result.firstTurn + index}"></span>`).join("");
  }

  document.querySelectorAll("[data-end-mode]").forEach(button => button.addEventListener("click", () => setEndMode(button.dataset.endMode)));
  $("#startAt").addEventListener("change", () => { if (!$("#splitAt").value) $("#splitAt").value = $("#startAt").value; });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const next = collectSettings();
    const result = calculateSchedule(next, Date.now());
    $("#formError").textContent = result.valid ? "" : result.error;
    if (!result.valid) return;
    settings = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    render();
  });

  setFormValues();
  render();
  setInterval(render, 1000);
})(typeof globalThis !== "undefined" ? globalThis : this);
