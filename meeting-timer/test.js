"use strict";
const assert = require("assert");
const { calculateSchedule, todayAt } = require("./app.js");

const base = { startAt: "2026-08-07T10:00:00Z", endAt: "2026-08-07T12:00:00Z", endMode: "datetime", durationHours: 2 };
let result = calculateSchedule(base, Date.parse("2026-08-07T10:35:00Z"));
assert.equal(result.valid, true);
assert.equal(result.remainingMs, 85 * 60000);

result = calculateSchedule({ ...base, endMode: "duration", durationHours: 1.5 }, Date.parse("2026-08-07T09:00:00Z"));
assert.equal(result.state, "before");
assert.equal(result.end, Date.parse("2026-08-07T11:30:00Z"));

assert.equal(calculateSchedule({ ...base, endAt: base.startAt }, Date.now()).valid, false);

const today = todayAt("14:25", Date.parse("2026-08-08T03:00:00Z"));
const referenceDate = new Date("2026-08-08T03:00:00Z");
const todayDate = new Date(today);
assert.deepStrictEqual(
  [todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), todayDate.getHours(), todayDate.getMinutes(), todayDate.getSeconds(), todayDate.getMilliseconds()],
  [referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 14, 25, 0, 0]
);
const currentDayAt = new Date(todayAt("14:22", Date.now()));
assert.deepStrictEqual([currentDayAt.getHours(), currentDayAt.getMinutes(), currentDayAt.getSeconds(), currentDayAt.getMilliseconds()], [14, 22, 0, 0]);
assert.equal(todayAt("invalid", Date.now()), "");
console.log("Meeting Timer tests passed");
