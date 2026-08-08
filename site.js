(function () {
  "use strict";

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

  function openTool(event, link, browserWindow) {
    if (!usesMiniWindow(browserWindow) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

    event.preventDefault();
    const slug = new URL(link.href).pathname.split("/").filter(Boolean).pop();
    const popup = browserWindow.open(link.href, `browserTool_${slug.replaceAll("-", "_")}`, popupFeatures(browserWindow));
    if (popup) popup.focus();
    else browserWindow.location.assign(link.href);
    return popup;
  }

  function initialize(documentObject, browserWindow) {
    documentObject.querySelectorAll(".tool-card").forEach((link) => {
      link.addEventListener("click", (event) => openTool(event, link, browserWindow));
    });
  }

  if (typeof module !== "undefined") module.exports = { openTool, popupFeatures, usesMiniWindow };
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initialize(document, window));
})();
