const assert = require("node:assert/strict");
const { escapeText, restoreText, visualizeText } = require("./app.js");

assert.equal(escapeText('Hello\nWorld\t"ok"\\end\r\0'), 'Hello\\nWorld\\t\\"ok\\"\\\\end\\r\\0');
assert.deepEqual(restoreText('Hello\\nWorld\\t123'), { text: "Hello\nWorld\t123", invalidCount: 0 });
assert.deepEqual(restoreText('Hello\\xZZ\\'), { text: "Hello\\xZZ\\", invalidCount: 2 });
assert.equal(restoreText('\\\\n').text, "\\n");
assert.equal(visualizeText("Hello World\nABC\tDEF\n　\0"), "Hello·World↵\nABC→DEF↵\n□␀");

console.log("All Escape Tool tests passed.");
