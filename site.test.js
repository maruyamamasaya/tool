const assert = require("assert");
const { openTool, popupFeatures, usesMiniWindow } = require("./site.js");

const centeredWindow = {
  innerWidth: 1200,
  screen: { availWidth: 1920, availHeight: 1080 },
  screenX: 100,
  screenY: 50,
  outerWidth: 1400,
  outerHeight: 900,
  matchMedia: () => ({ matches: false })
};
assert.strictEqual(popupFeatures(centeredWindow), "width=600,height=750,left=500,top=125,resizable=yes,scrollbars=yes");
assert.strictEqual(usesMiniWindow({ innerWidth: 767, matchMedia: () => ({ matches: false }) }), false);
assert.strictEqual(usesMiniWindow({ innerWidth: 1024, matchMedia: () => ({ matches: true }) }), false);

let prevented = false;
let focused = false;
const popup = { focus: () => { focused = true; } };
const desktopWindow = { ...centeredWindow, open: () => popup };
const event = { button: 0, preventDefault: () => { prevented = true; } };
assert.strictEqual(openTool(event, { href: "https://example.com/tool/qr-code-generator/" }, desktopWindow), popup);
assert.strictEqual(prevented, true);
assert.strictEqual(focused, true);

let fallbackUrl;
desktopWindow.open = () => null;
desktopWindow.location = { assign: (url) => { fallbackUrl = url; } };
openTool(event, { href: "https://example.com/tool/calendar/" }, desktopWindow);
assert.strictEqual(fallbackUrl, "https://example.com/tool/calendar/");

console.log("site tests passed");
