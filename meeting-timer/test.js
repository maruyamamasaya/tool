"use strict";
const assert = require("assert");
const { calculateSchedule } = require("./app.js");

const base = { startAt: "2026-08-07T10:00:00Z", endAt: "2026-08-07T12:00:00Z", endMode: "datetime", durationHours: 2, splitAt: "2026-08-07T10:00:00Z", splitCount: 4, startTurn: 3 };
let result = calculateSchedule(base, Date.parse("2026-08-07T10:35:00Z"));
assert.equal(result.valid, true);
assert.equal(result.remainingMs, 85 * 60000);
assert.equal(result.turnIndex, 1);
assert.equal(result.firstTurn + result.turnIndex, 4);
assert.equal(result.turnLength, 30 * 60000);

result = calculateSchedule({ ...base, endMode: "duration", durationHours: 1.5 }, Date.parse("2026-08-07T09:00:00Z"));
assert.equal(result.state, "before");
assert.equal(result.end, Date.parse("2026-08-07T11:30:00Z"));

assert.equal(calculateSchedule({ ...base, endAt: base.startAt }, Date.now()).valid, false);
assert.equal(calculateSchedule({ ...base, splitAt: "2026-08-07T13:00:00Z" }, Date.now()).valid, false);
console.log("Meeting Timer tests passed");
