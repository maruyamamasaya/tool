(function () {
  'use strict';

  const DATA_IN_BYTES = { MB: 1e6, GB: 1e9, TB: 1e12 };
  const TIME_IN_SECONDS = { second: 1, minute: 60, hour: 3600 };

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

  if (typeof module !== 'undefined') module.exports = { calculateBandwidth, formatNumber };
  if (typeof document === 'undefined') return;

  const elements = ['dataSize', 'dataUnit', 'duration', 'timeUnit'].map((id) => document.getElementById(id));
  const primaryResult = document.getElementById('primaryResult');
  const secondaryResult = document.getElementById('secondaryResult');
  const error = document.getElementById('error');

  function update() {
    const result = calculateBandwidth(elements[0].value, elements[1].value, elements[2].value, elements[3].value);
    error.hidden = Boolean(result);
    primaryResult.textContent = result ? `${formatNumber(result.megabitsPerSecond)} Mbps` : '— Mbps';
    secondaryResult.textContent = result ? `${formatNumber(result.megabytesPerSecond)} MB/s` : '— MB/s';
  }

  elements.forEach((element) => element.addEventListener('input', update));
  update();
}());
