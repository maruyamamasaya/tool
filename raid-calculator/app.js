(function () {
  'use strict';

  const RAID = {
    '0': { min: 2, usable: (count) => count, faults: '0台', note: '全ディスクを使用します。冗長性はありません。' },
    '1': { min: 2, usable: () => 1, faults: '1台以上', note: '同じデータをすべてのディスクに複製します。' },
    '5': { min: 3, usable: (count) => count - 1, faults: '1台', note: 'パリティ用にディスク1台分を使用します。' },
    '6': { min: 4, usable: (count) => count - 2, faults: '2台', note: '二重パリティ用にディスク2台分を使用します。' },
    '10': { min: 4, even: true, usable: (count) => count / 2, faults: '各ペア1台', note: 'ミラーリングしたディスクをストライピングします。' }
  };

  function calculateRaid(level, count, size) {
    const config = RAID[String(level)];
    if (!config) return { error: 'RAIDレベルを選択してください。' };
    if (!Number.isInteger(count) || count < config.min) return { error: `RAID ${level}には${config.min}台以上のディスクが必要です。` };
    if (config.even && count % 2 !== 0) return { error: `RAID ${level}のディスク台数は偶数にしてください。` };
    if (!Number.isFinite(size) || size <= 0) return { error: 'ディスク容量は0より大きい数値を入力してください。' };
    const raw = count * size;
    const usable = config.usable(count) * size;
    return { raw, usable, efficiency: usable / raw * 100, faults: config.faults, note: config.note };
  }

  function formatCapacity(value, unit) {
    return `${Number(value.toFixed(2)).toLocaleString('ja-JP')} ${unit}`;
  }

  if (typeof module !== 'undefined') module.exports = { calculateRaid, formatCapacity };
  if (typeof document === 'undefined') return;

  const ids = ['raidLevel', 'diskCount', 'diskSize', 'unit'];
  const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  function update() {
    const result = calculateRaid(elements.raidLevel.value, Number(elements.diskCount.value), Number(elements.diskSize.value));
    const error = document.getElementById('error');
    error.hidden = !result.error;
    error.textContent = result.error || '';
    if (result.error) return;
    document.getElementById('usableCapacity').textContent = formatCapacity(result.usable, elements.unit.value);
    document.getElementById('rawCapacity').textContent = formatCapacity(result.raw, elements.unit.value);
    document.getElementById('efficiency').textContent = `${Number(result.efficiency.toFixed(1))}%`;
    document.getElementById('faultTolerance').textContent = result.faults;
    document.getElementById('note').textContent = result.note;
    document.getElementById('usableBar').style.width = `${result.efficiency}%`;
  }
  ids.forEach((id) => elements[id].addEventListener('input', update));
  update();
}());
