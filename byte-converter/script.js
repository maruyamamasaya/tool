(function () {
  'use strict';

  const UNITS = {
    B: 1,
    KB: 1000,
    MB: 1000 ** 2,
    GB: 1000 ** 3,
    TB: 1000 ** 4,
    KiB: 1024,
    MiB: 1024 ** 2,
    GiB: 1024 ** 3,
    TiB: 1024 ** 4
  };

  const OUTPUT_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'KiB', 'MiB', 'GiB', 'TiB'];

  function convert(value, fromUnit) {
    if (!Number.isFinite(value) || value < 0 || !UNITS[fromUnit]) return null;
    const bytes = value * UNITS[fromUnit];
    if (!Number.isFinite(bytes)) return null;
    return Object.fromEntries(OUTPUT_UNITS.map((unit) => [unit, bytes / UNITS[unit]]));
  }

  function formatValue(value) {
    if (value === 0) return '0';
    if (value >= 1e15 || value < 1e-6) return value.toExponential(6).replace(/\.0+e/, 'e');
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 10 }).format(value);
  }

  if (typeof module !== 'undefined') module.exports = { UNITS, convert, formatValue };
  if (typeof document === 'undefined') return;

  const valueInput = document.getElementById('valueInput');
  const unitInput = document.getElementById('unitInput');
  const resultGrid = document.getElementById('resultGrid');
  const errorMessage = document.getElementById('errorMessage');
  const standardLabel = document.getElementById('standardLabel');

  function render() {
    const value = Number(valueInput.value);
    const results = valueInput.value.trim() === '' ? null : convert(value, unitInput.value);
    errorMessage.textContent = results ? '' : '0以上の数値を入力してください。';
    standardLabel.textContent = `1 ${unitInput.value} = ${UNITS[unitInput.value].toLocaleString('ja-JP')} bytes`;
    resultGrid.replaceChildren();

    if (!results) return;
    OUTPUT_UNITS.forEach((unit) => {
      const row = document.createElement('div');
      row.className = 'result-row';
      const valueText = formatValue(results[unit]);
      row.innerHTML = `<span class="unit">${unit}</span><output class="value">${valueText}</output>`;
      const copyButton = document.createElement('button');
      copyButton.className = 'copy';
      copyButton.type = 'button';
      copyButton.textContent = 'コピー';
      copyButton.setAttribute('aria-label', `${unit}の値をコピー`);
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(String(results[unit]));
          copyButton.textContent = '完了';
          setTimeout(() => { copyButton.textContent = 'コピー'; }, 1200);
        } catch (_) {
          copyButton.textContent = '失敗';
        }
      });
      row.appendChild(copyButton);
      resultGrid.appendChild(row);
    });
  }

  valueInput.addEventListener('input', render);
  unitInput.addEventListener('change', render);
  render();
}());
