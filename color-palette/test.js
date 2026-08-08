const assert = require("assert");
const { paletteGroups, colors, gradientPresets, normalizeHex, hexToRgb, makeGradient } = require("./app.js");

assert.strictEqual(paletteGroups.length, 11);
assert.strictEqual(colors.length, 120);
assert.strictEqual(new Set(colors).size, 120);
assert.strictEqual(normalizeHex("4caf50"), "#4CAF50");
assert.strictEqual(normalizeHex("#fff"), "#FFFFFF");
assert.strictEqual(normalizeHex("  #FF5733 "), "#FF5733");
assert.strictEqual(normalizeHex("GGGGGG"), null);
assert.deepStrictEqual(hexToRgb("#4CAF50"), [76, 175, 80]);
assert.strictEqual(hexToRgb("invalid"), null);
assert.strictEqual(gradientPresets.length, 8);
assert.strictEqual(makeGradient("#833ab4", "fd1d1d", "135deg"), "linear-gradient(135deg, #833AB4, #FD1D1D)");
assert.strictEqual(makeGradient("invalid", "#FFFFFF"), null);
assert.strictEqual(makeGradient("#000000", "#FFFFFF", "12deg"), null);
console.log("Color Palette tests passed");
