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
  const gradientPresets = [
    { name: "Social Sunset", colors: ["#833AB4", "#FD1D1D"], direction: "135deg" },
    { name: "Peach Glow", colors: ["#FF9966", "#FF5E62"], direction: "135deg" },
    { name: "Digital Lavender", colors: ["#7F7FD5", "#91EAE4"], direction: "135deg" },
    { name: "Neo Matcha", colors: ["#DCE35B", "#45B649"], direction: "135deg" },
    { name: "Dreamy Blue", colors: ["#A1C4FD", "#C2E9FB"], direction: "135deg" },
    { name: "Berry Pop", colors: ["#FC466B", "#3F5EFB"], direction: "45deg" },
    { name: "Soft Sorbet", colors: ["#FBC2EB", "#A6C1EE"], direction: "135deg" },
    { name: "Midnight Reel", colors: ["#232526", "#6A3093"], direction: "135deg" }
  ];

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

  function makeGradient(color1, color2, direction = "135deg") {
    const first = normalizeHex(color1);
    const second = normalizeHex(color2);
    if (!first || !second || !/^(45|90|135|180)deg$/.test(direction)) return null;
    return `linear-gradient(${direction}, ${first}, ${second})`;
  }

  if (typeof module !== "undefined") module.exports = { paletteGroups, colors, gradientPresets, normalizeHex, hexToRgb, makeGradient };
  if (typeof document === "undefined") return;

  const input = document.querySelector("#colorInput");
  const preview = document.querySelector("#preview");
  const hexValue = document.querySelector("#hexValue");
  const rgbValue = document.querySelector("#rgbValue");
  const error = document.querySelector("#inputError");
  const palette = document.querySelector("#palette");
  const toast = document.querySelector("#toast");
  const gradientPreview = document.querySelector("#gradientPreview");
  const gradientCss = document.querySelector("#gradientCss");
  const gradientDirection = document.querySelector("#gradientDirection");
  const gradientInputs = [1, 2].map(number => ({ color: document.querySelector(`#gradientColor${number}`), hex: document.querySelector(`#gradientHex${number}`) }));
  const notes = document.querySelector("#colorNotes");
  const saveStatus = document.querySelector("#saveStatus");
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

  function updateGradient() {
    const css = makeGradient(gradientInputs[0].hex.value, gradientInputs[1].hex.value, gradientDirection.value);
    if (!css) return false;
    gradientInputs.forEach(field => {
      const value = normalizeHex(field.hex.value);
      field.hex.value = value;
      field.color.value = value;
    });
    gradientPreview.style.background = css;
    gradientCss.textContent = css;
    return true;
  }

  function applyPreset(preset) {
    gradientInputs.forEach((field, index) => { field.hex.value = preset.colors[index]; });
    gradientDirection.value = preset.direction;
    updateGradient();
    gradientPreview.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderGradientPresets() {
    const container = document.querySelector("#gradientRecommendations");
    container.replaceChildren(...gradientPresets.map(preset => {
      const button = document.createElement("button");
      const css = makeGradient(...preset.colors, preset.direction);
      button.type = "button";
      button.className = "gradient-preset";
      button.style.background = css;
      button.setAttribute("aria-label", `${preset.name}を適用`);
      button.innerHTML = `<strong>${preset.name}</strong><span>${preset.colors.join(" · ")}</span>`;
      button.addEventListener("click", () => applyPreset(preset));
      return button;
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
  document.querySelectorAll(".copy-button[data-copy]").forEach(button => button.addEventListener("click", () => copyText(button.dataset.copy === "hex" ? hexValue.textContent : rgbValue.textContent)));
  gradientInputs.forEach(field => {
    field.color.addEventListener("input", () => { field.hex.value = field.color.value.toUpperCase(); updateGradient(); });
    field.hex.addEventListener("change", () => { if (!updateGradient()) showToast("HEXコードを確認してください"); });
  });
  gradientDirection.addEventListener("change", updateGradient);
  document.querySelector("#copyGradient").addEventListener("click", () => copyText(gradientCss.textContent));
  try { notes.value = localStorage.getItem("colorPaletteNotes") || ""; } catch (_) { saveStatus.textContent = "この環境では保存できません"; }
  notes.addEventListener("input", () => {
    try { localStorage.setItem("colorPaletteNotes", notes.value); saveStatus.textContent = "保存しました"; setTimeout(() => { saveStatus.textContent = "自動保存"; }, 1200); }
    catch (_) { saveStatus.textContent = "保存できませんでした"; }
  });
  renderPalette();
  renderGradientPresets();
  selectColor(selectedHex);
})();
