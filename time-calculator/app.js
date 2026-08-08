(function () {
  'use strict';

  function parseTime(value) {
    const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  function durationBetween(start, end) {
    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);
    if (startMinutes === null || endMinutes === null) return null;
    return endMinutes >= startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;
  }

  function calculateWork(start, end, breakTime) {
    const elapsed = durationBetween(start, end);
    const breakMinutes = parseTime(breakTime);
    if (elapsed === null || breakMinutes === null) return { error: '時刻を正しく入力してください。' };
    if (breakMinutes > elapsed) return { error: '休憩時間は実時間以内にしてください。' };
    return { elapsed, breakMinutes, work: elapsed - breakMinutes };
  }

  function parseRanges(value) {
    const lines = String(value ?? '').split(/\r?\n/);
    const ranges = [];
    const invalidLines = [];
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const match = line.trim().match(/^(\d{1,2}:\d{2})\s*(?:-|–|—|〜|~)\s*(\d{1,2}:\d{2})$/);
      const minutes = match ? durationBetween(match[1], match[2]) : null;
      if (minutes === null) invalidLines.push(index + 1);
      else ranges.push({ start: match[1], end: match[2], minutes });
    });
    if (invalidLines.length) return { error: `${invalidLines.join('、')}行目の形式を確認してください。`, ranges: [] };
    return { ranges, total: ranges.reduce((sum, range) => sum + range.minutes, 0) };
  }

  function formatDuration(minutes) {
    return `${Math.floor(minutes / 60)}時間${String(minutes % 60).padStart(2, '0')}分`;
  }

  function formatDecimal(minutes) {
    return Number((minutes / 60).toFixed(2)).toString();
  }

  if (typeof module !== 'undefined') module.exports = { parseTime, durationBetween, calculateWork, parseRanges, formatDuration, formatDecimal };
  if (typeof document === 'undefined') return;

  let activeMode = 'work';
  let copyText = '';
  const $ = (id) => document.getElementById(id);

  function showError(id, message) {
    const element = $(id);
    element.textContent = message || '';
    element.hidden = !message;
  }

  function updateWork() {
    const result = calculateWork($('start').value, $('end').value, $('break').value);
    showError('work-error', result.error);
    if (result.error) {
      ['work-duration', 'elapsed-duration', 'decimal-hours', 'total-minutes'].forEach((id) => { $(id).textContent = '—'; });
      return '';
    }
    $('work-duration').textContent = formatDuration(result.work);
    $('elapsed-duration').textContent = formatDuration(result.elapsed);
    $('decimal-hours').textContent = `${formatDecimal(result.work)}時間`;
    $('total-minutes').textContent = `${result.work}分`;
    return `開始       ${$('start').value}\n終了       ${$('end').value}\n休憩       ${$('break').value}\n\n----------------\n\n実時間     ${formatDuration(result.elapsed)}\n稼働時間   ${formatDuration(result.work)}\n\n${formatDecimal(result.work)}時間\n${result.work}分`;
  }

  function updateRanges() {
    const result = parseRanges($('ranges').value);
    showError('ranges-error', result.error);
    if (result.error || !result.ranges.length) {
      $('ranges-duration').textContent = '—'; $('ranges-decimal').textContent = '—'; $('ranges-minutes').textContent = '—';
      return '';
    }
    $('ranges-duration').textContent = formatDuration(result.total);
    $('ranges-decimal').textContent = `${formatDecimal(result.total)}時間`;
    $('ranges-minutes').textContent = `${result.total}分`;
    return `${result.ranges.map((range) => `${range.start} - ${range.end}`).join('\n')}\n\n合計 ${formatDuration(result.total)}`;
  }

  function update() {
    copyText = activeMode === 'work' ? updateWork() : updateRanges();
    $('copy').disabled = !copyText;
  }

  function activate(mode) {
    activeMode = mode;
    document.querySelectorAll('.tab').forEach((tab) => { const active = tab.dataset.mode === mode; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    document.querySelectorAll('.panel').forEach((panel) => { const active = panel.dataset.mode === mode; panel.hidden = !active; panel.classList.toggle('is-active', active); });
    update();
  }

  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => activate(tab.dataset.mode)));
  ['start', 'end', 'break', 'ranges'].forEach((id) => $(id).addEventListener('input', update));
  $('reset').addEventListener('click', () => {
    if (activeMode === 'work') { $('start').value = ''; $('end').value = ''; $('break').value = '00:00'; $('start').focus(); }
    else { $('ranges').value = ''; $('ranges').focus(); }
    update();
  });
  $('copy').addEventListener('click', async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      $('copy').textContent = '✓ コピーしました';
      setTimeout(() => { $('copy').textContent = '▣ 結果をコピー'; }, 1600);
    } catch (_) { $('copy').textContent = 'コピーできませんでした'; }
  });
  update();
}());
