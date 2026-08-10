const assert = require("node:assert/strict");
const { achievement, emptySet, generateMarkdown, normalizeBackup, parseMarkdown, splitValueUnit } = require("./app.js");

assert.equal(achievement("65", "80"), 81);
assert.equal(achievement("120", "100"), 120);
assert.equal(achievement("", "100"), null);
assert.equal(achievement("5", "0"), null);
assert.deepEqual(splitValueUnit("240問"), { value: "240", unit: "問" });

const source = emptySet({ theme: "応用情報技術者試験", kgi: { goal: "試験に合格する", deadline: "2026/10/XX", memo: "集中する" }, kpis: [{ id: "one", name: "過去問正答率", current: "65", target: "80", unit: "%", deadline: "2026/09/30", memo: "午前中心" }] });
const markdown = generateMarkdown(source);
assert.match(markdown, /- 達成率：81%/);
assert.equal((markdown.match(/達成率/g) || []).length, 1);
const restored = parseMarkdown(markdown);
assert.equal(restored.theme, source.theme);
assert.deepEqual(restored.kgi, source.kgi);
assert.deepEqual(Object.fromEntries(["name", "current", "target", "unit", "deadline", "memo"].map((key) => [key, restored.kpis[0][key]])), Object.fromEntries(["name", "current", "target", "unit", "deadline", "memo"].map((key) => [key, source.kpis[0][key]])));
assert.equal(generateMarkdown(restored), markdown);
assert.equal((generateMarkdown(parseMarkdown(`${markdown}\n- 達成率：999%\n`)).match(/達成率/g) || []).length, 1);
assert.equal(normalizeBackup({ sets: [source] })[0].theme, source.theme);
assert.throws(() => normalizeBackup({ sets: [] }));
console.log("All KGI / KPI Builder tests passed.");
