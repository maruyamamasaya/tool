(function () {
  "use strict";

  const categories = {
    length: { label: "長さ", icon: "↔", units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, feet: 0.3048, yard: 0.9144, mile: 1609.344 } },
    weight: { label: "重さ", icon: "⚖", units: { mg: 0.000001, g: 0.001, kg: 1, oz: 0.028349523125, lb: 0.45359237 } },
    area: { label: "面積", icon: "□", units: { "cm²": 0.0001, "m²": 1, "km²": 1000000, "坪": 3.30578512397, "畳": 1.62, acre: 4046.8564224 } },
    volume: { label: "容量", icon: "◫", units: { mL: 0.001, L: 1, cc: 0.001, gallon: 3.785411784 } },
    temperature: { label: "温度", icon: "℃", units: { "℃": 1, "℉": 1, K: 1 } },
    data: { label: "データ容量", icon: "▤", units: { B: 0, KB: 1, MB: 2, GB: 3, TB: 4 } },
    time: { label: "時間", icon: "◷", units: { "ミリ秒": 0.001, "秒": 1, "分": 60, "時間": 3600, "日": 86400 } },
    speed: { label: "速度", icon: "➜", units: { "m/s": 1, "km/h": 0.2777777777778, mph: 0.44704, knot: 0.5144444444444 } },
    pressure: { label: "圧力", icon: "▰", units: { Pa: 1, hPa: 100, kPa: 1000, MPa: 1000000, bar: 100000, atm: 101325, psi: 6894.757293 } },
    currency: { label: "通貨", icon: "¥", units: { JPY: 1, USD: 1, EUR: 1, GBP: 1, CNY: 1, KRW: 1 } }
  };

  function convert(value, from, to, category, options = {}) {
    if (!Number.isFinite(value)) return NaN;
    if (category === "temperature") {
      const celsius = from === "℃" ? value : from === "℉" ? (value - 32) * 5 / 9 : value - 273.15;
      return to === "℃" ? celsius : to === "℉" ? celsius * 9 / 5 + 32 : celsius + 273.15;
    }
    if (category === "data") return value * Math.pow(options.base || 1024, categories.data.units[from] - categories.data.units[to]);
    if (category === "currency") return value * options.rate;
    return value * categories[category].units[from] / categories[category].units[to];
  }

  function initialize(doc, clipboard) {
    const el = (id) => doc.getElementById(id);
    let active = "length";
    let copyText = "";
    const categoryNav = el("categories");

    Object.entries(categories).forEach(([key, item]) => {
      const button = doc.createElement("button");
      button.type = "button"; button.dataset.category = key;
      button.innerHTML = `<span aria-hidden="true">${item.icon}</span>${item.label}`;
      button.addEventListener("click", () => selectCategory(key));
      categoryNav.append(button);
    });

    function fillUnits() {
      const names = Object.keys(categories[active].units);
      [el("from-unit"), el("to-unit")].forEach((select, index) => {
        select.replaceChildren(...names.map((name) => new Option(name, name)));
        select.selectedIndex = index === 0 ? 0 : Math.min(1, names.length - 1);
      });
    }

    function selectCategory(key) {
      active = key;
      categoryNav.querySelectorAll("button").forEach((button) => {
        const selected = button.dataset.category === key;
        button.classList.toggle("is-active", selected); button.setAttribute("aria-pressed", String(selected));
      });
      el("converter-title").textContent = `${categories[key].label}を変換`;
      el("data-options").hidden = key !== "data";
      el("currency-options").hidden = key !== "currency";
      fillUnits();
      if (key === "currency") { el("from-unit").value = "USD"; el("to-unit").value = "JPY"; }
      update();
    }

    function update() {
      const raw = el("value").value.trim().replaceAll(",", "");
      const value = raw === "" ? NaN : Number(raw);
      const from = el("from-unit").value, to = el("to-unit").value;
      el("rate-from").textContent = from; el("rate-to").textContent = to;
      const rate = Number(el("rate").value.replaceAll(",", ""));
      const base = Number(doc.querySelector('input[name="data-base"]:checked').value);
      const answer = convert(value, from, to, active, { rate: rate > 0 ? rate : NaN, base });
      if (!Number.isFinite(answer)) {
        el("result").textContent = "—"; el("result-unit").textContent = "";
        el("formula").textContent = raw && active === "currency" ? "有効な為替レートを入力してください" : "数値を入力すると結果が表示されます";
        el("copy").disabled = true; copyText = ""; return;
      }
      const digits = Number(el("digits").value);
      const formatted = answer.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: digits });
      el("result").textContent = formatted; el("result-unit").textContent = to;
      el("formula").textContent = `${value.toLocaleString("ja-JP")} ${from} = ${formatted} ${to}`;
      copyText = `${formatted} ${to}`; el("copy").disabled = false;
    }

    ["value", "rate"].forEach((id) => el(id).addEventListener("input", update));
    ["from-unit", "to-unit", "digits"].forEach((id) => el(id).addEventListener("change", update));
    doc.querySelectorAll('input[name="data-base"]').forEach((radio) => radio.addEventListener("change", update));
    el("swap").addEventListener("click", () => {
      const from = el("from-unit").value;
      el("from-unit").value = el("to-unit").value; el("to-unit").value = from;
      if (active === "currency") {
        const rate = Number(el("rate").value.replaceAll(",", ""));
        if (rate > 0) el("rate").value = String(1 / rate);
      }
      update();
    });
    el("clear").addEventListener("click", () => { el("value").value = ""; update(); el("value").focus(); });
    el("copy").addEventListener("click", async () => { await clipboard.writeText(copyText); el("copy").textContent = "✓ コピーしました"; setTimeout(() => { el("copy").textContent = "▣ 結果をコピー"; }, 1400); });
    selectCategory(active);
  }

  if (typeof module !== "undefined") module.exports = { categories, convert };
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initialize(document, navigator.clipboard));
})();
