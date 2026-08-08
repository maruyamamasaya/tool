'use strict';
const assert = require('assert');
const { parseSQL, explainSQL, describeCondition } = require('./app.js');

const joined = parseSQL("SELECT u.name, o.amount FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE o.status = 'paid' AND o.amount >= 10000 ORDER BY o.amount DESC LIMIT 10;");
assert.strictEqual(joined.from.base.name, 'users');
assert.strictEqual(joined.from.joins[0].type, 'INNER');
assert.deepStrictEqual(joined.where, ["o.status = 'paid'", 'o.amount >= 10000']);
const joinedExplanation = explainSQL(joined);
assert.match(joinedExplanation.summary, /users と orders を結合/);
assert.match(joinedExplanation.summary, /最大10件/);
assert.strictEqual(describeCondition('age >= 20000', {}), 'age が 20,000以上');
assert.strictEqual(describeCondition("name LIKE 'A%'", {}), 'name が 「A%」 のパターンに一致');

const aggregate = explainSQL(parseSQL('SELECT department, COUNT(*) AS user_count, AVG(salary) AS avg_salary FROM employees WHERE active = true GROUP BY department HAVING COUNT(*) >= 5 ORDER BY avg_salary DESC;'));
assert.match(aggregate.summary, /departmentごとに集計/);
assert.ok(aggregate.sections.find(s => s.title === '集計後の条件').items[0].includes('件数'));
assert.ok(aggregate.sections.find(s => s.title === '並び順').items[0].includes('平均salary'));
assert.throws(() => parseSQL('DELETE FROM users'), /SELECT文/);
assert.throws(() => parseSQL(''), /入力/);
console.log('SQL Explainer tests passed');
