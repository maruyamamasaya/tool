(function () {
  "use strict";

  const MAX_DEPTH = 10;
  const ARRAY_PREVIEW_LIMIT = 10;
  const input = document.getElementById("jsonInput");
  const tree = document.getElementById("tree");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");
  const errorDetail = document.getElementById("errorDetail");
  const inputStats = document.getElementById("inputStats");
  const expandButton = document.getElementById("expandButton");
  const collapseButton = document.getElementById("collapseButton");
  const clearButton = document.getElementById("clearButton");

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

  function render() {
    const source = input.value;
    inputStats.textContent = source.length.toLocaleString() + " characters";
    tree.replaceChildren();
    errorState.hidden = true;
    tree.hidden = true;
    emptyState.hidden = source.trim().length > 0;
    expandButton.disabled = true;
    collapseButton.disabled = true;
    if (!source.trim()) return;

    try {
      const data = JSON.parse(source);
      const rootList = document.createElement("ul");
      rootList.setAttribute("role", "group");
      rootList.appendChild(makeNode("root", data, 0));
      tree.appendChild(rootList);
      tree.hidden = false;
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
  clearButton.addEventListener("click", function () {
    input.value = "";
    input.focus();
    render();
  });
  render();
}());
