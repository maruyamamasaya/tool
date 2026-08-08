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
    const holidays = new Map();
    const add = (month, day, name = "祝日") => holidays.set(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, name);
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
        if (holidays.has(dateKey(before)) && holidays.has(dateKey(after))) { holidays.set(key, "国民の休日"); changed = true; }
      }
    }
    [...holidays.keys()].forEach(key => {
      const holiday = parseDate(key); if (holiday.getUTCDay() !== 0 || year < 1973) return;
      const substitute = new Date(holiday); do { substitute.setUTCDate(substitute.getUTCDate() + 1); } while (holidays.has(dateKey(substitute)));
      if (substitute.getUTCFullYear() === year) holidays.set(dateKey(substitute), "振替休日");
    });
    return holidays;
  }

  function calculateRange(startValue, endValue, customHolidays = new Map()) {
    const start = parseDate(startValue); const end = parseDate(endValue);
    if (!start || !end || start > end) return null;
    const cache = new Map(); let totalDays = 0; let weekendDays = 0; let holidayDays = 0; let businessDays = 0;
    for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      totalDays += 1;
      const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
      if (!cache.has(date.getUTCFullYear())) cache.set(date.getUTCFullYear(), getJapaneseHolidays(date.getUTCFullYear()));
      const holiday = cache.get(date.getUTCFullYear()).has(dateKey(date)) || customHolidays.has(dateKey(date));
      if (weekend) weekendDays += 1;
      else if (holiday) holidayDays += 1;
      else businessDays += 1;
    }
    return { totalDays, weekendDays, holidayDays, businessDays };
  }

  function formatRangeText(startValue, endValue, formatType = "multiline") {
    const start = parseDate(startValue); const end = parseDate(endValue); if (!start || !end || start > end) return "";
    const format = date => `${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
    const withWeekday = date => `${format(date)}（${["日", "月", "火", "水", "木", "金", "土"][date.getUTCDay()]}）`;
    const totalDays = Math.round((end - start) / 86400000) + 1;
    const formats = {
      multiline: `${format(start)}\n〜\n${format(end)}`,
      tilde: `${format(start)}〜${format(end)}`,
      weekday: `${withWeekday(start)}〜${withWeekday(end)}`,
      hyphen: `${format(start)} - ${format(end)}`,
      duration: `${format(start)}〜${format(end)}（${totalDays}日間）`
    };
    return formats[formatType] || formats.multiline;
  }

  function getCalendarCells(year, month) {
    const firstWeekday = new Date(year, month, 1).getDay();
    const firstCell = new Date(year, month, 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstCell); date.setDate(firstCell.getDate() + index);
      return { date, currentMonth: date.getMonth() === month };
    });
  }

  if (typeof module !== "undefined" && module.exports) { module.exports = { calculateRange, formatRangeText, getCalendarCells, getJapaneseHolidays, parseDate }; return; }

  const $ = selector => document.querySelector(selector);
  const localKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const escapeHtml = value => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let displayDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let pendingStart = false;
  const customHolidays = new Map();
  const holidayCache = new Map();

  function holidaysFor(year) {
    if (!holidayCache.has(year)) holidayCache.set(year, getJapaneseHolidays(year));
    return holidayCache.get(year);
  }

  function holidayName(value) { return customHolidays.get(value) || holidaysFor(Number(value.slice(0, 4))).get(value) || ""; }

  function renderCalendar() {
    const year = displayDate.getFullYear(); const month = displayDate.getMonth();
    const start = $("#startDate").value; const end = $("#endDate").value;
    $("#yearLabel").textContent = `${year}年`; $("#monthLabel").textContent = `${month + 1}月`;
    $("#calendarGrid").innerHTML = getCalendarCells(year, month).map(({ date, currentMonth }) => {
      const value = localKey(date); const holiday = holidayName(value); const day = date.getDay();
      const type = holiday || day === 0 ? "holiday" : day === 6 ? "saturday" : "weekday";
      const selected = start && end ? value >= start && value <= end : value === start;
      const classes = [type, currentMonth ? "" : "outside", selected ? "selected" : "", value === localKey(today) ? "today" : ""].filter(Boolean).join(" ");
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${holiday ? `、${holiday}` : ""}`;
      return `<button type="button" role="gridcell" class="${classes}" data-date="${value}" aria-label="${escapeHtml(label)}" aria-pressed="${Boolean(selected)}"><span class="day-number">${date.getDate()}</span>${holiday && currentMonth ? `<small>${escapeHtml(holiday)}</small>` : ""}</button>`;
    }).join("");
  }

  function render() {
    const start = $("#startDate").value; const end = $("#endDate").value; const result = calculateRange(start, end, customHolidays);
    $("#dateError").textContent = start && end && !result ? "終了日は開始日以降を選択してください。" : "";
    ["businessDays", "totalDays", "weekendDays", "holidayDays"].forEach(id => { $("#" + id).textContent = result ? result[id] : "—"; });
    const text = result ? formatRangeText(start, end, $("#outputFormat").value) : ""; $("#outputText").value = text; $("#copyButton").disabled = !text;
    $("#selectionHelp").textContent = pendingStart ? "終了日を選んでください。" : "カレンダーで開始日を選んでください。";
    renderCalendar();
  }
  function setRange(start, end) { $("#startDate").value = localKey(start); $("#endDate").value = localKey(end); pendingStart = false; displayDate = new Date(start.getFullYear(), start.getMonth(), 1); render(); }
  ["#startDate", "#endDate"].forEach(id => $(id).addEventListener("change", render));
  $("#outputFormat").addEventListener("change", render);
  document.querySelectorAll("[data-range]").forEach(button => button.addEventListener("click", () => { const start = new Date(); const end = new Date(start); end.setDate(start.getDate() + Number(button.dataset.range) - 1); setRange(start, end); }));
  $("#thisMonth").addEventListener("click", () => { const today = new Date(); setRange(new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth() + 1, 0)); });
  $("#calendarGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-date]"); if (!button) return;
    const value = button.dataset.date;
    if (!pendingStart) { $("#startDate").value = value; $("#endDate").value = ""; pendingStart = true; }
    else {
      const start = $("#startDate").value;
      $("#startDate").value = value < start ? value : start;
      $("#endDate").value = value < start ? start : value;
      pendingStart = false;
    }
    const picked = parseDate(value); displayDate = new Date(picked.getUTCFullYear(), picked.getUTCMonth(), 1); render();
  });
  $("#previousMonth").addEventListener("click", () => { displayDate.setMonth(displayDate.getMonth() - 1); renderCalendar(); });
  $("#nextMonth").addEventListener("click", () => { displayDate.setMonth(displayDate.getMonth() + 1); renderCalendar(); });
  $("#todayButton").addEventListener("click", () => { displayDate = new Date(today.getFullYear(), today.getMonth(), 1); renderCalendar(); });
  $("#copyButton").addEventListener("click", async () => { await navigator.clipboard.writeText($("#outputText").value); $("#copyStatus").textContent = "コピーしました"; setTimeout(() => { $("#copyStatus").textContent = ""; }, 1800); });
  function renderHolidayList() {
    $("#customHolidayList").innerHTML = [...customHolidays].sort().map(([date, name]) => `<li><span><time datetime="${date}">${date.replace(/-/g, "/")}</time>${escapeHtml(name)}</span><button type="button" data-remove-holiday="${date}" aria-label="${escapeHtml(name)}を削除">削除</button></li>`).join("");
  }
  $("#addHoliday").addEventListener("click", () => {
    const date = $("#customHolidayDate").value; const name = $("#customHolidayName").value.trim();
    if (!parseDate(date) || !name) { $("#holidayError").textContent = "日付と祝日名を入力してください。"; return; }
    customHolidays.set(date, name); $("#holidayError").textContent = ""; $("#customHolidayName").value = "";
    renderHolidayList(); render();
  });
  $("#customHolidayList").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-holiday]"); if (!button) return;
    customHolidays.delete(button.dataset.removeHoliday); renderHolidayList(); render();
  });
  const weekLater = new Date(today); weekLater.setDate(today.getDate() + 6); setRange(today, weekLater);
})();
