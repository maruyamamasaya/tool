"use strict";
const assert = require("assert");
const { calculateDateRange, getCalendarCells, parseDate } = require("./app.js");

assert.strictEqual(parseDate("2026-02-29"), null);
assert.ok(parseDate("2024-02-29"));

let result = calculateDateRange("2026-08-03", "2026-08-09", true);
assert.deepStrictEqual({ total: result.totalDays, business: result.businessDays, weekend: result.weekendDays }, { total: 7, business: 5, weekend: 2 });

result = calculateDateRange("2026-08-07", "2026-08-10", false);
assert.deepStrictEqual({ total: result.totalDays, business: result.businessDays, weekend: result.weekendDays }, { total: 3, business: 1, weekend: 2 });
assert.strictEqual(calculateDateRange("2026-08-10", "2026-08-07", true).valid, false);

const cells = getCalendarCells(2026, 7);
assert.strictEqual(cells.length, 42);
assert.strictEqual(cells[0].date.getDay(), 0);
assert.strictEqual(cells[41].date.getDay(), 6);
console.log("calendar tests passed");
