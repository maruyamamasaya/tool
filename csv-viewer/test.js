"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const markup = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");

assert.match(app, /const MIN_COLUMN_WIDTH = 48;/);
assert.doesNotMatch(app, /MAX_COLUMN_WIDTH/);
assert.match(app, /Math\.min\(MAX_AUTO_FIT_WIDTH, normalizeColumnWidth\(widest\)\)/);
assert.match(markup, /<select id="overflowMode">/);
assert.match(markup, /<option value="ellipsis">…で省略<\/option>/);
assert.match(markup, /<option value="clip">非表示<\/option>/);
assert.match(styles, /table\[data-overflow="clip"\] td \{ text-overflow: clip; \}/);
assert.match(styles, /td \{[^}]*text-overflow: ellipsis;/);

console.log("csv-viewer tests passed");
