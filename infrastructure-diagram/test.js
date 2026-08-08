const assert = require("node:assert/strict");
const { parseNaturalLanguage, portLabel } = require("./app.js");

assert.equal(portLabel("443"), "HTTPS :443");
assert.equal(portLabel("3306"), "TCP :3306");

const diagram = parseNaturalLanguage(`InternetからALBへ443
ALBからWebサーバー2台
WebサーバーからDBへ3306
DBはRDS`);
assert.equal(diagram.nodes.length, 5);
assert.equal(diagram.edges.length, 5);
assert.equal(diagram.nodes.filter(node => node.type === "Web Server").length, 2);
assert.ok(diagram.edges.some(edge => edge.label === "HTTPS :443"));
assert.ok(diagram.edges.some(edge => edge.label === "TCP :3306"));
assert.ok(new Set(diagram.nodes.map(node => node.y)).size >= 3);

const arrows = parseNaturalLanguage("ユーザー\n↓\nCloudFront\n↓\nALB\n↓\nEC2 2台\n↓\nRDS");
assert.equal(arrows.nodes.length, 6);
assert.equal(arrows.edges.length, 6);
console.log("Infrastructure diagram tests passed");
