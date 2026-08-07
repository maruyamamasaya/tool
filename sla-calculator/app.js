(function () {
  'use strict';

  function parseAvailability(value) {
    const normalized = String(value ?? '').trim().replace(/[０-９．]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xFEE0)).replace(/[％%]/g, '');
    if (!normalized) return null;
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  function downtimeSeconds(availability, days) {
    if (!Number.isFinite(availability) || availability < 0 || availability > 100) return NaN;
    return days * 24 * 60 * 60 * (100 - availability) / 100;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return '—';
    const rounded = Math.round(seconds);
    if (rounded === 0) return '0秒';
    const days = Math.floor(rounded / 86400);
    const hours = Math.floor(rounded % 86400 / 3600);
    const minutes = Math.floor(rounded % 3600 / 60);
    const remainingSeconds = rounded % 60;
    const parts = [];
    if (days) parts.push(`${days}日`);
    if (hours) parts.push(`${hours}時間`);
    if (minutes) parts.push(`${minutes}分`);
    if (remainingSeconds) parts.push(`${remainingSeconds}秒`);
    return parts.join(' ');
  }

  if (typeof module !== 'undefined') module.exports = { parseAvailability, downtimeSeconds, formatDuration };
  if (typeof document === 'undefined') return;

  const input = document.getElementById('availability');
  const error = document.getElementById('rate-error');
  const periods = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };

  function update() {
    const availability = parseAvailability(input.value);
    const valid = availability !== null && Number.isFinite(availability) && availability >= 0 && availability <= 100;
    error.textContent = availability === null ? '稼働率を入力してください' : valid ? '' : '0〜100の範囲で稼働率を入力してください';
    input.setAttribute('aria-invalid', String(!valid));
    Object.entries(periods).forEach(([id, days]) => { document.getElementById(id).textContent = valid ? formatDuration(downtimeSeconds(availability, days)) : '—'; });
    document.getElementById('monthly-primary').textContent = valid ? formatDuration(downtimeSeconds(availability, 30)) : '—';
    document.querySelectorAll('[data-rate]').forEach((button) => button.classList.toggle('is-active', valid && Number(button.dataset.rate) === availability));
  }

  input.addEventListener('input', update);
  document.querySelectorAll('[data-rate]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.rate; update(); input.focus(); }));
  update();
}());
