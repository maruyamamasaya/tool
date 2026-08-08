"use strict";
const assert = require("assert");
const { calculateRange, formatRangeText, getJapaneseHolidays, parseDate } = require("./app.js");

assert.strictEqual(parseDate("2026-02-29"), null);
assert.ok(parseDate("2024-02-29"));
assert.strictEqual(formatRangeText("2026-08-08", "2026-08-14"), "8月8日\n〜\n8月14日");
assert.strictEqual(formatRangeText("2026-08-14", "2026-08-08"), "");

assert.deepStrictEqual(calculateRange("2026-08-08", "2026-08-14"), { totalDays: 7, weekendDays: 2, holidayDays: 1, businessDays: 4 });
assert.deepStrictEqual(calculateRange("2026-05-02", "2026-05-06"), { totalDays: 5, weekendDays: 2, holidayDays: 3, businessDays: 0 });
assert.strictEqual(calculateRange("2026-08-14", "2026-08-08"), null);
assert.ok(getJapaneseHolidays(2026).has("2026-05-06"));
assert.ok(getJapaneseHolidays(2026).has("2026-09-22"));
console.log("business-day-calculator tests passed");
