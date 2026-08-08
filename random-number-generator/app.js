(function () {
  "use strict";

  const SEPARATORS = { newline: "\n", comma: ", ", space: " ", tab: "\t", pipe: " | " };

  function parseRange(value) {
    const [minimum, maximum] = String(value).split(",").map(Number);
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum) {
      throw new RangeError("正しい範囲を選択してください");
    }
    return { minimum, maximum };
  }

  function randomInteger(minimum, maximum, randomValue) {
    const size = maximum - minimum + 1;
    if (!Number.isSafeInteger(size) || size < 1) throw new RangeError("生成範囲が不正です");
    const value = randomValue === undefined ? crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000 : randomValue;
    if (value < 0 || value >= 1) throw new RangeError("乱数は0以上1未満で指定してください");
    return minimum + Math.floor(value * size);
  }

  function formatNumbers(numbers, format) {
    return numbers.join(SEPARATORS[format] === undefined ? SEPARATORS.newline : SEPARATORS[format]);
  }

  if (typeof module !== "undefined") module.exports = { formatNumbers, parseRange, randomInteger, SEPARATORS };
  if (typeof document === "undefined") return;

  const range = document.querySelector("#range");
  const count = document.querySelector("#count");
  const separator = document.querySelector("#separator");
  const output = document.querySelector("#output");
  const resultMeta = document.querySelector("#resultMeta");
  const toast = document.querySelector("#toast");
  let numbers = [];
  let toastTimer;

  function render() {
    output.value = formatNumbers(numbers, separator.value);
    resultMeta.textContent = `${numbers.length}個`;
  }

  function generate() {
    const { minimum, maximum } = parseRange(range.value);
    numbers = Array.from({ length: Number(count.value) }, () => randomInteger(minimum, maximum));
    render();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(output.value);
      showToast(`${numbers.length}個の乱数をコピーしました`);
    } catch (_) {
      output.select();
      showToast("テキストを選択しました");
    }
  }

  document.querySelector("#generate").addEventListener("click", generate);
  document.querySelector("#copy").addEventListener("click", copyResult);
  separator.addEventListener("change", render);
  range.addEventListener("change", generate);
  count.addEventListener("change", generate);
  generate();
})();
