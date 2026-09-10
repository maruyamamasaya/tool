"use strict";

const assert = require("assert");
const fs = require("fs");
const { frequentSelection, normalizeSelection, toolSlug } = require("./app.js");

const ids = ["/tool/calendar", "/tool/json-formatter", "/tool/special"];
assert.deepStrictEqual(normalizeSelection([ids[1], "/tool/missing", ids[1]], ids), [ids[1]]);
assert.deepStrictEqual(normalizeSelection(null, ids), ids);
assert.strictEqual(toolSlug("/tool/json-formatter"), "json-formatter");
assert.deepStrictEqual(frequentSelection(ids), ["/tool/calendar", "/tool/json-formatter"]);

const html = fs.readFileSync(require.resolve("./index.html"), "utf8");
assert.ok(html.includes('data-preset="frequent"'));
assert.ok(html.includes('id="tool-settings"'));
assert.ok(html.includes('id="tool-search"'));

console.log("Tool Settings tests passed");
