const assert = require("assert");
const { loadFavorites, openTool, popupFeatures, toolId, usesMiniWindow } = require("./site.js");

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

assert.deepStrictEqual(loadFavorites({ getItem: () => '["/tool/a","/tool/b"]' }), ["/tool/a", "/tool/b"]);
assert.deepStrictEqual(loadFavorites({ getItem: () => "invalid" }), []);
assert.strictEqual(loadFavorites({ getItem: () => JSON.stringify(Array.from({ length: 12 }, (_, index) => String(index))) }).length, 12);
assert.strictEqual(toolId({ href: "https://example.com/tool/calendar/" }), "/tool/calendar");

const fs = require("fs");
const indexHtml = fs.readFileSync(require.resolve("./index.html"), "utf8");
const categoryNames = [
  "タイマー系",
  "タスク管理系",
  "カレンダー",
  "Linux操作",
  "ネットワーク関連",
  "Diff（差分チェッカー）",
  "テキスト加工",
  "テキスト生成",
  "データ分析",
  "ログ解析",
  "CSV",
  "JSON",
  "数値計算",
  "プログラム解析",
  "索引系",
  "その他・シミュレーションなど"
];
const categorySections = indexHtml.match(/<section[^>]+class="tool-category"/g) || [];
const toolLinks = [...indexHtml.matchAll(/<a class="tool-card" href="([^"]+)"/g)].map((match) => match[1]);
const categoryHtml = (id) => indexHtml.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];
assert.strictEqual(categorySections.length, categoryNames.length);
categoryNames.forEach((name) => assert.ok(indexHtml.includes(`>${name}</a>`), `${name} navigation link is missing`));
assert.strictEqual(toolLinks.length, 69);
assert.strictEqual(new Set(toolLinks).size, toolLinks.length);
assert.ok(categoryHtml("linux-tools").includes("./cron-reader/"));
assert.ok(categoryHtml("data-analysis").includes("./regex-tester/"));
assert.ok(categoryHtml("data-analysis").includes("./regex-builder/"));
assert.ok(categoryHtml("log-analysis").includes("./log-highlighter/"));
["raid-calculator", "sla-calculator", "bandwidth-calculator", "percentage-calculator"].forEach((tool) => {
  assert.ok(categoryHtml("numeric-tools").includes(`./${tool}/`), `${tool} is not in numeric tools`);
});
assert.ok(indexHtml.includes('id="favorite-grid"'));
assert.ok(indexHtml.includes('id="toggle-all-tools"'));

console.log("site tests passed");
