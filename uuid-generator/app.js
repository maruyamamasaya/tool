(function () {
  "use strict";

  function generateUuid(randomValues) {
    const bytes = randomValues || crypto.getRandomValues(new Uint8Array(16));
    const values = Uint8Array.from(bytes);
    values[6] = (values[6] & 0x0f) | 0x40;
    values[8] = (values[8] & 0x3f) | 0x80;
    const hex = Array.from(values, value => value.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  function normalizeCount(value) {
    const count = Number.parseInt(value, 10);
    if (Number.isNaN(count)) return 1;
    return Math.min(100, Math.max(1, count));
  }

  if (typeof module !== "undefined") module.exports = { generateUuid, normalizeCount };
  if (typeof document === "undefined") return;

  const countInput = document.querySelector("#count");
  const results = document.querySelector("#results");
  const resultCount = document.querySelector("#resultCount");
  const toast = document.querySelector("#toast");
  let uuids = [];
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch (_) {
      showToast("コピーできませんでした");
    }
  }

  function render() {
    resultCount.textContent = String(uuids.length);
    results.replaceChildren(...uuids.map((uuid, index) => {
      const item = document.createElement("li");
      item.className = "result-item";
      const number = document.createElement("span");
      number.className = "index";
      number.textContent = String(index + 1).padStart(2, "0");
      const value = document.createElement("code");
      value.className = "uuid";
      value.textContent = uuid;
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "copy-one";
      copy.setAttribute("aria-label", `${index + 1}番目のUUIDをコピー`);
      copy.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
      copy.addEventListener("click", () => copyText(uuid, "UUIDをコピーしました"));
      item.append(number, value, copy);
      return item;
    }));
  }

  function generate() {
    const count = normalizeCount(countInput.value);
    countInput.value = String(count);
    uuids = Array.from({ length: count }, () => generateUuid());
    render();
  }

  function changeCount(delta) {
    countInput.value = String(normalizeCount(normalizeCount(countInput.value) + delta));
  }

  document.querySelector("#decrease").addEventListener("click", () => changeCount(-1));
  document.querySelector("#increase").addEventListener("click", () => changeCount(1));
  document.querySelector("#generate").addEventListener("click", generate);
  document.querySelector("#copyAll").addEventListener("click", () => copyText(uuids.join("\n"), `${uuids.length}個のUUIDをコピーしました`));
  countInput.addEventListener("change", () => { countInput.value = String(normalizeCount(countInput.value)); });
  countInput.addEventListener("keydown", event => { if (event.key === "Enter") generate(); });
  generate();
})();
