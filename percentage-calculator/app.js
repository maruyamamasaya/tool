(function () {
  'use strict';

  function normalizeCharacters(value) {
    return String(value ?? '')
      .replace(/[０-９．＋－]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xFEE0))
      .replace(/[−ー]/g, '-')
      .replace(/％/g, '%');
  }

  function parseFlexibleNumber(value) {
    const source = normalizeCharacters(value).trim();
    if (!source) return null;
    const cleaned = source.replace(/[\s,，¥￥円%]/g, '');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return NaN;
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : NaN;
  }

  function calculateChange(beforeValue, afterValue) {
    const before = parseFlexibleNumber(beforeValue);
    const after = parseFlexibleNumber(afterValue);
    if (before === null || after === null) return { error: 'empty' };
    if (!Number.isFinite(before) || !Number.isFinite(after)) return { error: 'invalid' };
    if (before === 0) return { error: 'zero' };
    const multiple = after / before;
    return { before, after, rate: (multiple - 1) * 100, difference: after - before, yearOverYear: multiple * 100, multiple };
  }

  function calculateRatio(wholeValue, partValue) {
    const whole = parseFlexibleNumber(wholeValue);
    const part = parseFlexibleNumber(partValue);
    if (whole === null || part === null) return { error: 'empty' };
    if (!Number.isFinite(whole) || !Number.isFinite(part)) return { error: 'invalid' };
    if (whole === 0) return { error: 'zero' };
    return { whole, part, rate: part / whole * 100 };
  }

  function calculatePercent(baseValue, rateValue) {
    const base = parseFlexibleNumber(baseValue);
    const rate = parseFlexibleNumber(rateValue);
    if (base === null || rate === null) return { error: 'empty' };
    if (!Number.isFinite(base) || !Number.isFinite(rate)) return { error: 'invalid' };
    const amount = base * rate / 100;
    return { base, rate, amount, increased: base + amount, decreased: base - amount };
  }

  function calculateReverse(rateValue, resultValue) {
    const rate = parseFlexibleNumber(rateValue);
    const result = parseFlexibleNumber(resultValue);
    if (rate === null || result === null) return { error: 'empty' };
    if (!Number.isFinite(rate) || !Number.isFinite(result)) return { error: 'invalid' };
    if (rate === -100) return { error: 'zero' };
    return { rate, result, original: result / (1 + rate / 100) };
  }

  function tidy(value) {
    const safeValue = Math.abs(value) < 1e-12 ? 0 : value;
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 6 }).format(safeValue);
  }

  function signed(value, suffix) {
    return `${value > 0 ? '+' : ''}${tidy(value)}${suffix || ''}`;
  }

  if (typeof module !== 'undefined') module.exports = { parseFlexibleNumber, calculateChange, calculateRatio, calculatePercent, calculateReverse, tidy };
  if (typeof document === 'undefined') return;

  const modes = {
    change: { inputs: ['change-before', 'change-after'], calculate: () => calculateChange(value('change-before'), value('change-after')) },
    ratio: { inputs: ['ratio-whole', 'ratio-part'], calculate: () => calculateRatio(value('ratio-whole'), value('ratio-part')) },
    percent: { inputs: ['percent-base', 'percent-rate'], calculate: () => calculatePercent(value('percent-base'), value('percent-rate')) },
    reverse: { inputs: ['reverse-rate', 'reverse-result'], calculate: () => calculateReverse(value('reverse-rate'), value('reverse-result')) }
  };
  let activeMode = 'change';
  let copyText = '';
  const copyButton = document.getElementById('copy');

  function value(id) { return document.getElementById(id).value; }
  function setText(id, text) { document.getElementById(id).textContent = text; }
  function showMessage(mode, error, defaultMessage) {
    const element = document.getElementById(`${mode}-message`);
    const messages = { invalid: '数値として読み取れません。入力内容を確認してください', zero: mode === 'reverse' ? '-100%から元の値を逆算することはできません' : '基準となる値に0は指定できません' };
    element.textContent = error === 'empty' ? defaultMessage : messages[error];
    element.classList.toggle('error', error !== 'empty');
  }
  function primary(id, text, rate) {
    const output = document.getElementById(id);
    output.textContent = text;
    output.classList.toggle('positive', Number.isFinite(rate) && rate > 0);
    output.classList.toggle('negative', Number.isFinite(rate) && rate < 0);
  }

  function renderChange(result) {
    if (result.error) {
      primary('change-primary', '—'); setText('change-diff', '—'); setText('change-yoy', '—'); setText('change-multiple', '—');
      showMessage('change', result.error, '2つの値を入力すると結果が表示されます'); return '';
    }
    const rate = `${signed(result.rate, '%')}`;
    primary('change-primary', rate, result.rate);
    setText('change-diff', signed(result.difference)); setText('change-yoy', `${tidy(result.yearOverYear)}%`); setText('change-multiple', `${tidy(result.multiple)}倍`);
    showMessage('change', null, '入力と同時に自動計算されました');
    return `増減率：${rate}\n差額：${signed(result.difference)}\n前年比：${tidy(result.yearOverYear)}%\n倍率：${tidy(result.multiple)}倍`;
  }
  function renderRatio(result) {
    if (result.error) { primary('ratio-primary', '—'); setText('ratio-sentence', '—'); showMessage('ratio', result.error, '2つの値を入力すると結果が表示されます'); return ''; }
    const rate = `${tidy(result.rate)}%`; const sentence = `${tidy(result.part)}は${tidy(result.whole)}の${rate}`;
    primary('ratio-primary', rate); setText('ratio-sentence', sentence); showMessage('ratio', null, '入力と同時に自動計算されました');
    return `割合：${rate}\n${sentence}`;
  }
  function renderPercent(result) {
    if (result.error) { primary('percent-primary', '—'); setText('percent-up', '—'); setText('percent-down', '—'); showMessage('percent', result.error, '元の値と割合を入力してください'); return ''; }
    primary('percent-primary', tidy(result.amount), result.amount);
    setText('percent-up-label', `${tidy(result.rate)}%増`); setText('percent-down-label', `${tidy(result.rate)}%減`);
    setText('percent-up', tidy(result.increased)); setText('percent-down', tidy(result.decreased)); showMessage('percent', null, '入力と同時に自動計算されました');
    return `${tidy(result.rate)}% = ${tidy(result.amount)}\n${tidy(result.rate)}%増 = ${tidy(result.increased)}\n${tidy(result.rate)}%減 = ${tidy(result.decreased)}`;
  }
  function renderReverse(result) {
    if (result.error) { primary('reverse-primary', '—'); setText('reverse-sentence', '—'); showMessage('reverse', result.error, '増減率と結果を入力してください'); return ''; }
    const sentence = `${signed(result.rate, '%')}後の${tidy(result.result)}から逆算`;
    primary('reverse-primary', tidy(result.original)); setText('reverse-sentence', sentence); showMessage('reverse', null, '入力と同時に自動計算されました');
    return `元の値：${tidy(result.original)}\n${sentence}`;
  }
  const renderers = { change: renderChange, ratio: renderRatio, percent: renderPercent, reverse: renderReverse };
  function update() {
    copyText = renderers[activeMode](modes[activeMode].calculate());
    copyButton.disabled = !copyText;
  }
  function activate(mode, focusPanel) {
    activeMode = mode;
    document.querySelectorAll('.tab').forEach((tab) => { const active = tab.dataset.mode === mode; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    document.querySelectorAll('.panel').forEach((panel) => { const active = panel.dataset.mode === mode; panel.hidden = !active; panel.classList.toggle('is-active', active); });
    update();
    if (focusPanel) document.getElementById(modes[mode].inputs[0]).focus();
  }
  document.querySelectorAll('.tab').forEach((tab, index, tabs) => {
    tab.addEventListener('click', () => activate(tab.dataset.mode, false));
    tab.addEventListener('keydown', (event) => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; tabs[next].focus(); activate(tabs[next].dataset.mode, false); });
  });
  Object.values(modes).flatMap((mode) => mode.inputs).forEach((id) => document.getElementById(id).addEventListener('input', update));
  document.getElementById('reset').addEventListener('click', () => { modes[activeMode].inputs.forEach((id) => { document.getElementById(id).value = ''; }); update(); document.getElementById(modes[activeMode].inputs[0]).focus(); });
  copyButton.addEventListener('click', async () => {
    if (!copyText) return;
    try { await navigator.clipboard.writeText(copyText); copyButton.innerHTML = '<span>✓</span>&nbsp; コピーしました'; setTimeout(() => { copyButton.innerHTML = '<span>▣</span>&nbsp; 結果をコピー'; }, 1600); }
    catch (_) { copyButton.textContent = 'コピーできませんでした'; }
  });
  activate('change', false);
}());
