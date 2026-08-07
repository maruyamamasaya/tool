(function () {
  'use strict';

  const pad = (value) => String(value).padStart(2, '0');

  function timestampToDate(value) {
    const text = String(value).trim();
    if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;
    const number = Number(text);
    if (!Number.isFinite(number)) return null;
    const milliseconds = Math.abs(number) >= 1e11 ? number : number * 1000;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function datetimeToTimestamp(value, timezone) {
    const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    const parts = match.slice(1).map(Number);
    const [year, month, day, hour, minute, second = 0] = parts;
    if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return null;
    const milliseconds = timezone === 'local'
      ? new Date(year, month - 1, day, hour, minute, second).getTime()
      : Date.UTC(year, month - 1, day, hour, minute, second);
    const check = timezone === 'local' ? new Date(milliseconds) : new Date(milliseconds);
    const values = timezone === 'local'
      ? [check.getFullYear(), check.getMonth() + 1, check.getDate(), check.getHours(), check.getMinutes(), check.getSeconds()]
      : [check.getUTCFullYear(), check.getUTCMonth() + 1, check.getUTCDate(), check.getUTCHours(), check.getUTCMinutes(), check.getUTCSeconds()];
    if (values.some((item, index) => item !== [year, month, day, hour, minute, second][index])) return null;
    return { seconds: Math.floor(milliseconds / 1000), milliseconds };
  }

  function formatDate(date, utc) {
    const get = (name) => date[`${utc ? 'getUTC' : 'get'}${name}`]();
    return `${get('FullYear')}-${pad(get('Month') + 1)}-${pad(get('Date'))} ${pad(get('Hours'))}:${pad(get('Minutes'))}:${pad(get('Seconds'))}`;
  }

  if (typeof module !== 'undefined') module.exports = { timestampToDate, datetimeToTimestamp, formatDate };
  if (typeof document === 'undefined') return;

  const byId = (id) => document.getElementById(id);
  const timestampInput = byId('timestampInput');
  const datetimeInput = byId('datetimeInput');
  const timezoneInput = byId('timezoneInput');

  function renderTimestamp() {
    const date = timestampToDate(timestampInput.value);
    byId('timestampError').textContent = date ? '' : '有効な timestamp を入力してください。';
    byId('utcResult').textContent = date ? `${formatDate(date, true)} UTC` : '—';
    byId('localResult').textContent = date ? formatDate(date, false) : '—';
    byId('isoResult').textContent = date ? date.toISOString() : '—';
  }

  function renderDatetime() {
    const result = datetimeToTimestamp(datetimeInput.value, timezoneInput.value);
    byId('datetimeError').textContent = result ? '' : '例: 2024-01-01 00:00:00 の形式で入力してください。';
    byId('secondsResult').textContent = result ? String(result.seconds) : '—';
    byId('millisecondsResult').textContent = result ? String(result.milliseconds) : '—';
  }

  timestampInput.addEventListener('input', renderTimestamp);
  datetimeInput.addEventListener('input', renderDatetime);
  timezoneInput.addEventListener('change', renderDatetime);
  byId('setNow').addEventListener('click', () => {
    timestampInput.value = String(Math.floor(Date.now() / 1000));
    renderTimestamp();
  });
  document.querySelectorAll('.copy').forEach((button) => button.addEventListener('click', async () => {
    const value = byId(button.dataset.copyTarget).textContent;
    if (value === '—') return;
    try {
      await navigator.clipboard.writeText(value);
      byId('toast').textContent = 'コピーしました';
      byId('toast').classList.add('show');
      setTimeout(() => byId('toast').classList.remove('show'), 1400);
    } catch (_) {
      byId('toast').textContent = 'コピーできませんでした';
      byId('toast').classList.add('show');
    }
  }));
  renderTimestamp();
  renderDatetime();
}());
