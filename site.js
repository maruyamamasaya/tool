(function () {
  "use strict";

  const POPUP_WIDTH = 600;
  const POPUP_HEIGHT = 750;
  const DESKTOP_MIN_WIDTH = 768;
  const FAVORITES_KEY = "browserToolsFavorites";
  const MAX_FAVORITES = 10;

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

  function loadFavorites(storage) {
    try {
      const value = JSON.parse(storage.getItem(FAVORITES_KEY) || "[]");
      return Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === "string"))] : [];
    } catch (_error) {
      return [];
    }
  }

  function toolId(link) {
    return new URL(link.href).pathname.replace(/\/+$/, "");
  }

  function initialize(documentObject, browserWindow) {
    const favoritesGrid = documentObject.getElementById("favorite-grid");
    const status = documentObject.getElementById("favorites-status");
    const categories = documentObject.getElementById("all-tool-categories");
    const links = [...categories.querySelectorAll(".tool-card")];
    let favorites = loadFavorites(browserWindow.localStorage);

    function saveFavorites() {
      try {
        browserWindow.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (_error) {
        status.textContent = "ブラウザの設定により、お気に入りを保存できませんでした。";
      }
    }

    function update() {
      favoritesGrid.replaceChildren();
      const linkById = new Map(links.map((link) => [toolId(link), link]));
      favorites = favorites.filter((id) => linkById.has(id));
      favorites.slice(0, MAX_FAVORITES).forEach((id) => {
        const source = linkById.get(id);
        const copy = source.cloneNode(true);
        copy.addEventListener("click", (event) => openTool(event, copy, browserWindow));
        favoritesGrid.append(copy);
      });
      status.textContent = favorites.length
        ? favorites.length > MAX_FAVORITES
          ? `${favorites.length}個を登録中。先頭の${MAX_FAVORITES}個を表示しています。`
          : `${favorites.length}個を登録中。星をもう一度押すと解除できます。`
        : "よく使うツールの星を押すと、ここに最大10個まで表示できます。";
      documentObject.querySelectorAll(".favorite-button").forEach((button) => {
        const selected = favorites.includes(button.dataset.toolId);
        button.setAttribute("aria-pressed", String(selected));
        button.setAttribute("aria-label", `${button.dataset.toolName}をお気に入り${selected ? "から解除" : "に追加"}`);
      });
    }

    links.forEach((link) => {
      link.addEventListener("click", (event) => openTool(event, link, browserWindow));
      const wrapper = documentObject.createElement("div");
      wrapper.className = "tool-card-wrap";
      link.before(wrapper);
      wrapper.append(link);
      const button = documentObject.createElement("button");
      const name = link.querySelector("h3").textContent;
      button.className = "favorite-button";
      button.type = "button";
      button.dataset.toolId = toolId(link);
      button.dataset.toolName = name;
      button.innerHTML = '<span aria-hidden="true">★</span>';
      button.addEventListener("click", () => {
        const id = button.dataset.toolId;
        if (favorites.includes(id)) favorites = favorites.filter((favorite) => favorite !== id);
        else favorites.push(id);
        update();
        saveFavorites();
      });
      wrapper.append(button);
    });

    update();
  }

  if (typeof module !== "undefined") module.exports = { loadFavorites, openTool, popupFeatures, toolId, usesMiniWindow };
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initialize(document, window));
})();
