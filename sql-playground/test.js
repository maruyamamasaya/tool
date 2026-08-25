"use strict";
const assert = require("assert");
const fs = require("fs");
const { DEFAULT_TABLES, executeSQL, parseSQL, parseValue, removeTable } = require("./app.js");
assert.strictEqual(parseValue("true"), true);
assert.strictEqual(parseValue("12.5"), 12.5);
assert.deepStrictEqual(parseSQL("SELECT * FROM users LIMIT 2").limit, 2);
assert.deepStrictEqual(executeSQL("SELECT id, name FROM users WHERE active = true ORDER BY id DESC LIMIT 2", DEFAULT_TABLES), { columns: ["id", "name"], rows: [[4, "田中 健太"], [2, "鈴木 一郎"]] });
assert.deepStrictEqual(executeSQL("SELECT COUNT(*) AS total FROM orders WHERE status = 'paid'", DEFAULT_TABLES), { columns: ["total"], rows: [[2]] });
assert.deepStrictEqual(executeSQL("SELECT\n  orders.id,\n  users.name\nFROM orders\nJOIN users\n  ON orders.user_id = users.id\nORDER BY orders.id", DEFAULT_TABLES), { columns: ["id", "name"], rows: [[101, "佐藤 花子"], [102, "鈴木 一郎"], [103, "佐藤 花子"]] });
assert.deepStrictEqual(executeSQL("SELECT * FROM orders INNER JOIN users ON orders.user_id = users.id LIMIT 1", DEFAULT_TABLES), { columns: ["id", "user_id", "amount", "status", "id", "name", "role", "active"], rows: [[101, 1, 12800, "paid", 1, "佐藤 花子", "admin", true]] });
assert.deepStrictEqual(executeSQL("SELECT o.id, u.name FROM orders AS o JOIN users u ON o.user_id = u.id WHERE u.active = true ORDER BY o.id DESC LIMIT 1", DEFAULT_TABLES), { columns: ["id", "name"], rows: [[103, "佐藤 花子"]] });
assert.throws(() => executeSQL("SELECT id FROM orders JOIN users ON orders.user_id = users.id", DEFAULT_TABLES), /曖昧/);
const reservationTables = {
  reservations: { columns: ["id", "user_id", "date"], rows: [[1, 10, "2026-08-24"], [2, 20, "2026-08-25"], [3, 99, "2026-08-26"]] },
  users: { columns: ["id", "name"], rows: [[10, "佐藤"], [20, "鈴木"]] }
};
assert.deepStrictEqual(executeSQL("SELECT *\nFROM reservations\nJOIN users\nON reservations.user_id = users.id;", reservationTables), { columns: ["id", "user_id", "date", "id", "name"], rows: [[1, 10, "2026-08-24", 10, "佐藤"], [2, 20, "2026-08-25", 20, "鈴木"]] });
const tables = JSON.parse(JSON.stringify(DEFAULT_TABLES));
assert.deepStrictEqual(executeSQL("CREATE TABLE tasks (id INTEGER, title TEXT); INSERT INTO tasks (id, title) VALUES (1, '確認'), (2, 'O''Brien'); SELECT * FROM tasks ORDER BY id", tables), { columns: ["id", "title"], rows: [[1, "確認"], [2, "O'Brien"]] });
assert.strictEqual(tables.tasks.rows.length, 2);
assert.deepStrictEqual(executeSQL("DELETE FROM tasks WHERE id = 1; SELECT COUNT(*) AS total FROM tasks", tables), { columns: ["total"], rows: [[1]] });
const snapshot = JSON.stringify(tables);
assert.throws(() => executeSQL("INSERT INTO tasks (missing) VALUES (1)", tables), /列名/);
assert.throws(() => executeSQL("DELETE FROM tasks WHERE missing = 1", tables), /見つかり/);
assert.strictEqual(JSON.stringify(tables), snapshot, "エラー時は途中の変更も反映しない");
assert.throws(() => executeSQL("SELECT * FROM missing", DEFAULT_TABLES), /見つかり/);
const lastTable = { only: { columns: ["id"], rows: [[1]] } };
assert.strictEqual(removeTable(lastTable, "only"), null);
assert.deepStrictEqual(lastTable, {}, "最後のテーブルも削除できる");
assert.match(fs.readFileSync(require.resolve("./styles.css"), "utf8"), /\[hidden\]\{display:none!important\}/);
console.log("SQL Playground tests passed");
