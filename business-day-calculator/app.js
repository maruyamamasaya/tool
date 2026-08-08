(function () {
  "use strict";

  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    const year = Number(match[1]); const month = Number(match[2]) - 1; const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day ? date : null;
  }

  function dateKey(date) { return date.toISOString().slice(0, 10); }
  function nthMonday(year, month, nth) { const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); return 1 + ((8 - first) % 7) + (nth - 1) * 7; }
  function equinoxDay(year, autumn) { return Math.floor((autumn ? 23.2488 : 20.8431) + .242194 * (year - 1980) - Math.floor((year - 1980) / 4)); }

  function getJapaneseHolidays(year) {
    const holidays = new Set();
    const add = (month, day) => holidays.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    if (year < 1948) return holidays;
    add(1, 1); add(1, year >= 2000 ? nthMonday(year, 1, 2) : 15);
    if (year >= 1967) add(2, 11); if (year >= 2020) add(2, 23);
    add(3, equinoxDay(year, false)); add(4, 29); add(5, 3); if (year >= 2007) add(5, 4); add(5, 5);
    if (year >= 1996 && year !== 2020 && year !== 2021) add(7, year >= 2003 ? nthMonday(year, 7, 3) : 20);
    if (year === 2020) add(7, 23); if (year === 2021) add(7, 22);
    if (year >= 2016) add(year === 2020 ? 7 : 8, year === 2020 ? 24 : year === 2021 ? 8 : 11);
    if (year >= 1966) add(9, year >= 2003 ? nthMonday(year, 9, 3) : 15);
    add(9, equinoxDay(year, true));
    if (year >= 1966 && year !== 2020 && year !== 2021) add(10, year >= 2000 ? nthMonday(year, 10, 2) : 10);
    if (year === 2020) add(7, 24); if (year === 2021) add(7, 23);
    add(11, 3); add(11, 23); if (year >= 1989 && year <= 2018) add(12, 23);
    if (year === 2019) { add(5, 1); add(10, 22); }

    let changed = true;
    while (changed) {
      changed = false;
      for (let date = new Date(Date.UTC(year, 0, 2)); date.getUTCFullYear() === year; date.setUTCDate(date.getUTCDate() + 1)) {
        const key = dateKey(date); if (holidays.has(key)) continue;
        const before = new Date(date); before.setUTCDate(date.getUTCDate() - 1);
        const after = new Date(date); after.setUTCDate(date.getUTCDate() + 1);
        if (holidays.has(dateKey(before)) && holidays.has(dateKey(after))) { holidays.add(key); changed = true; }
      }
    }
    [...holidays].forEach(key => {
      const holiday = parseDate(key); if (holiday.getUTCDay() !== 0 || year < 1973) return;
      const substitute = new Date(holiday); do { substitute.setUTCDate(substitute.getUTCDate() + 1); } while (holidays.has(dateKey(substitute)));
      if (substitute.getUTCFullYear() === year) holidays.add(dateKey(substitute));
    });
    return holidays;
  }

  function calculateRange(startValue, endValue) {
    const start = parseDate(startValue); const end = parseDate(endValue);
    if (!start || !end || start > end) return null;
    const cache = new Map(); let totalDays = 0; let weekendDays = 0; let holidayDays = 0; let businessDays = 0;
    for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      totalDays += 1;
      const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
      if (!cache.has(date.getUTCFullYear())) cache.set(date.getUTCFullYear(), getJapaneseHolidays(date.getUTCFullYear()));
      const holiday = cache.get(date.getUTCFullYear()).has(dateKey(date));
      if (weekend) weekendDays += 1;
      else if (holiday) holidayDays += 1;
      else businessDays += 1;
    }
    return { totalDays, weekendDays, holidayDays, businessDays };
  }

  function formatRangeText(startValue, endValue) {
    const start = parseDate(startValue); const end = parseDate(endValue); if (!start || !end || start > end) return "";
    const format = date => `${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
    return `${format(start)}\n〜\n${format(end)}`;
  }

  if (typeof module !== "undefined" && module.exports) { module.exports = { calculateRange, formatRangeText, getJapaneseHolidays, parseDate }; return; }

  const $ = selector => document.querySelector(selector);
  const localKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  function render() {
    const start = $("#startDate").value; const end = $("#endDate").value; const result = calculateRange(start, end);
    $("#dateError").textContent = start && end && !result ? "終了日は開始日以降を選択してください。" : "";
    ["businessDays", "totalDays", "weekendDays", "holidayDays"].forEach(id => { $("#" + id).textContent = result ? result[id] : "—"; });
    const text = result ? formatRangeText(start, end) : ""; $("#outputText").value = text; $("#copyButton").disabled = !text;
  }
  function setRange(start, end) { $("#startDate").value = localKey(start); $("#endDate").value = localKey(end); render(); }
  ["#startDate", "#endDate"].forEach(id => $(id).addEventListener("change", render));
  document.querySelectorAll("[data-range]").forEach(button => button.addEventListener("click", () => { const start = new Date(); const end = new Date(start); end.setDate(start.getDate() + Number(button.dataset.range) - 1); setRange(start, end); }));
  $("#thisMonth").addEventListener("click", () => { const today = new Date(); setRange(new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth() + 1, 0)); });
  $("#copyButton").addEventListener("click", async () => { await navigator.clipboard.writeText($("#outputText").value); $("#copyStatus").textContent = "コピーしました"; setTimeout(() => { $("#copyStatus").textContent = ""; }, 1800); });
  const today = new Date(); const weekLater = new Date(today); weekLater.setDate(today.getDate() + 6); setRange(today, weekLater);
})();
