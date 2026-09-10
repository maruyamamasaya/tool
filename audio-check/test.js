"use strict";
const assert = require("assert");
const { outputDevices, testSequence } = require("./app.js");

assert.deepStrictEqual(outputDevices([
  { kind: "audioinput", deviceId: "mic", label: "Mic" },
  { kind: "audiooutput", deviceId: "default", label: "Headphones" },
  { kind: "audiooutput", deviceId: "speaker", label: "" }
]), [
  { id: "default", label: "Headphones", isDefault: true },
  { id: "speaker", label: "音声出力 2", isDefault: false }
]);
assert.deepStrictEqual(testSequence("left"), [{ pan: -1, delay: 0, label: "左" }]);
assert.deepStrictEqual(testSequence("right"), [{ pan: 1, delay: 0, label: "右" }]);
assert.deepStrictEqual(testSequence("stereo").map(step => step.label), ["左", "右", "両方"]);
console.log("Audio Check tests passed");
