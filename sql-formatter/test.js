const assert = require("node:assert/strict");
const { formatSql, tokenize } = require("./app.js");

const sample = formatSql("SELECT u.id,u.name,o.amount FROM users u INNER JOIN orders o ON u.id=o.user_id WHERE o.status='paid' AND o.amount>=10000 ORDER BY o.amount DESC LIMIT 10;");
assert.match(sample, /^SELECT\n {4}u\.id,\n {4}u\.name,/);
assert.match(sample, /INNER JOIN\n {4}orders o\n {4}ON u\.id = o\.user_id/);
assert.match(sample, /WHERE\n {4}o\.status = 'paid'\n {4}AND o\.amount >= 10000/);
assert.match(sample, /ORDER BY\n {4}o\.amount DESC\nLIMIT\n {4}10;$/);

assert.equal(formatSql("select name from users where note='FROM and SELECT';", "lower").includes("'FROM and SELECT'"), true);
assert.match(formatSql("SELECT * FROM users; SELECT * FROM orders;"), /users;\n\nSELECT/);
assert.match(formatSql("SELECT CASE WHEN active=true THEN 'yes' ELSE 'no' END AS state FROM users;"), /CASE\n {8}WHEN active = TRUE/);

const commented = formatSql("SELECT id -- keep SELECT here\nFROM users /* keep WHERE here */ WHERE id=1;");
assert.ok(commented.includes("-- keep SELECT here"));
assert.ok(commented.includes("/* keep WHERE here */"));

assert.equal(tokenize("SELECT 'unfinished").valid, false);
formatSql("SELECT (id FROM users;");
assert.equal(formatSql.lastValid, false);

console.log("All SQL Formatter tests passed.");
