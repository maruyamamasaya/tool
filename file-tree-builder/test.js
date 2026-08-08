"use strict";
const assert = require("node:assert/strict");
const { makeNode, sampleTree, formatTree, parseTreeText, validateImport, contains } = require("./app.js");

const tree = sampleTree();
assert.match(formatTree(tree, "tree"), /├── src\/\n│   ├── components\//);
assert.match(formatTree(tree, "ascii"), /\|-- src\//);
assert.match(formatTree(tree, "markdown"), /- `my-project\/`/);
assert.match(formatTree(tree, "simple"), /  \+ src/);
assert.match(formatTree(tree, "arrow"), /  → src/);
assert.match(formatTree(tree, "custom", { showEmoji: true, folderSymbol: "📁", fileSymbol: "📄", branchSymbol: "↳", indentWidth: 2, trailingSlash: true }), /  ↳ 📁 src\//);

const parsed = parseTreeText("src/\n├── components/\n│   ├── Header.tsx\n│   └── Footer.tsx\n└── app.ts");
assert.equal(parsed[0].name, "src"); assert.equal(parsed[0].children.length, 2); assert.equal(parsed[0].children[0].children[1].name, "Footer.tsx");
assert.equal(contains(parsed[0], parsed[0].children[0].id), true);
assert.throws(() => parseTreeText("\n")); assert.throws(() => validateImport({}));
const safe = validateImport([{ name: "<script>alert(1)</script>", type: "file", children: [] }]);
assert.equal(safe[0].name, "<script>alert(1)</script>");
console.log("File Tree Builder tests passed");
