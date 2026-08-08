"use strict";
const assert = require("assert");
const { calculateRange, formatRangeText, getCalendarCells, getJapaneseHolidays, parseDate } = require("./app.js");

assert.strictEqual(parseDate("2026-02-29"), null);
assert.ok(parseDate("2024-02-29"));
assert.strictEqual(formatRangeText("2026-08-08", "2026-08-14"), "8月8日\n〜\n8月14日");
assert.strictEqual(formatRangeText("2026-08-08", "2026-08-14", "tilde"), "8月8日〜8月14日");
assert.strictEqual(formatRangeText("2026-08-08", "2026-08-14", "weekday"), "8月8日（土）〜8月14日（金）");
assert.strictEqual(formatRangeText("2026-08-08", "2026-08-14", "hyphen"), "8月8日 - 8月14日");
assert.strictEqual(formatRangeText("2026-08-08", "2026-08-14", "duration"), "8月8日〜8月14日（7日間）");
assert.strictEqual(formatRangeText("2026-08-08", "2026-08-14", "unknown"), "8月8日\n〜\n8月14日");
assert.strictEqual(formatRangeText("2026-08-14", "2026-08-08"), "");

assert.deepStrictEqual(calculateRange("2026-08-08", "2026-08-14"), { totalDays: 7, weekendDays: 2, holidayDays: 1, businessDays: 4 });
assert.deepStrictEqual(calculateRange("2026-05-02", "2026-05-06"), { totalDays: 5, weekendDays: 2, holidayDays: 3, businessDays: 0 });
assert.strictEqual(calculateRange("2026-08-14", "2026-08-08"), null);
assert.deepStrictEqual(calculateRange("2026-08-10", "2026-08-12", new Map([["2026-08-12", "会社休日"]])), { totalDays: 3, weekendDays: 0, holidayDays: 2, businessDays: 1 });
assert.ok(getJapaneseHolidays(2026).has("2026-05-06"));
assert.ok(getJapaneseHolidays(2026).has("2026-09-22"));
assert.strictEqual(getCalendarCells(2026, 7).length, 42);
assert.strictEqual(getCalendarCells(2026, 7)[0].date.getDate(), 26);
console.log("business-day-calculator tests passed");
