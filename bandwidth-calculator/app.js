(function () {
  'use strict';

  const DATA_IN_BYTES = { MB: 1e6, GB: 1e9, TB: 1e12 };
  const TIME_IN_SECONDS = { second: 1, minute: 60, hour: 3600 };
  const BANDWIDTH_IN_BITS = { Mbps: 1e6, Gbps: 1e9, MBps: 8e6, GBps: 8e9 };

  function calculateBandwidth(dataSize, dataUnit, duration, timeUnit) {
    const size = Number(dataSize);
    const time = Number(duration);
    if (!Number.isFinite(size) || !Number.isFinite(time) || size <= 0 || time <= 0 || !DATA_IN_BYTES[dataUnit] || !TIME_IN_SECONDS[timeUnit]) return null;
    const bytesPerSecond = (size * DATA_IN_BYTES[dataUnit]) / (time * TIME_IN_SECONDS[timeUnit]);
    return { megabitsPerSecond: bytesPerSecond * 8 / 1e6, megabytesPerSecond: bytesPerSecond / 1e6 };
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(value);
  }

  function calculateTransferTime(dataSize, dataUnit, bandwidth, bandwidthUnit) {
    const size = Number(dataSize);
    const rate = Number(bandwidth);
    if (!Number.isFinite(size) || !Number.isFinite(rate) || size <= 0 || rate <= 0 || !DATA_IN_BYTES[dataUnit] || !BANDWIDTH_IN_BITS[bandwidthUnit]) return null;
    return (size * DATA_IN_BYTES[dataUnit] * 8) / (rate * BANDWIDTH_IN_BITS[bandwidthUnit]);
  }

  function formatDuration(seconds) {
    if (seconds < 1) return `${formatNumber(seconds)}秒`;
    const rounded = Math.round(seconds);
    const days = Math.floor(rounded / 86400);
    const hours = Math.floor((rounded % 86400) / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    const remainingSeconds = rounded % 60;
    const parts = [];
    if (days) parts.push(`${days}日`);
    if (hours) parts.push(`${hours}時間`);
    if (minutes) parts.push(`${minutes}分`);
    if (remainingSeconds || parts.length === 0) parts.push(`${remainingSeconds}秒`);
    return parts.join(' ');
  }

  if (typeof module !== 'undefined') module.exports = { calculateBandwidth, calculateTransferTime, formatDuration, formatNumber };
  if (typeof document === 'undefined') return;

  const elements = ['dataSize', 'dataUnit', 'duration', 'timeUnit'].map((id) => document.getElementById(id));
  const primaryResult = document.getElementById('primaryResult');
  const secondaryResult = document.getElementById('secondaryResult');
  const error = document.getElementById('error');
  const reverseElements = ['reverseDataSize', 'reverseDataUnit', 'bandwidth', 'bandwidthUnit'].map((id) => document.getElementById(id));
  const timePrimaryResult = document.getElementById('timePrimaryResult');
  const timeSecondaryResult = document.getElementById('timeSecondaryResult');
  const timeError = document.getElementById('timeError');
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

  function update() {
    const result = calculateBandwidth(elements[0].value, elements[1].value, elements[2].value, elements[3].value);
    error.hidden = Boolean(result);
    primaryResult.textContent = result ? `${formatNumber(result.megabitsPerSecond)} Mbps` : '— Mbps';
    secondaryResult.textContent = result ? `${formatNumber(result.megabytesPerSecond)} MB/s` : '— MB/s';
  }

  function updateTime() {
    const seconds = calculateTransferTime(reverseElements[0].value, reverseElements[1].value, reverseElements[2].value, reverseElements[3].value);
    timeError.hidden = seconds !== null;
    timePrimaryResult.textContent = seconds !== null ? formatDuration(seconds) : '—';
    timeSecondaryResult.textContent = seconds !== null ? `${formatNumber(seconds)}秒` : '— 秒';
  }

  function selectTab(tab) {
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    document.getElementById('description').textContent = tab.id === 'timeTab'
      ? 'データ容量と帯域幅から、転送にかかる時間を計算します。'
      : 'データ容量と転送時間から、必要な帯域幅を計算します。';
  }

  elements.forEach((element) => element.addEventListener('input', update));
  reverseElements.forEach((element) => element.addEventListener('input', updateTime));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const nextTab = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(nextTab);
      nextTab.focus();
    });
  });
  update();
  updateTime();
}());
