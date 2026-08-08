(function () {
  "use strict";

  const tools = {
    "simple-calculator": "Simple Calculator",
    "percentage-calculator": "Percentage Calculator",
    "qr-code-generator": "QR Code Generator",
    "data-inspector": "Data Inspector",
    "byte-converter": "Byte Converter",
    "number-base-converter": "Number Base Converter",
    "base64-converter": "Base64 Converter",
    "json-structure-viewer": "JSON Structure Viewer",
    "json-formatter": "JSON Formatter",
    "sql-formatter": "SQL Formatter",
    "csv-viewer": "CSV ビューアー",
    "csv-statistics": "CSV Statistics",
    drawing: "Whiteboard",
    "timer-board": "Timer Board",
    "meeting-timer": "Meeting Timer",
    "bandwidth-calculator": "Bandwidth Calculator",
    "raid-calculator": "RAID Calculator",
    "diff-viewer": "Text Diff Viewer",
    "text-cleaner": "Text Cleaner",
    "line-sorter": "Line Sorter",
    "cidr-analyzer": "CIDR Analyzer",
    calendar: "Calendar",
    "business-day-calculator": "営業日カウンター",
    "checklist-builder": "Checklist Builder",
    "pomodoro-timer": "Pomodoro Timer",
    "color-palette": "Color Palette",
    "unix-time-converter": "Unix Time Converter",
    "uuid-generator": "UUID Generator",
    "user-agent-viewer": "User-Agent Viewer",
    "character-encoding-checker": "Character Encoding Checker",
    "hash-generator": "Hash Generator",
    "escape-tool": "Escape Tool",
    "regex-tester": "Regex Tester",
    "cron-reader": "Cron Reader",
    "sla-calculator": "SLA Calculator",
    "dummy-data-generator": "Dummy Data Generator",
    "sql-explainer": "SQL Explainer"
  };

  const POPUP_WIDTH = 600;
  const POPUP_HEIGHT = 750;
  const DESKTOP_MIN_WIDTH = 768;

  function usesMiniWindow(browserWindow) {
    const coarsePointer = typeof browserWindow.matchMedia === "function"
      && browserWindow.matchMedia("(pointer: coarse)").matches;
    return browserWindow.innerWidth >= DESKTOP_MIN_WIDTH && !coarsePointer;
  }

  function popupFeatures(browserWindow) {
    const width = Math.min(POPUP_WIDTH, browserWindow.screen.availWidth);
    const height = Math.min(POPUP_HEIGHT, browserWindow.screen.availHeight);
    const left = Math.max(0, Math.round(browserWindow.screenX + (browserWindow.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(browserWindow.screenY + (browserWindow.outerHeight - height) / 2));

    return `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
  }

  function openTool(url, windowName, browserWindow) {
    if (!usesMiniWindow(browserWindow)) {
      browserWindow.location.assign(url);
      return null;
    }

    const popup = browserWindow.open(url, windowName, popupFeatures(browserWindow));
    if (!popup) browserWindow.location.assign(url);
    else popup.focus();
    return popup;
  }

  function initialize(documentObject, browserWindow) {
    const slug = new URLSearchParams(browserWindow.location.search).get("tool");
    const title = tools[slug];
    if (!title) {
      documentObject.querySelector("#launcher-error").hidden = false;
      return;
    }

    const url = new URL(`./${slug}/`, browserWindow.location.href).href;
    documentObject.title = `${title} | Browser Tools`;
    documentObject.querySelector("#tool-title").textContent = title;
    documentObject.querySelector("#open-normal").href = url;
    documentObject.querySelector("#open-mini").hidden = !usesMiniWindow(browserWindow);
    documentObject.querySelector("#launcher-actions").hidden = false;
    documentObject.querySelector("#open-mini").addEventListener("click", function () {
      openTool(url, `browserTool_${slug.replaceAll("-", "_")}`, browserWindow);
    });
  }

  if (typeof module !== "undefined") module.exports = { tools, popupFeatures, openTool, usesMiniWindow };
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initialize(document, window));
})();
