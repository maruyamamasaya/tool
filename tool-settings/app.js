(function () {
  "use strict";

  const STORAGE_KEY = "browserToolsVisibleTools";
  const FREQUENT_TOOL_SLUGS = [
    "calendar",
    "checklist-builder",
    "clipboard-formatter",
    "csv-viewer",
    "json-formatter",
    "local-memo",
    "number-calculator",
    "percentage-calculator",
    "qr-code-generator",
    "string-replacer",
    "text-cleaner",
    "time-calculator"
  ];

  function normalizeSelection(value, validIds) {
    return Array.isArray(value) ? [...new Set(value.filter((id) => validIds.includes(id)))] : [...validIds];
  }

  function toolSlug(id) {
    return id.split("/").filter(Boolean).pop() || "";
  }

  function frequentSelection(toolIds) {
    return toolIds.filter((id) => FREQUENT_TOOL_SLUGS.includes(toolSlug(id)));
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { frequentSelection, normalizeSelection, toolSlug };
    return;
  }

  const container = document.getElementById("tool-settings");
  const status = document.getElementById("selection-status");
  const search = document.getElementById("tool-search");
  const loadError = document.getElementById("load-error");
  let tools = [];

  function readSelection(toolIds) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? [...toolIds] : normalizeSelection(JSON.parse(stored), toolIds);
    } catch (_error) {
      return [...toolIds];
    }
  }

  function selectedIds() {
    return [...container.querySelectorAll("input[type=checkbox]:checked")].map((input) => input.value);
  }

  function saveSelection() {
    const selected = selectedIds();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)); } catch (_error) { /* Keep the page selection usable. */ }
    status.textContent = `${tools.length}個中${selected.length}個を表示します。変更は自動保存されました。`;
  }

  function applySelection(ids) {
    const selected = new Set(ids);
    container.querySelectorAll("input[type=checkbox]").forEach((input) => { input.checked = selected.has(input.value); });
    saveSelection();
  }

  function render(categories) {
    tools = categories.flatMap((category) => category.tools);
    const visible = new Set(readSelection(tools.map((tool) => tool.id)));
    categories.forEach((category) => {
      const section = document.createElement("section");
      section.className = "category-settings";
      const heading = document.createElement("h2");
      heading.textContent = category.name;
      section.append(heading);
      const options = document.createElement("div");
      options.className = "tool-options";
      category.tools.forEach((tool) => {
        const label = document.createElement("label");
        label.className = "tool-option";
        label.dataset.searchText = `${tool.name} ${tool.description}`.toLocaleLowerCase("ja");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tool.id;
        checkbox.checked = visible.has(tool.id);
        checkbox.addEventListener("change", saveSelection);
        const copy = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = tool.name;
        const description = document.createElement("small");
        description.textContent = tool.description;
        copy.append(name, description);
        label.append(checkbox, copy);
        options.append(label);
      });
      section.append(options);
      container.append(section);
    });
    status.textContent = `${tools.length}個中${visible.size}個を表示します。`;
  }

  function parseCategories(html, baseUrl) {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    return [...parsed.querySelectorAll(".tool-category")].map((section) => ({
      name: section.querySelector(":scope > h3").textContent,
      tools: [...section.querySelectorAll(".tool-card")].map((link) => ({
        id: new URL(link.getAttribute("href"), baseUrl).pathname.replace(/\/+$/, ""),
        name: link.querySelector("h3").textContent,
        description: link.querySelector("p").textContent
      }))
    }));
  }

  document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
    const ids = tools.map((tool) => tool.id);
    applySelection(button.dataset.preset === "all" ? ids : button.dataset.preset === "frequent" ? frequentSelection(ids) : []);
  }));

  search.addEventListener("input", () => {
    const query = search.value.trim().toLocaleLowerCase("ja");
    container.querySelectorAll(".tool-option").forEach((option) => { option.hidden = Boolean(query) && !option.dataset.searchText.includes(query); });
    container.querySelectorAll(".category-settings").forEach((section) => {
      section.hidden = ![...section.querySelectorAll(".tool-option")].some((option) => !option.hidden);
    });
  });

  fetch("../index.html")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load tool index");
      return response.text();
    })
    .then((html) => render(parseCategories(html, new URL("../", location.href))))
    .catch(() => {
      status.textContent = "ツール一覧を読み込めませんでした。";
      loadError.hidden = false;
    });
})();
