"use strict";
const assert = require("assert");
const { inputDevices, levelFromSamples, formatDuration } = require("./app.js");

assert.deepStrictEqual(inputDevices([
  { kind: "audiooutput", deviceId: "speaker", label: "Speaker" },
  { kind: "audioinput", deviceId: "default", label: "Built-in Mic" },
  { kind: "audioinput", deviceId: "usb", label: "" }
]), [
  { id: "default", label: "Built-in Mic", isDefault: true },
  { id: "usb", label: "マイク 2", isDefault: false }
]);
assert.strictEqual(levelFromSamples(new Uint8Array([128, 128, 128])), 0);
assert.ok(levelFromSamples(new Uint8Array([0, 255])) > 90);
assert.strictEqual(formatDuration(0), "00:00");
assert.strictEqual(formatDuration(9.9), "00:09");
assert.strictEqual(formatDuration(61), "01:01");
console.log("Microphone Check tests passed");
