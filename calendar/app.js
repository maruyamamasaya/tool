(function (root) {
  "use strict";

  const DAY_MS = 86400000;

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

  function calculateDateRange(startValue, endValue, includeBoth) {
    const start = parseDate(startValue);
    const end = parseDate(endValue);
    if (!start || !end) return { valid: false, error: "開始日と終了日を選択してください。" };
    if (end < start) return { valid: false, error: "終了日は開始日以降に設定してください。" };

    const elapsedDays = Math.round((end - start) / DAY_MS);
    const totalDays = elapsedDays + (includeBoth ? 1 : 0);
    let businessDays = 0;
    let weekendDays = 0;
    const firstOffset = includeBoth ? 0 : 1;
    for (let offset = firstOffset; offset <= elapsedDays; offset += 1) {
      const weekday = new Date(start.getTime() + offset * DAY_MS).getUTCDay();
      if (weekday === 0 || weekday === 6) weekendDays += 1;
      else businessDays += 1;
    }
    return { valid: true, totalDays, elapsedDays, businessDays, weekendDays, weeks: Math.floor(totalDays / 7), remainderDays: totalDays % 7 };
  }

  function getCalendarCells(year, month) {
    const firstWeekday = new Date(year, month, 1).getDay();
    const firstCell = new Date(year, month, 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstCell);
      date.setDate(firstCell.getDate() + index);
      return { date, currentMonth: date.getMonth() === month };
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calculateDateRange, getCalendarCells, parseDate };
    return;
  }

  const $ = selector => document.querySelector(selector);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let displayDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectionStep = "start";

  function renderCalendar() {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    $("#yearLabel").textContent = `${year}`;
    $("#monthLabel").textContent = `${month + 1}月`;
    const start = $("#startDate").value;
    const end = $("#endDate").value;
    const todayValue = formatInputDate(today);
    $("#calendarGrid").innerHTML = getCalendarCells(year, month).map(({ date, currentMonth }) => {
      const value = formatInputDate(date);
      const inRange = start && end && value >= start && value <= end;
      const classes = [currentMonth ? "" : "outside", value === todayValue ? "today" : "", inRange ? "in-range" : "", value === start ? "range-start" : "", value === end ? "range-end" : ""].filter(Boolean).join(" ");
      return `<button type="button" role="gridcell" class="${classes}" data-date="${value}" aria-label="${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日"><span>${date.getDate()}</span></button>`;
    }).join("");
  }

  function renderResults() {
    const result = calculateDateRange($("#startDate").value, $("#endDate").value, $("#includeBoth").checked);
    $("#dateError").textContent = result.valid ? "" : result.error;
    ["#totalDays", "#businessDays", "#weekendDays", "#weeksDays"].forEach(id => { $(id).textContent = "—"; });
    if (!result.valid) { $("#rangeCaption").textContent = "日付を選択すると結果が表示されます"; renderCalendar(); return; }
    $("#totalDays").textContent = result.totalDays;
    $("#businessDays").textContent = result.businessDays;
    $("#weekendDays").textContent = result.weekendDays;
    $("#weeksDays").textContent = `${result.weeks}週 ${result.remainderDays}日`;
    const formatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" });
    $("#rangeCaption").textContent = `${formatter.format(parseDate($("#startDate").value))} 〜 ${formatter.format(parseDate($("#endDate").value))}`;
    renderCalendar();
  }

  $("#calendarGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-date]");
    if (!button) return;
    const value = button.dataset.date;
    if (selectionStep === "start" || !$("#startDate").value || ($("#startDate").value && $("#endDate").value)) {
      $("#startDate").value = value;
      $("#endDate").value = "";
      selectionStep = "end";
    } else {
      if (value < $("#startDate").value) { $("#endDate").value = $("#startDate").value; $("#startDate").value = value; }
      else $("#endDate").value = value;
      selectionStep = "start";
    }
    const picked = parseDate(value);
    displayDate = new Date(picked.getUTCFullYear(), picked.getUTCMonth(), 1);
    renderResults();
  });

  ["#startDate", "#endDate", "#includeBoth"].forEach(id => $(id).addEventListener("change", () => { selectionStep = "start"; renderResults(); }));
  $("#previousMonth").addEventListener("click", () => { displayDate.setMonth(displayDate.getMonth() - 1); renderCalendar(); });
  $("#nextMonth").addEventListener("click", () => { displayDate.setMonth(displayDate.getMonth() + 1); renderCalendar(); });
  $("#todayButton").addEventListener("click", () => { displayDate = new Date(today.getFullYear(), today.getMonth(), 1); renderCalendar(); });
  $("#swapDates").addEventListener("click", () => {
    const start = $("#startDate").value;
    const end = $("#endDate").value;
    if (!start || !end) return;
    $("#startDate").value = end;
    $("#endDate").value = start;
    renderResults();
  });

  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
  $("#startDate").value = formatInputDate(today);
  $("#endDate").value = formatInputDate(nextWeek);
  renderResults();
})(typeof globalThis !== "undefined" ? globalThis : this);
