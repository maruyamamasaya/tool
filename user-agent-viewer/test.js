"use strict";

const assert = require("assert");
const { detectBrowser, detectOS, detectDevice, buildReport } = require("./app.js");

assert.deepStrictEqual(detectBrowser("Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36"), { name: "Google Chrome", version: "126.0.0.0" });
assert.deepStrictEqual(detectBrowser("Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"), { name: "Microsoft Edge", version: "126.0.0.0" });
assert.deepStrictEqual(detectBrowser("Mozilla/5.0 Version/17.5 Mobile/15E148 Safari/604.1"), { name: "Safari", version: "17.5" });
assert.strictEqual(detectOS("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Win32"), "Windows 10 / 11");
assert.strictEqual(detectOS("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)", "iPhone"), "iOS 17.5");
assert.strictEqual(detectDevice("Mozilla/5.0 (Linux; Android 14; Tablet)", 5, "Linux"), "Tablet");
assert.strictEqual(detectDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5)", 5, "iPhone"), "Mobile");
assert.strictEqual(detectDevice("Mozilla/5.0 (X11; Linux x86_64)", 0, "Linux"), "Desktop");
assert.ok(buildReport({ browser: "Chrome", os: "Linux", device: "Desktop", userAgent: "UA", screen: "1", viewport: "2", pixelRatio: "1", language: "ja", timezone: "UTC", cookie: "有効", online: "Online", cpu: "4 コア", memory: "取得不可", touch: "非対応" }).includes("User-Agent: UA"));

console.log("User-Agent Viewer tests passed");
