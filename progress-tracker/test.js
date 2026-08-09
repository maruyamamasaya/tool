const assert = require("node:assert/strict");
const { parseTasks, calculateOverall, evaluation, toMarkdown } = require("./app.js");
const tasks = parseTasks("- [ ] テスト 【進捗: 40%】\n  - [x] 完了\nメモ");
assert.deepEqual(tasks.map(({ name, depth, progress }) => ({ name, depth, progress })), [{ name: "テスト", depth: 0, progress: 40 }, { name: "完了", depth: 1, progress: 100 }, { name: "メモ", depth: 0, progress: 0 }]);
assert.equal(calculateOverall(tasks), 47);
assert.equal(evaluation(85).title, "ゴールは目前です");
assert.equal(toMarkdown(tasks), "- [ ] テスト 【進捗: 40%】\n  - [x] 完了 【進捗: 100%】\n- [ ] メモ 【進捗: 0%】");
assert.deepEqual(parseTasks(toMarkdown(tasks)).map((task) => task.progress), [40, 100, 0]);
console.log("All Progress Tracker tests passed.");
