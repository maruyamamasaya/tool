(function () {
  'use strict';

  const FIELD_DEFINITIONS = [
    { name: '分', min: 0, max: 59 }, { name: '時', min: 0, max: 23 },
    { name: '日', min: 1, max: 31 }, { name: '月', min: 1, max: 12 },
    { name: '曜日', min: 0, max: 6 }
  ];
  const WEEKDAYS = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

  function validatePart(part, definition) {
    if (part === '*') return;
    const step = part.match(/^\*\/(\d+)$/);
    if (step) {
      const value = Number(step[1]);
      if (value < 1 || value > definition.max - definition.min + 1) throw new Error(`${definition.name}の間隔には1〜${definition.max - definition.min + 1}を指定してください`);
      return;
    }
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Number(range[1]); const end = Number(range[2]);
      validateNumber(start, definition); validateNumber(end, definition);
      if (start > end) throw new Error(`${definition.name}の範囲は小さい値から指定してください`);
      return;
    }
    if (/^\d+$/.test(part)) { validateNumber(Number(part), definition); return; }
    throw new Error(`${definition.name}に使用できない記号が含まれています`);
  }

  function validateNumber(value, definition) {
    if (value < definition.min || value > definition.max) throw new Error(`${definition.name}には${definition.min}〜${definition.max}を指定してください`);
  }

  function parseCron(input) {
    const trimmed = input.trim();
    if (!trimmed) throw new Error('Cron式を入力してください');
    const fields = trimmed.split(/\s+/);
    if (fields.length !== 5) throw new Error(`フィールドは5つ必要です（現在 ${fields.length}個）`);
    fields.forEach((field, index) => {
      if (field.split(',').some(part => part === '')) throw new Error(`${FIELD_DEFINITIONS[index].name}のリスト指定が正しくありません`);
      field.split(',').forEach(part => validatePart(part, FIELD_DEFINITIONS[index]));
    });
    return fields;
  }

  function values(field) { return field.split(',').map(Number); }
  function isFixed(field) { return /^\d+(,\d+)*$/.test(field); }
  function times(minute, hour) {
    if (!isFixed(minute) || !isFixed(hour)) return null;
    const minutes = values(minute); const hours = values(hour); const output = [];
    hours.forEach(h => minutes.forEach(m => output.push(`${h}:${String(m).padStart(2, '0')}`)));
    return output.join('、');
  }
  function weekdayText(field) {
    if (field === '1-5') return '平日';
    if (isFixed(field)) return values(field).map(value => WEEKDAYS[value]).join('・');
    if (/^\d+-\d+$/.test(field)) { const [a, b] = field.split('-').map(Number); return `${WEEKDAYS[a]}から${WEEKDAYS[b]}`; }
    return describeField(field, '曜日');
  }
  function describeField(field, unit) {
    if (field === '*') return `すべての${unit}`;
    const step = field.match(/^\*\/(\d+)$/); if (step) return `${step[1]}${unit}ごと`;
    return field.split(',').map(part => part.includes('-') ? part.replace('-', '〜') : part).join('・') + unit;
  }

  function describeCron(fields) {
    const [minute, hour, day, month, weekday] = fields;
    const time = times(minute, hour);
    if (day === '*' && month === '*' && weekday === '*') {
      if (/^\*\/\d+$/.test(minute) && hour === '*') return `${minute.slice(2)}分ごとに実行`;
      if (time) return `毎日 ${time} に実行`;
    }
    let schedule;
    if (day === '*' && month === '*' && weekday !== '*') schedule = weekday === '1-5' ? '平日の毎日' : `毎週${weekdayText(weekday)}`;
    else if (day !== '*' && month === '*' && weekday === '*') schedule = `毎月${describeField(day, '日')}`;
    else {
      const parts = [];
      if (month !== '*') parts.push(`${describeField(month, '月')}`);
      if (day !== '*') parts.push(`${describeField(day, '日')}`);
      if (weekday !== '*') parts.push(weekdayText(weekday));
      schedule = parts.join('・') || '毎日';
    }
    if (time) return `${schedule} ${time} に実行`;
    const detail = [describeField(minute, '分'), describeField(hour, '時')].join('、');
    return `${schedule}の ${detail}に実行`;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { parseCron, describeCron };
  if (typeof document === 'undefined') return;

  const input = document.querySelector('#cronInput'); const wrap = document.querySelector('#inputWrap');
  const error = document.querySelector('#errorMessage'); const description = document.querySelector('#description');
  const copyDescription = document.querySelector('#copyDescriptionButton');
  const guideIds = ['guideMinute','guideHour','guideDay','guideMonth','guideWeekday'];
  const detailIds = ['detailMinute','detailHour','detailDay','detailMonth','detailWeekday'];
  let currentFields = [];

  function render() {
    try {
      currentFields = parseCron(input.value); const text = describeCron(currentFields);
      currentFields.forEach((field, index) => { document.querySelector(`#${guideIds[index]}`).textContent = field; document.querySelector(`#${detailIds[index]}`).textContent = field; });
      description.textContent = text; wrap.classList.remove('invalid'); input.setAttribute('aria-invalid', 'false'); error.hidden = true; copyDescription.disabled = false;
    } catch (reason) {
      const looseFields = input.value.trim().split(/\s+/).filter(Boolean);
      guideIds.forEach((id, index) => { document.querySelector(`#${id}`).textContent = looseFields[index] || '—'; });
      description.textContent = '式を確認してください'; wrap.classList.add('invalid'); input.setAttribute('aria-invalid', 'true'); error.textContent = `⚠ ${reason.message}`; error.hidden = false; copyDescription.disabled = true;
    }
  }
  async function copyText(text, button) {
    const original = button.textContent;
    try { await navigator.clipboard.writeText(text); } catch (_) { const area=document.createElement('textarea'); area.value=text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
    button.textContent = 'コピーしました'; setTimeout(() => { button.textContent = original; }, 1400);
  }
  input.addEventListener('input', render);
  document.querySelector('#clearButton').addEventListener('click', () => { input.value=''; render(); input.focus(); });
  document.querySelector('#copyCronButton').addEventListener('click', event => copyText(input.value.trim(), event.currentTarget));
  copyDescription.addEventListener('click', event => copyText(description.textContent, event.currentTarget));
  render();
})();
