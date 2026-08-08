(function (root) {
  "use strict";

  const MAX_DEPTH = 10;
  const ARRAY_PREVIEW_LIMIT = 10;
  const TABLE_ROW_LIMIT = 1000;

  function valueType(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value === "object" ? "object" : typeof value;
  }

  function displayValue(value, type) {
    if (type === "string") return JSON.stringify(value);
    if (type === "null") return "null";
    return String(value);
  }

  function flattenJson(value, limit) {
    const rows = [];
    const maximum = typeof limit === "number" ? limit : TABLE_ROW_LIMIT;
    let truncated = false;

    function visit(key, entry, path, depth) {
      if (rows.length >= maximum) { truncated = true; return; }
      const type = valueType(entry);
      const isContainer = type === "object" || type === "array";
      const count = isContainer ? (type === "array" ? entry.length : Object.keys(entry).length) : null;
      rows.push({ key: key, path: path, type: type, value: isContainer ? (count + (type === "array" ? " items" : " properties")) : displayValue(entry, type) });
      if (!isContainer || depth >= MAX_DEPTH) return;
      const entries = type === "array" ? entry.map(function (item, index) { return [String(index), item]; }) : Object.entries(entry);
      entries.forEach(function (child) {
        if (rows.length >= maximum) { truncated = true; return; }
        const childPath = type === "array" ? path + "[" + child[0] + "]" : path + "." + child[0];
        visit(child[0], child[1], childPath, depth + 1);
      });
    }

    visit("root", value, "$", 0);
    return { rows: rows, truncated: truncated };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { flattenJson: flattenJson, valueType: valueType };
  if (!root.document) return;

  const input = document.getElementById("jsonInput");
  const tree = document.getElementById("tree");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");
  const errorDetail = document.getElementById("errorDetail");
  const inputStats = document.getElementById("inputStats");
  const expandButton = document.getElementById("expandButton");
  const collapseButton = document.getElementById("collapseButton");
  const clearButton = document.getElementById("clearButton");
  const tableView = document.getElementById("tableView");
  const tableBody = document.getElementById("tableBody");
  const tableNotice = document.getElementById("tableNotice");
  const treeViewButton = document.getElementById("treeViewButton");
  const tableViewButton = document.getElementById("tableViewButton");
  const treeActions = document.getElementById("treeActions");
  let currentView = "tree";
  let parsedData;

  function appendText(parent, className, text) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    parent.appendChild(span);
    return span;
  }

  function makeNotice(text) {
    const item = document.createElement("li");
    item.className = "truncated";
    item.textContent = text;
    return item;
  }

  function makeNode(key, value, depth) {
    const type = valueType(value);
    const isContainer = type === "object" || type === "array";
    const item = document.createElement("li");
    item.setAttribute("role", "treeitem");
    const row = document.createElement("div");
    row.className = "node-row";

    let toggle = null;
    if (isContainer) {
      toggle = document.createElement("button");
      toggle.className = "toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", key + " を閉じる");
      row.appendChild(toggle);
    } else {
      const spacer = document.createElement("span");
      spacer.className = "leaf-space";
      spacer.setAttribute("aria-hidden", "true");
      row.appendChild(spacer);
    }

    appendText(row, "key", key);
    if (!isContainer) {
      appendText(row, "separator", ":");
      appendText(row, "value type-" + type, displayValue(value, type));
    }
    appendText(row, "type-badge type-" + type, type[0].toUpperCase() + type.slice(1));
    if (isContainer) {
      const count = type === "array" ? value.length : Object.keys(value).length;
      appendText(row, "count", type === "array" ? "[" + count + "]" : "{" + count + "}");
    }
    item.appendChild(row);

    if (isContainer) {
      const children = document.createElement("ul");
      children.setAttribute("role", "group");
      if (depth >= MAX_DEPTH) {
        children.appendChild(makeNotice("10階層以降は省略"));
      } else {
        const entries = type === "array"
          ? value.slice(0, ARRAY_PREVIEW_LIMIT).map((entry, index) => ["[" + index + "]", entry])
          : Object.entries(value);
        entries.forEach(function (entry) {
          children.appendChild(makeNode(entry[0], entry[1], depth + 1));
        });
        if (type === "array" && value.length > ARRAY_PREVIEW_LIMIT) {
          children.appendChild(makeNotice("他 " + (value.length - ARRAY_PREVIEW_LIMIT) + " 件を省略"));
        }
        if (entries.length === 0) children.appendChild(makeNotice(type === "array" ? "空の配列" : "空のオブジェクト"));
      }
      item.appendChild(children);
      toggle.addEventListener("click", function () {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        toggle.setAttribute("aria-label", key + (expanded ? " を開く" : " を閉じる"));
        children.hidden = expanded;
      });
    }
    return item;
  }

  function setAll(expanded) {
    tree.querySelectorAll(".toggle").forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", String(expanded));
      const children = toggle.closest("li").querySelector(":scope > ul");
      if (children) children.hidden = !expanded;
    });
  }

  function renderTable(data) {
    const result = flattenJson(data);
    const fragment = document.createDocumentFragment();
    result.rows.forEach(function (entry) {
      const row = document.createElement("tr");
      [["table-path", entry.path], ["table-key", entry.key]].forEach(function (cellData) {
        const cell = document.createElement("td"); cell.className = cellData[0]; cell.textContent = cellData[1]; row.appendChild(cell);
      });
      const typeCell = document.createElement("td");
      appendText(typeCell, "type-badge type-" + entry.type, entry.type[0].toUpperCase() + entry.type.slice(1));
      typeCell.className = "table-type"; row.appendChild(typeCell);
      const valueCell = document.createElement("td"); valueCell.className = "table-value type-" + entry.type; valueCell.textContent = entry.value; row.appendChild(valueCell);
      fragment.appendChild(row);
    });
    tableBody.replaceChildren(fragment);
    tableNotice.hidden = !result.truncated;
    tableNotice.textContent = result.truncated ? "表示上限の 1,000 行を超えたため、残りのデータを省略しています。" : "";
  }

  function updateView() {
    const hasData = parsedData !== undefined;
    const showsTree = currentView === "tree";
    treeViewButton.classList.toggle("is-active", showsTree);
    tableViewButton.classList.toggle("is-active", !showsTree);
    treeViewButton.setAttribute("aria-pressed", String(showsTree));
    tableViewButton.setAttribute("aria-pressed", String(!showsTree));
    treeActions.hidden = !showsTree;
    tree.hidden = !hasData || !showsTree;
    tableView.hidden = !hasData || showsTree;
  }

  function render() {
    const source = input.value;
    inputStats.textContent = source.length.toLocaleString() + " characters";
    tree.replaceChildren();
    tableBody.replaceChildren();
    parsedData = undefined;
    errorState.hidden = true;
    tree.hidden = true;
    tableView.hidden = true;
    emptyState.hidden = source.trim().length > 0;
    expandButton.disabled = true;
    collapseButton.disabled = true;
    if (!source.trim()) return;

    try {
      const data = JSON.parse(source);
      parsedData = data;
      const rootList = document.createElement("ul");
      rootList.setAttribute("role", "group");
      rootList.appendChild(makeNode("root", data, 0));
      tree.appendChild(rootList);
      renderTable(data);
      updateView();
      expandButton.disabled = false;
      collapseButton.disabled = false;
    } catch (error) {
      errorDetail.textContent = error instanceof Error ? error.message : "JSON を解析できませんでした。";
      errorState.hidden = false;
    }
  }

  input.addEventListener("input", render);
  input.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = input.selectionStart;
      input.setRangeText("  ", start, input.selectionEnd, "end");
      render();
    }
  });
  expandButton.addEventListener("click", function () { setAll(true); });
  collapseButton.addEventListener("click", function () { setAll(false); });
  treeViewButton.addEventListener("click", function () { currentView = "tree"; updateView(); });
  tableViewButton.addEventListener("click", function () { currentView = "table"; updateView(); });
  clearButton.addEventListener("click", function () {
    input.value = "";
    input.focus();
    render();
  });
  render();
}(typeof globalThis !== "undefined" ? globalThis : this));
