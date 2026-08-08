const assert = require("assert");
const { tools, popupFeatures, openTool, usesMiniWindow } = require("./launcher.js");

assert.strictEqual(tools["json-formatter"], "JSON Formatter");
assert.strictEqual(tools["cidr-analyzer"], "CIDR Analyzer");

const centeredWindow = {
  screen: { availWidth: 1920, availHeight: 1080 },
  screenX: 100,
  screenY: 50,
  outerWidth: 1400,
  outerHeight: 900
};
assert.strictEqual(
  popupFeatures(centeredWindow),
  "width=600,height=750,left=500,top=125,resizable=yes,scrollbars=yes"
);

let assignedUrl;
const mobileWindow = { innerWidth: 767, location: { assign: (url) => { assignedUrl = url; } } };
assert.strictEqual(openTool("./json-formatter/", "json_formatter", mobileWindow), null);
assert.strictEqual(assignedUrl, "./json-formatter/");

assert.strictEqual(usesMiniWindow({ innerWidth: 1024, matchMedia: () => ({ matches: true }) }), false);
assert.strictEqual(usesMiniWindow({ innerWidth: 1024, matchMedia: () => ({ matches: false }) }), true);

let fallbackUrl;
const blockedWindow = {
  ...centeredWindow,
  innerWidth: 1200,
  location: { assign: (url) => { fallbackUrl = url; } },
  open: () => null
};
assert.strictEqual(openTool("./diff-viewer/", "diff_viewer", blockedWindow), null);
assert.strictEqual(fallbackUrl, "./diff-viewer/");

let focused = false;
const popup = { focus: () => { focused = true; } };
const desktopWindow = { ...blockedWindow, open: () => popup };
assert.strictEqual(openTool("./cidr-analyzer/", "cidr_analyzer", desktopWindow), popup);
assert.strictEqual(focused, true);

console.log("launcher tests passed");
