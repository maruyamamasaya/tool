(function (root) {
  "use strict";

  function detectBrowser(ua) {
    var rules = [
      [/(?:EdgiOS|EdgA|Edg)\/([\d.]+)/, "Microsoft Edge"],
      [/(?:OPiOS|OPR)\/([\d.]+)/, "Opera"],
      [/SamsungBrowser\/([\d.]+)/, "Samsung Internet"],
      [/CriOS\/([\d.]+)/, "Google Chrome"],
      [/FxiOS\/([\d.]+)/, "Mozilla Firefox"],
      [/Chrome\/([\d.]+)/, "Google Chrome"],
      [/Firefox\/([\d.]+)/, "Mozilla Firefox"],
      [/Version\/([\d.]+).*Safari\//, "Safari"]
    ];
    for (var i = 0; i < rules.length; i += 1) {
      var match = ua.match(rules[i][0]);
      if (match) return { name: rules[i][1], version: match[1] };
    }
    return { name: "不明", version: "—" };
  }

  function detectOS(ua, platform) {
    var match;
    if ((match = ua.match(/Windows NT ([\d.]+)/))) {
      var windows = { "10.0": "Windows 10 / 11", "6.3": "Windows 8.1", "6.2": "Windows 8", "6.1": "Windows 7" };
      return windows[match[1]] || "Windows";
    }
    if ((match = ua.match(/(?:iPhone )?OS ([\d_]+)/))) return "iOS " + match[1].replace(/_/g, ".");
    if ((match = ua.match(/Android ([\d.]+)/))) return "Android " + match[1];
    if ((match = ua.match(/Mac OS X ([\d_]+)/))) return "macOS " + match[1].replace(/_/g, ".");
    if (/CrOS/.test(ua)) return "ChromeOS";
    if (/Linux/.test(ua)) return "Linux";
    return platform || "不明";
  }

  function detectDevice(ua, maxTouchPoints, platform) {
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (platform === "MacIntel" && maxTouchPoints > 1)) return "Tablet";
    if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "Mobile";
    return "Desktop";
  }

  function buildReport(info) {
    return [
      "User-Agent Viewer", "-----------------",
      "ブラウザ: " + info.browser,
      "OS: " + info.os,
      "デバイス種別: " + info.device,
      "User-Agent: " + info.userAgent,
      "画面解像度: " + info.screen,
      "Viewport: " + info.viewport,
      "Device Pixel Ratio: " + info.pixelRatio,
      "言語: " + info.language,
      "タイムゾーン: " + info.timezone,
      "Cookie: " + info.cookie,
      "接続状態: " + info.online,
      "CPU論理コア数: " + info.cpu,
      "メモリ容量: " + info.memory,
      "タッチ対応: " + info.touch
    ].join("\n");
  }

  var api = { detectBrowser: detectBrowser, detectOS: detectOS, detectDevice: detectDevice, buildReport: buildReport };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!root.document) return;

  var currentInfo;
  var labels = [
    ["browser", "ブラウザ"], ["os", "OS"], ["device", "デバイス種別"],
    ["screen", "画面解像度"], ["viewport", "Viewport"], ["pixelRatio", "Device Pixel Ratio"],
    ["language", "言語"], ["timezone", "タイムゾーン"], ["cookie", "Cookie"],
    ["online", "接続状態"], ["cpu", "CPU論理コア数"], ["memory", "メモリ容量"], ["touch", "タッチ対応"]
  ];

  function collectInfo() {
    var ua = navigator.userAgent || "不明";
    var browser = detectBrowser(ua);
    var platform = navigator.userAgentData && navigator.userAgentData.platform ? navigator.userAgentData.platform : navigator.platform;
    var touchPoints = navigator.maxTouchPoints || 0;
    return {
      browser: browser.name + (browser.version === "—" ? "" : " " + browser.version),
      os: detectOS(ua, platform), device: detectDevice(ua, touchPoints, platform), userAgent: ua,
      screen: screen.width + " × " + screen.height + " px",
      viewport: root.innerWidth + " × " + root.innerHeight + " px",
      pixelRatio: String(root.devicePixelRatio || 1), language: navigator.language || "不明",
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || "不明"),
      cookie: navigator.cookieEnabled ? "有効" : "無効", online: navigator.onLine ? "Online" : "Offline",
      cpu: navigator.hardwareConcurrency ? navigator.hardwareConcurrency + " コア" : "取得不可",
      memory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "取得不可",
      touch: (touchPoints > 0 || "ontouchstart" in root) ? "対応 (最大 " + Math.max(touchPoints, 1) + " 点)" : "非対応"
    };
  }

  function render() {
    currentInfo = collectInfo();
    document.getElementById("deviceType").textContent = currentInfo.device;
    document.getElementById("browserSummary").textContent = currentInfo.browser;
    document.getElementById("osSummary").textContent = currentInfo.os;
    document.getElementById("userAgent").textContent = currentInfo.userAgent;
    var status = document.getElementById("onlineStatus");
    status.innerHTML = "<i></i>" + currentInfo.online;
    status.classList.toggle("offline", currentInfo.online === "Offline");
    document.getElementById("infoGrid").innerHTML = labels.map(function (item) {
      var stateClass = item[0] === "cookie" || item[0] === "online" ? ' class="value-state' + ((currentInfo[item[0]] === "無効" || currentInfo[item[0]] === "Offline") ? " is-off" : "") + '"' : "";
      return "<div class=\"info-item\"><dt>" + item[1] + "</dt><dd" + stateClass + ">" + currentInfo[item[0]] + "</dd></div>";
    }).join("");
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea"); area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
    document.body.appendChild(area); area.select(); var copied = document.execCommand("copy"); area.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }

  function copy(text, message) {
    var action = navigator.clipboard && root.isSecureContext ? navigator.clipboard.writeText(text) : fallbackCopy(text);
    action.then(function () { document.getElementById("copyStatus").textContent = "✓ " + message; }).catch(function () { document.getElementById("copyStatus").textContent = "コピーできませんでした。手動で選択してください。"; });
  }

  document.getElementById("copyUaButton").addEventListener("click", function () { copy(currentInfo.userAgent, "User-Agentをコピーしました"); });
  document.getElementById("copyAllButton").addEventListener("click", function () { copy(buildReport(currentInfo), "すべての情報をコピーしました"); });
  document.getElementById("refreshButton").addEventListener("click", render);
  root.addEventListener("online", render); root.addEventListener("offline", render);
  var resizeTimer;
  root.addEventListener("resize", function () { root.clearTimeout(resizeTimer); resizeTimer = root.setTimeout(render, 120); });
  render();
}(typeof globalThis !== "undefined" ? globalThis : this));
