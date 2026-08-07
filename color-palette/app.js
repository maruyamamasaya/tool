(function () {
  "use strict";

  const paletteGroups = [
    ["赤",["#FFEBEE","#FFCDD2","#EF9A9A","#E57373","#EF5350","#F44336","#E53935","#D32F2F","#C62828","#B71C1C","#FF1744"]],
    ["オレンジ",["#FFF3E0","#FFE0B2","#FFCC80","#FFB74D","#FFA726","#FF9800","#FB8C00","#F57C00","#EF6C00","#E65100","#FF6D00"]],
    ["黄色",["#FFFDE7","#FFF9C4","#FFF59D","#FFF176","#FFEE58","#FFEB3B","#FDD835","#FBC02D","#F9A825","#F57F17","#FFD600"]],
    ["緑",["#E8F5E9","#C8E6C9","#A5D6A7","#81C784","#66BB6A","#4CAF50","#43A047","#388E3C","#2E7D32","#1B5E20","#00C853"]],
    ["水色",["#E0F7FA","#B2EBF2","#80DEEA","#4DD0E1","#26C6DA","#00BCD4","#00ACC1","#0097A7","#00838F","#006064","#00E5FF"]],
    ["青",["#E3F2FD","#BBDEFB","#90CAF9","#64B5F6","#42A5F5","#2196F3","#1E88E5","#1976D2","#1565C0","#0D47A1","#2979FF"]],
    ["紫",["#F3E5F5","#E1BEE7","#CE93D8","#BA68C8","#AB47BC","#9C27B0","#8E24AA","#7B1FA2","#6A1B9A","#4A148C","#AA00FF"]],
    ["ピンク",["#FCE4EC","#F8BBD0","#F48FB1","#F06292","#EC407A","#E91E63","#D81B60","#C2185B","#AD1457","#880E4F","#F50057"]],
    ["茶色",["#EFEBE9","#D7CCC8","#BCAAA4","#A1887F","#8D6E63","#795548","#6D4C41","#5D4037","#4E342E","#3E2723","#A0522D"]],
    ["グレー",["#FAFAFA","#F5F5F5","#EEEEEE","#E0E0E0","#BDBDBD","#9E9E9E","#757575","#616161","#424242","#303030","#212121"]],
    ["白・黒・定番",["#FFFFFF","#F8F9FA","#ECEFF1","#CFD8DC","#90A4AE","#607D8B","#455A64","#263238","#000000","#FF5733"]]
  ];
  const colors = paletteGroups.flatMap(([, values]) => values);

  function normalizeHex(value) {
    const raw = String(value).trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(raw)) return "#" + raw.split("").map(char => char + char).join("").toUpperCase();
    return /^[0-9a-f]{6}$/i.test(raw) ? "#" + raw.toUpperCase() : null;
  }

  function hexToRgb(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;
    return [1, 3, 5].map(index => parseInt(normalized.slice(index, index + 2), 16));
  }

  if (typeof module !== "undefined") module.exports = { paletteGroups, colors, normalizeHex, hexToRgb };
  if (typeof document === "undefined") return;

  const input = document.querySelector("#colorInput");
  const preview = document.querySelector("#preview");
  const hexValue = document.querySelector("#hexValue");
  const rgbValue = document.querySelector("#rgbValue");
  const error = document.querySelector("#inputError");
  const palette = document.querySelector("#palette");
  const toast = document.querySelector("#toast");
  let selectedHex = "#4CAF50";
  let toastTimer;

  function selectColor(hex, syncInput = true) {
    const normalized = normalizeHex(hex);
    if (!normalized) return false;
    const [r, g, b] = hexToRgb(normalized);
    selectedHex = normalized;
    preview.style.backgroundColor = normalized;
    hexValue.textContent = normalized;
    rgbValue.textContent = `rgb(${r}, ${g}, ${b})`;
    if (syncInput) input.value = normalized.slice(1);
    error.textContent = "";
    document.querySelectorAll(".swatch").forEach(button => {
      const selected = button.dataset.color === normalized;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    return true;
  }

  function renderPalette() {
    palette.replaceChildren(...paletteGroups.map(([name, values]) => {
      const group = document.createElement("section");
      group.className = "color-group";
      const heading = document.createElement("h3");
      heading.textContent = name;
      const grid = document.createElement("div");
      grid.className = "color-grid";
      values.forEach(hex => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "swatch";
        button.dataset.color = hex;
        button.style.setProperty("--color", hex);
        button.setAttribute("aria-label", `${name} ${hex}を選択`);
        button.setAttribute("aria-pressed", "false");
        button.innerHTML = `<span>${hex}</span>`;
        button.addEventListener("click", () => selectColor(hex));
        grid.append(button);
      });
      group.append(heading, grid);
      return group;
    }));
  }

  function showToast(message = "コピーしました") {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast();
    } catch (_) {
      showToast("コピーできませんでした");
    }
  }

  input.addEventListener("input", () => {
    if (!selectColor(input.value, false)) error.textContent = "3桁または6桁のHEXコードを入力してください";
  });
  input.addEventListener("blur", () => { if (normalizeHex(input.value)) input.value = selectedHex.slice(1); });
  document.querySelectorAll(".copy-button").forEach(button => button.addEventListener("click", () => copyText(button.dataset.copy === "hex" ? hexValue.textContent : rgbValue.textContent)));
  renderPalette();
  selectColor(selectedHex);
})();
