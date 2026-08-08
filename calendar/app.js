(function () {
  "use strict";

  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day ? date : null;
  }

  function formatInputDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function nthMonday(year, month, nth) {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return 1 + ((8 - first) % 7) + (nth - 1) * 7;
  }

  function equinoxDay(year, autumn) {
    return Math.floor((autumn ? 23.2488 : 20.8431) + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }

  function getJapaneseHolidays(year) {
    const holidays = new Map();
    const add = (month, day, name) => holidays.set(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, name);
    if (year < 1948) return holidays;
    add(1, 1, "元日");
    if (year >= 2000) add(1, nthMonday(year, 1, 2), "成人の日"); else if (year >= 1949) add(1, 15, "成人の日");
    if (year >= 1967) add(2, 11, "建国記念の日");
    if (year >= 2020) add(2, 23, "天皇誕生日");
    add(3, equinoxDay(year, false), "春分の日");
    add(4, 29, year >= 2007 ? "昭和の日" : year >= 1989 ? "みどりの日" : "天皇誕生日");
    add(5, 3, "憲法記念日");
    if (year >= 2007) add(5, 4, "みどりの日");
    add(5, 5, "こどもの日");
    if (year >= 1996 && year !== 2020 && year !== 2021) add(7, year >= 2003 ? nthMonday(year, 7, 3) : 20, "海の日");
    if (year === 2020) add(7, 23, "海の日");
    if (year === 2021) add(7, 22, "海の日");
    if (year >= 2016) add(year === 2020 ? 7 : 8, year === 2020 ? 24 : year === 2021 ? 8 : 11, "山の日");
    if (year >= 1966) add(9, year >= 2003 ? nthMonday(year, 9, 3) : 15, "敬老の日");
    add(9, equinoxDay(year, true), "秋分の日");
    if (year >= 1966 && year !== 2020 && year !== 2021) add(10, year >= 2000 ? nthMonday(year, 10, 2) : 10, year >= 2020 ? "スポーツの日" : "体育の日");
    if (year === 2020) add(7, 24, "スポーツの日");
    if (year === 2021) add(7, 23, "スポーツの日");
    add(11, 3, "文化の日"); add(11, 23, "勤労感謝の日");
    if (year >= 1989 && year <= 2018) add(12, 23, "天皇誕生日");
    if (year === 2019) { add(5, 1, "天皇の即位の日"); add(10, 22, "即位礼正殿の儀"); }

    // 国民の休日（祝日に挟まれた平日）と振替休日を反映する。
    let changed = true;
    while (changed) {
      changed = false;
      for (let day = new Date(Date.UTC(year, 0, 2)); day.getUTCFullYear() === year; day.setUTCDate(day.getUTCDate() + 1)) {
        const key = day.toISOString().slice(0, 10);
        if (holidays.has(key)) continue;
        const previous = new Date(day); previous.setUTCDate(day.getUTCDate() - 1);
        const next = new Date(day); next.setUTCDate(day.getUTCDate() + 1);
        if (holidays.has(previous.toISOString().slice(0, 10)) && holidays.has(next.toISOString().slice(0, 10))) {
          holidays.set(key, "国民の休日"); changed = true;
        }
      }
    }
    [...holidays.keys()].forEach(key => {
      const holiday = parseDate(key);
      if (holiday.getUTCDay() !== 0 || year < 1973) return;
      const substitute = new Date(holiday);
      do { substitute.setUTCDate(substitute.getUTCDate() + 1); } while (holidays.has(substitute.toISOString().slice(0, 10)));
      if (substitute.getUTCFullYear() === year) holidays.set(substitute.toISOString().slice(0, 10), "振替休日");
    });
    return holidays;
  }

  function getCalendarCells(year, month) {
    const firstWeekday = new Date(year, month, 1).getDay();
    const firstCell = new Date(year, month, 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstCell); date.setDate(firstCell.getDate() + index);
      return { date, currentMonth: date.getMonth() === month };
    });
  }

  function formatScheduleText(dates, times, multiple) {
    return [...dates].sort().map(value => {
      const date = parseDate(value);
      const time = times.get(value);
      if (!time || time.end <= time.start) return "";
      const line = `${date.getUTCMonth() + 1}月${date.getUTCDate()}日　${String(time.start).padStart(2, "0")}：00　〜　${String(time.end).padStart(2, "0")}：00`;
      return multiple ? `・${line}` : line;
    }).filter(Boolean).join("\n");
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { formatScheduleText, getCalendarCells, getJapaneseHolidays, parseDate };
    return;
  }

  const $ = selector => document.querySelector(selector);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let displayDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectionMode = "single";
  let selectedDates = new Set();
  const dateTimes = new Map();
  const customHolidays = new Map();

  const holidayCache = new Map();
  function holidaysFor(year) {
    if (!holidayCache.has(year)) holidayCache.set(year, getJapaneseHolidays(year));
    return holidayCache.get(year);
  }

  function holidayName(value) { return customHolidays.get(value) || holidaysFor(Number(value.slice(0, 4))).get(value) || ""; }

  function renderCalendar() {
    const year = displayDate.getFullYear(); const month = displayDate.getMonth();
    $("#yearLabel").textContent = `${year}年`; $("#monthLabel").textContent = `${month + 1}月`;
    $("#calendarGrid").innerHTML = getCalendarCells(year, month).map(({ date, currentMonth }) => {
      const value = formatInputDate(date); const holiday = holidayName(value); const day = date.getDay();
      const type = holiday || day === 0 ? "holiday" : day === 6 ? "saturday" : "weekday";
      const classes = [type, currentMonth ? "" : "outside", selectedDates.has(value) ? "selected" : "", value === formatInputDate(today) ? "today" : ""].filter(Boolean).join(" ");
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${holiday ? `、${holiday}` : ""}`;
      return `<button type="button" role="gridcell" class="${classes}" data-date="${value}" aria-label="${label}" aria-pressed="${selectedDates.has(value)}"><span class="day-number">${date.getDate()}</span>${holiday && currentMonth ? `<small>${holiday}</small>` : ""}</button>`;
    }).join("");
  }

  function renderOutput() {
    const invalidDates = [...selectedDates].filter(date => dateTimes.get(date).end <= dateTimes.get(date).start);
    $("#timeError").textContent = invalidDates.length ? "終了時間は開始時間より後にしてください。" : "";
    const text = invalidDates.length ? "" : formatScheduleText(selectedDates, dateTimes, selectionMode === "multiple");
    $("#outputText").value = text; $("#selectedCount").textContent = `${selectedDates.size}件`;
    $("#copyButton").disabled = !text;
  }

  function timeOptions(selected) {
    return Array.from({ length: 24 }, (_, hour) => `<option value="${hour}"${hour === selected ? " selected" : ""}>${String(hour).padStart(2, "0")}：00</option>`).join("");
  }

  function renderDateTimes() {
    $("#dateTimeList").innerHTML = [...selectedDates].sort().map(date => {
      const time = dateTimes.get(date);
      const parsed = parseDate(date);
      const label = `${parsed.getUTCMonth() + 1}月${parsed.getUTCDate()}日`;
      return `<div class="date-time-row${time.end <= time.start ? " invalid" : ""}" data-time-date="${date}"><strong>${label}</strong><select data-time-field="start" aria-label="${label}の開始時間">${timeOptions(time.start)}</select><span aria-hidden="true">〜</span><select data-time-field="end" aria-label="${label}の終了時間">${timeOptions(time.end)}</select></div>`;
    }).join("");
  }

  function renderHolidayList() {
    $("#customHolidayList").innerHTML = [...customHolidays].sort().map(([date, name]) => `<li><span><time datetime="${date}">${date.replace(/-/g, "/")}</time>${name}</span><button type="button" data-remove-holiday="${date}" aria-label="${name}を削除">削除</button></li>`).join("");
  }

  $("#calendarGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-date]"); if (!button) return;
    const value = button.dataset.date;
    if (selectionMode === "single") {
      selectedDates = new Set([value]);
    } else if (selectedDates.has(value)) {
      selectedDates.delete(value);
    } else {
      selectedDates.add(value);
    }
    if (selectedDates.has(value) && !dateTimes.has(value)) dateTimes.set(value, { start: Number($("#startTime").value), end: Number($("#endTime").value) });
    const picked = parseDate(value); displayDate = new Date(picked.getUTCFullYear(), picked.getUTCMonth(), 1);
    renderCalendar(); renderDateTimes(); renderOutput();
  });

  document.querySelectorAll("[name=selectionMode]").forEach(input => input.addEventListener("change", event => {
    selectionMode = event.target.value;
    if (selectionMode === "single" && selectedDates.size > 1) selectedDates = new Set([[...selectedDates].sort()[0]]);
    $("#selectionHelp").textContent = selectionMode === "multiple" ? "候補日をクリックして追加・解除できます。" : "カレンダーから日付を1つ選んでください。";
    renderCalendar(); renderDateTimes(); renderOutput();
  }));
  $("#dateTimeList").addEventListener("change", event => {
    const field = event.target.dataset.timeField; if (!field) return;
    const date = event.target.closest("[data-time-date]").dataset.timeDate;
    dateTimes.get(date)[field] = Number(event.target.value);
    renderDateTimes(); renderOutput();
  });
  $("#previousMonth").addEventListener("click", () => { displayDate.setMonth(displayDate.getMonth() - 1); renderCalendar(); });
  $("#nextMonth").addEventListener("click", () => { displayDate.setMonth(displayDate.getMonth() + 1); renderCalendar(); });
  $("#todayButton").addEventListener("click", () => { displayDate = new Date(today.getFullYear(), today.getMonth(), 1); renderCalendar(); });
  $("#copyButton").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#outputText").value);
    $("#copyStatus").textContent = "コピーしました";
    setTimeout(() => { $("#copyStatus").textContent = ""; }, 1800);
  });
  $("#addHoliday").addEventListener("click", () => {
    const date = $("#customHolidayDate").value; const name = $("#customHolidayName").value.trim();
    if (!parseDate(date) || !name) { $("#holidayError").textContent = "日付と祝日名を入力してください。"; return; }
    customHolidays.set(date, name); $("#holidayError").textContent = ""; $("#customHolidayName").value = "";
    renderHolidayList(); renderCalendar();
  });
  $("#customHolidayList").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-holiday]"); if (!button) return;
    customHolidays.delete(button.dataset.removeHoliday); renderHolidayList(); renderCalendar();
  });

  const options = timeOptions(-1);
  $("#startTime").innerHTML = options; $("#endTime").innerHTML = options;
  $("#startTime").value = "12"; $("#endTime").value = "13";
  renderCalendar(); renderOutput();
})();
