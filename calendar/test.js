"use strict";
const assert = require("assert");
const { formatScheduleText, getCalendarCells, getJapaneseHolidays, parseDate } = require("./app.js");

assert.strictEqual(parseDate("2026-02-29"), null);
assert.ok(parseDate("2024-02-29"));

assert.strictEqual(formatScheduleText(new Set(["2026-08-08"]), new Map([["2026-08-08", { start: 12, end: 13 }]]), false), "8月8日（土）　12：00　〜　13：00");
assert.strictEqual(formatScheduleText(
  new Set(["2026-08-10", "2026-08-08"]),
  new Map([["2026-08-08", { start: 9, end: 12 }], ["2026-08-10", { start: 14, end: 18 }]]),
  true
), "・8月8日（土）　09：00　〜　12：00\n・8月10日（月）　14：00　〜　18：00");

const holidays2026 = getJapaneseHolidays(2026);
assert.strictEqual(holidays2026.get("2026-02-11"), "建国記念の日");
assert.strictEqual(holidays2026.get("2026-05-06"), "振替休日");
assert.strictEqual(holidays2026.get("2026-09-22"), "国民の休日");

const cells = getCalendarCells(2026, 7);
assert.strictEqual(cells.length, 42);
assert.strictEqual(cells[0].date.getDay(), 0);
assert.strictEqual(cells[41].date.getDay(), 6);
console.log("calendar tests passed");
