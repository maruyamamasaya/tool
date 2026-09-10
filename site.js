(function () {
  "use strict";

  const POPUP_WIDTH = 600;
  const WIDE_POPUP_WIDTH = 900;
  const POPUP_HEIGHT = 750;
  const DESKTOP_MIN_WIDTH = 768;
  const FAVORITES_KEY = "browserToolsFavorites";
  const VISIBLE_CATEGORIES_KEY = "browserToolsVisibleCategories";
  const VISIBLE_TOOLS_KEY = "browserToolsVisibleTools";
  const VIEW_MODE_KEY = "browserToolsViewMode";
  const MAX_FAVORITES = 10;

  function usesMiniWindow(browserWindow) {
    const coarsePointer = typeof browserWindow.matchMedia === "function"
      && browserWindow.matchMedia("(pointer: coarse)").matches;
    return browserWindow.innerWidth >= DESKTOP_MIN_WIDTH && !coarsePointer;
  }

  function popupFeatures(browserWindow, requestedWidth = POPUP_WIDTH) {
    const width = Math.min(requestedWidth, browserWindow.screen.availWidth);
    const height = Math.min(POPUP_HEIGHT, browserWindow.screen.availHeight);
    const left = Math.max(0, Math.round(browserWindow.screenX + (browserWindow.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(browserWindow.screenY + (browserWindow.outerHeight - height) / 2));
    return `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
  }

  function openTool(event, link, browserWindow) {
    if (!usesMiniWindow(browserWindow) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

    event.preventDefault();
    const slug = new URL(link.href).pathname.split("/").filter(Boolean).pop();
    const popupWidth = slug === "local-memo" ? WIDE_POPUP_WIDTH : POPUP_WIDTH;
    const popup = browserWindow.open(link.href, `browserTool_${slug.replaceAll("-", "_")}`, popupFeatures(browserWindow, popupWidth));
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

  function loadVisibleCategories(storage, categoryIds) {
    try {
      const stored = storage.getItem(VISIBLE_CATEGORIES_KEY);
      if (stored === null) return [...categoryIds];
      const value = JSON.parse(stored);
      return Array.isArray(value) ? [...new Set(value.filter((id) => categoryIds.includes(id)))] : [...categoryIds];
    } catch (_error) {
      return [...categoryIds];
    }
  }

  function loadVisibleTools(storage, toolIds) {
    try {
      const stored = storage.getItem(VISIBLE_TOOLS_KEY);
      if (stored === null) return [...toolIds];
      const value = JSON.parse(stored);
      return Array.isArray(value) ? [...new Set(value.filter((id) => toolIds.includes(id)))] : [...toolIds];
    } catch (_error) {
      return [...toolIds];
    }
  }

  function loadViewMode(storage) {
    try {
      return storage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "card";
    } catch (_error) {
      return "card";
    }
  }

  function toolId(link) {
    return new URL(link.href).pathname.replace(/\/+$/, "");
  }

  function initialize(documentObject, browserWindow) {
    const favoritesGrid = documentObject.getElementById("favorite-grid");
    const status = documentObject.getElementById("favorites-status");
    const categories = documentObject.getElementById("all-tool-categories");
    const categorySections = [...categories.querySelectorAll(".tool-category")];
    const categoryIds = categorySections.map((section) => section.id);
    const categoryTabs = documentObject.getElementById("category-tabs");
    const categoryEmpty = documentObject.getElementById("category-empty");
    const categoryCheckboxes = [...documentObject.querySelectorAll(".category-visibility input[type=checkbox]")];
    const links = [...categories.querySelectorAll(".tool-card")];
    const toolIds = links.map(toolId);
    let favorites = loadFavorites(browserWindow.localStorage);
    let visibleCategories = loadVisibleCategories(browserWindow.localStorage, categoryIds);
    const visibleTools = loadVisibleTools(browserWindow.localStorage, toolIds);
    const cardViewButton = documentObject.getElementById("card-view-button");
    const listViewButton = documentObject.getElementById("list-view-button");
    let viewMode = loadViewMode(browserWindow.localStorage);
    let activeCategory = visibleCategories.includes(browserWindow.location.hash.slice(1)) ? browserWindow.location.hash.slice(1) : "all";

    function applyViewMode(mode) {
      viewMode = mode;
      documentObject.body.dataset.view = mode;
      cardViewButton.setAttribute("aria-pressed", String(mode === "card"));
      listViewButton.setAttribute("aria-pressed", String(mode === "list"));
      try {
        browserWindow.localStorage.setItem(VIEW_MODE_KEY, mode);
      } catch (_error) {
        // The selected view still works for this page view when storage is unavailable.
      }
    }

    cardViewButton.addEventListener("click", () => applyViewMode("card"));
    listViewButton.addEventListener("click", () => applyViewMode("list"));
    applyViewMode(viewMode);

    function saveFavorites() {
      try {
        browserWindow.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (_error) {
        status.textContent = "ブラウザの設定により、お気に入りを保存できませんでした。";
      }
    }

    function saveVisibleCategories() {
      try {
        browserWindow.localStorage.setItem(VISIBLE_CATEGORIES_KEY, JSON.stringify(visibleCategories));
      } catch (_error) {
        // The current selection still works for this page view when storage is unavailable.
      }
    }

    function renderCategories() {
      const availableCategoryIds = categorySections
        .filter((section) => visibleCategories.includes(section.id)
          && [...section.querySelectorAll(".tool-card")].some((link) => visibleTools.includes(toolId(link))))
        .map((section) => section.id);
      if (activeCategory !== "all" && !availableCategoryIds.includes(activeCategory)) activeCategory = "all";
      categoryTabs.replaceChildren();
      const tabs = [{ id: "all", name: "すべて" }, ...categorySections
        .filter((section) => availableCategoryIds.includes(section.id))
        .map((section) => ({ id: section.id, name: section.querySelector("h3").textContent }))];

      tabs.forEach(({ id, name }) => {
        const button = documentObject.createElement("button");
        const selected = activeCategory === id;
        button.type = "button";
        button.className = "category-tab";
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        button.textContent = name;
        button.addEventListener("click", () => {
          const selectedIndex = tabs.findIndex((tab) => tab.id === id);
          activeCategory = id;
          renderCategories();
          browserWindow.requestAnimationFrame(() => categoryTabs.children[selectedIndex].focus());
        });
        button.addEventListener("keydown", (event) => {
          const currentIndex = tabs.findIndex((tab) => tab.id === id);
          const nextIndex = event.key === "Home" ? 0
            : event.key === "End" ? tabs.length - 1
              : event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length
                : event.key === "ArrowLeft" ? (currentIndex - 1 + tabs.length) % tabs.length
                  : -1;
          if (nextIndex < 0) return;
          event.preventDefault();
          activeCategory = tabs[nextIndex].id;
          renderCategories();
          categoryTabs.children[nextIndex].focus();
        });
        categoryTabs.append(button);
      });

      categorySections.forEach((section) => {
        section.hidden = !availableCategoryIds.includes(section.id) || (activeCategory !== "all" && activeCategory !== section.id);
      });
      categoryEmpty.hidden = availableCategoryIds.length > 0;
    }

    function updateVisibleCategories() {
      visibleCategories = categoryCheckboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
      saveVisibleCategories();
      renderCategories();
    }

    categoryCheckboxes.forEach((checkbox) => {
      checkbox.checked = visibleCategories.includes(checkbox.value);
      checkbox.addEventListener("change", updateVisibleCategories);
    });
    documentObject.getElementById("show-all-categories").addEventListener("click", () => {
      categoryCheckboxes.forEach((checkbox) => { checkbox.checked = true; });
      updateVisibleCategories();
    });
    documentObject.getElementById("hide-all-categories").addEventListener("click", () => {
      categoryCheckboxes.forEach((checkbox) => { checkbox.checked = false; });
      updateVisibleCategories();
    });

    function update() {
      favoritesGrid.replaceChildren();
      const linkById = new Map(links.map((link) => [toolId(link), link]));
      favorites = favorites.filter((id) => linkById.has(id));
      favorites.filter((id) => visibleTools.includes(id)).slice(0, MAX_FAVORITES).forEach((id) => {
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
      wrapper.hidden = !visibleTools.includes(toolId(link));
    });

    renderCategories();
    update();
  }

  if (typeof module !== "undefined") module.exports = { loadFavorites, loadViewMode, loadVisibleCategories, loadVisibleTools, openTool, popupFeatures, toolId, usesMiniWindow };
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initialize(document, window));
})();
