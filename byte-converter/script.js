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

  const UNIT_NAMES = Object.fromEntries(OUTPUT_UNITS.map((unit) => [unit.toLowerCase(), unit]));

  function parseByteText(text) {
    if (typeof text !== 'string') return null;
    const match = text.match(/(?<![\d,])([+-]?[0-9][0-9,]*(?:\.[0-9]+)?)\s*(KiB|MiB|GiB|TiB|KB|MB|GB|TB|B)/i);
    if (!match) return null;
    const numberText = match[1];
    if (numberText.includes(',') && !/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(numberText)) return null;
    const value = Number(numberText.replaceAll(',', ''));
    const unit = UNIT_NAMES[match[2].toLowerCase()];
    return Number.isFinite(value) && value >= 0 ? { value, unit } : null;
  }

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

  if (typeof module !== 'undefined') module.exports = { UNITS, convert, formatValue, parseByteText };
  if (typeof document === 'undefined') return;

  const valueInput = document.getElementById('valueInput');
  const unitInput = document.getElementById('unitInput');
  const resultGrid = document.getElementById('resultGrid');
  const errorMessage = document.getElementById('errorMessage');
  const standardLabel = document.getElementById('standardLabel');
  const inputHint = document.getElementById('inputHint');
  const modeInputs = document.querySelectorAll('input[name="inputMode"]');
  let activeMode = 'auto';

  function getMode() {
    return document.querySelector('input[name="inputMode"]:checked').value;
  }

  function updateMode() {
    const isAuto = getMode() === 'auto';
    if (activeMode === 'auto' && !isAuto) {
      const parsed = parseByteText(valueInput.value);
      if (parsed) {
        valueInput.value = String(parsed.value);
        unitInput.value = parsed.unit;
      }
    } else if (activeMode === 'manual' && isAuto && valueInput.value.trim() !== '') {
      valueInput.value = `${valueInput.value} ${unitInput.value}`;
    }
    activeMode = isAuto ? 'auto' : 'manual';
    unitInput.hidden = isAuto;
    valueInput.inputMode = isAuto ? 'text' : 'decimal';
    valueInput.placeholder = isAuto ? '例: 1234567kB' : '例: 1234567';
    inputHint.textContent = isAuto
      ? '数値と単位を含むテキストを、そのまま貼り付けられます。'
      : '数値を入力し、右のプルダウンから単位を選びます。';
    render();
  }

  function render() {
    const isAuto = getMode() === 'auto';
    const parsed = isAuto
      ? parseByteText(valueInput.value)
      : { value: Number(valueInput.value), unit: unitInput.value };
    const results = valueInput.value.trim() === '' || !parsed ? null : convert(parsed.value, parsed.unit);
    errorMessage.textContent = results
      ? ''
      : isAuto ? '0以上の数値と単位（例: 123 kB）を入力してください。' : '0以上の数値を入力してください。';
    const sourceUnit = parsed ? parsed.unit : unitInput.value;
    standardLabel.textContent = `1 ${sourceUnit} = ${UNITS[sourceUnit].toLocaleString('ja-JP')} bytes`;
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
  modeInputs.forEach((input) => input.addEventListener('change', updateMode));
  updateMode();
}());
