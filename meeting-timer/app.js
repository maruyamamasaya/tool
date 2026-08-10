(function (root) {
  "use strict";

  const STORAGE_KEY = "meeting-timer.v2";

  function todayAt(time, referenceMs) {
    const match = /^(\d{2}):(\d{2})$/.exec(time || "");
    if (!match) return "";
    const date = new Date(referenceMs);
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return date.toISOString();
  }

  function calculateSchedule(settings, nowMs) {
    const start = new Date(settings.startAt).getTime();
    const end = settings.endMode === "duration"
      ? start + Number(settings.durationHours) * 3600000
      : new Date(settings.endAt).getTime();
    if (![start, end].every(Number.isFinite) || end <= start) return { valid: false, error: "終了は開始より後に設定してください。" };
    const elapsed = Math.max(0, nowMs - start);
    const remainingMs = Math.max(0, end - nowMs);
    const state = nowMs < start ? "before" : nowMs >= end ? "finished" : "running";
    return { valid: true, start, end, elapsed, remainingMs, state };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calculateSchedule, todayAt };
    return;
  }

  const $ = selector => document.querySelector(selector);
  const form = $("#settings");
  let settings = loadSettings();

  function timeValue(date) { return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; }
  function roundToFive(date) { const rounded = new Date(date); rounded.setSeconds(0, 0); rounded.setMinutes(Math.floor(rounded.getMinutes() / 5) * 5); return rounded; }

  function defaultSettings() {
    const start = roundToFive(new Date());
    const end = new Date(start.getTime() + 60 * 60000);
    return { startTime: timeValue(start), endTime: timeValue(end), endMode: "duration", durationHours: 1 };
  }

  function loadSettings() {
    try {
      const loaded = { ...defaultSettings(), ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
      if (loaded.startTime) loaded.startAt = todayAt(loaded.startTime, Date.now());
      if (loaded.endTime) loaded.endAt = todayAt(loaded.endTime, Date.now());
      return loaded;
    }
    catch (_) { return defaultSettings(); }
  }

  function setFormValues() {
    const defaults = defaultSettings();
    const startTime = settings.startTime || (settings.startAt ? timeValue(new Date(settings.startAt)) : defaults.startTime);
    const endTime = settings.endTime || (settings.endAt ? timeValue(new Date(settings.endAt)) : defaults.endTime);
    [["startHour", startTime.slice(0, 2)], ["startMinute", startTime.slice(3)], ["endHour", endTime.slice(0, 2)], ["endMinute", endTime.slice(3)]].forEach(([id, value]) => { $("#" + id).value = value; });
    $("#durationHours").value = settings.durationHours ?? defaults.durationHours;
    setEndMode(settings.endMode);
  }

  function setEndMode(mode) {
    settings.endMode = mode;
    document.querySelectorAll("[data-end-mode]").forEach(button => button.classList.toggle("active", button.dataset.endMode === mode));
    $("#endAtField").hidden = mode !== "datetime";
    $("#durationField").hidden = mode !== "duration";
    ["endHour", "endMinute"].forEach(id => { $("#" + id).required = mode === "datetime"; });
  }

  function collectSettings() {
    const now = Date.now();
    const startTime = `${$("#startHour").value}:${$("#startMinute").value}`;
    const endTime = `${$("#endHour").value}:${$("#endMinute").value}`;
    const startAt = todayAt(startTime, now);
    return { startTime, endTime, startAt, endAt: todayAt(endTime, now), endMode: settings.endMode, durationHours: Number($("#durationHours").value) };
  }

  function formatClock(ms) { return new Date(ms).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }); }
  function render() {
    const now = Date.now();
    $("#currentTime").textContent = new Date(now).toLocaleTimeString("ja-JP", { hour12: false });
    const result = calculateSchedule(settings, now);
    if (!result.valid) return;
    $("#remainingMinutes").textContent = Math.ceil(result.remainingMs / 60000);
    $("#scheduledEnd").textContent = formatClock(result.end);
  }

  document.querySelectorAll("[data-end-mode]").forEach(button => button.addEventListener("click", () => setEndMode(button.dataset.endMode)));
  function fillTimeSelects() {
    ["startHour", "endHour"].forEach(id => { $("#" + id).innerHTML = Array.from({ length: 24 }, (_, value) => `<option value="${String(value).padStart(2, "0")}">${String(value).padStart(2, "0")}</option>`).join(""); });
    ["startMinute", "endMinute"].forEach(id => { $("#" + id).innerHTML = Array.from({ length: 12 }, (_, index) => `<option value="${String(index * 5).padStart(2, "0")}">${String(index * 5).padStart(2, "0")}</option>`).join(""); });
  }
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

  fillTimeSelects();
  setFormValues();
  render();
  setInterval(render, 1000);
})(typeof globalThis !== "undefined" ? globalThis : this);
