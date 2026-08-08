(function () {
  'use strict';

  function parseNumbers(input) {
    const tokens = String(input ?? '').split(/[\s,]+/).filter(Boolean);
    const numbers = [];
    let ignored = 0;
    const numberPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

    tokens.forEach((token) => {
      if (!numberPattern.test(token)) {
        ignored += 1;
        return;
      }
      const number = Number(token);
      if (Number.isFinite(number)) numbers.push(number);
      else ignored += 1;
    });
    return { numbers, ignored };
  }

  function summarize(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const count = numbers.length;
    const sum = numbers.reduce((total, number) => total + number, 0);
    const middle = Math.floor(count / 2);
    const median = count % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    return { sum, average: sum / count, count, max: sorted[count - 1], min: sorted[0], median, range: sorted[count - 1] - sorted[0] };
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return '—';
    const normalized = Object.is(value, -0) || Math.abs(value) < 1e-12 ? 0 : value;
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 12 }).format(normalized);
  }

  function createCopyText(result) {
    if (!result) return '';
    return [
      `SUM: ${formatNumber(result.sum)}`,
      `AVERAGE: ${formatNumber(result.average)}`,
      `COUNT: ${formatNumber(result.count)}`,
      `MAX: ${formatNumber(result.max)}`,
      `MIN: ${formatNumber(result.min)}`,
      `MEDIAN: ${formatNumber(result.median)}`,
      `RANGE: ${formatNumber(result.range)}`
    ].join('\n');
  }

  if (typeof module !== 'undefined') module.exports = { parseNumbers, summarize, formatNumber, createCopyText };
  if (typeof document === 'undefined') return;

  const input = document.getElementById('number-input');
  const copyButton = document.getElementById('copy');
  const fields = ['sum', 'average', 'count', 'max', 'min', 'median', 'range'];
  let copyText = '';

  function calculate() {
    const parsed = parseNumbers(input.value);
    const result = summarize(parsed.numbers);
    copyText = createCopyText(result);
    fields.forEach((field) => { document.getElementById(field).textContent = result ? formatNumber(result[field]) : '—'; });
    document.getElementById('parse-status').textContent = result
      ? `${parsed.numbers.length}個の数値を認識しました`
      : '数値を認識できませんでした';
    const ignoredStatus = document.getElementById('ignored-status');
    ignoredStatus.hidden = parsed.ignored === 0;
    ignoredStatus.textContent = parsed.ignored ? `${parsed.ignored}件の値を無視しました` : '';
    copyButton.disabled = !result;
    document.getElementById('copy-status').textContent = '';
  }

  document.getElementById('calculate').addEventListener('click', calculate);
  document.getElementById('clear').addEventListener('click', () => {
    input.value = '';
    copyText = '';
    fields.forEach((field) => { document.getElementById(field).textContent = '—'; });
    document.getElementById('parse-status').textContent = '数値を入力して「計算」を押してください';
    document.getElementById('ignored-status').hidden = true;
    document.getElementById('copy-status').textContent = '';
    copyButton.disabled = true;
    input.focus();
  });
  copyButton.addEventListener('click', async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      document.getElementById('copy-status').textContent = 'コピーしました';
    } catch (_) {
      document.getElementById('copy-status').textContent = 'コピーできませんでした';
    }
  });
}());
