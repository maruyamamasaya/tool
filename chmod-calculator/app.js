(function () {
  'use strict';

  const groups = [
    { key: 'owner', title: '所有者', subtitle: 'Owner / User' },
    { key: 'group', title: 'グループ', subtitle: 'Group' },
    { key: 'other', title: 'その他', subtitle: 'Others' }
  ];
  const permissions = [
    { key: 'read', symbol: 'r', value: 4, label: '読み取り' },
    { key: 'write', symbol: 'w', value: 2, label: '書き込み' },
    { key: 'execute', symbol: 'x', value: 1, label: '実行' }
  ];

  function digitToSymbols(digit) {
    return permissions.map((item) => digit & item.value ? item.symbol : '-').join('');
  }

  function parsePermission(value) {
    const input = String(value || '').trim();
    let special = 0;
    let digits;
    if (/^[0-7]{3,4}$/.test(input)) {
      const normalized = input.length === 3 ? `0${input}` : input;
      special = Number(normalized[0]);
      digits = normalized.slice(1).split('').map(Number);
    } else if (/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(input)) {
      digits = [0, 1, 2].map((groupIndex) => {
        const part = input.slice(groupIndex * 3, groupIndex * 3 + 3);
        return (part[0] === 'r' ? 4 : 0) + (part[1] === 'w' ? 2 : 0) + (/[xst]/.test(part[2]) ? 1 : 0);
      });
      if (/[sS]/.test(input[2])) special += 4;
      if (/[sS]/.test(input[5])) special += 2;
      if (/[tT]/.test(input[8])) special += 1;
    } else {
      return { error: '「755」「0755」「rwxr-xr-x」のように入力してください。' };
    }
    let symbolic = digits.map(digitToSymbols).join('');
    if (special & 4) symbolic = `${symbolic.slice(0, 2)}${digits[0] & 1 ? 's' : 'S'}${symbolic.slice(3)}`;
    if (special & 2) symbolic = `${symbolic.slice(0, 5)}${digits[1] & 1 ? 's' : 'S'}${symbolic.slice(6)}`;
    if (special & 1) symbolic = `${symbolic.slice(0, 8)}${digits[2] & 1 ? 't' : 'T'}`;
    return { special, digits, octal: `${special ? special : ''}${digits.join('')}`, symbolic };
  }

  function describeGroup(digit) {
    const allowed = permissions.filter((item) => digit & item.value).map((item) => item.label);
    return allowed.length ? `${allowed.join('・')}ができます` : 'すべての操作ができません';
  }

  function summarize(result) {
    return groups.map((group, index) => `${group.title}は${describeGroup(result.digits[index]).replace('ができます', '可能')}`).join('、') + 'です。';
  }

  if (typeof module !== 'undefined') module.exports = { digitToSymbols, parsePermission, describeGroup, summarize };
  if (typeof document === 'undefined') return;

  const checkerGrid = document.getElementById('checker-grid');
  const generatorGrid = document.getElementById('generator-grid');
  let checkerCommand = '';

  groups.forEach((group, groupIndex) => {
    const generatorGroup = document.createElement('fieldset');
    generatorGroup.innerHTML = `<legend>${group.title}<small>${group.subtitle}</small></legend>${permissions.map((permission) => `<label><input type="checkbox" data-group="${groupIndex}" data-value="${permission.value}" ${permission.value === 4 || (groupIndex === 0 && permission.value === 2) ? 'checked' : ''}><span><b>${permission.symbol}</b>${permission.label}</span></label>`).join('')}`;
    generatorGrid.appendChild(generatorGroup);
  });

  function renderChecker() {
    const result = parsePermission(document.getElementById('permission-input').value);
    const error = document.getElementById('checker-error');
    const output = document.getElementById('checker-result');
    if (result.error) {
      error.textContent = result.error; error.hidden = false; output.hidden = true; checkerCommand = ''; return;
    }
    error.hidden = true; output.hidden = false;
    document.getElementById('checker-octal').textContent = result.octal;
    document.getElementById('checker-symbolic').textContent = result.symbolic;
    document.getElementById('checker-summary').textContent = summarize(result);
    checkerGrid.innerHTML = groups.map((group, index) => `<article><header><div><h3>${group.title}</h3><span>${group.subtitle}</span></div><b>${result.digits[index]}</b></header><div class="permission-list">${permissions.map((permission) => { const enabled = Boolean(result.digits[index] & permission.value); return `<div class="${enabled ? 'enabled' : ''}"><i>${enabled ? '✓' : '—'}</i><span>${permission.label}<small>${permission.symbol} · ${permission.value}</small></span></div>`; }).join('')}</div><p>${describeGroup(result.digits[index])}</p></article>`).join('');
    checkerCommand = `chmod ${result.octal} filename`;
  }

  function renderGenerator() {
    const digits = groups.map((_, groupIndex) => [...document.querySelectorAll(`[data-group="${groupIndex}"]:checked`)].reduce((total, input) => total + Number(input.dataset.value), 0));
    const special = [...document.querySelectorAll('[data-special]:checked')].reduce((total, input) => total + Number(input.dataset.special), 0);
    const result = parsePermission(`${special}${digits.join('')}`);
    document.getElementById('generator-octal').textContent = result.octal;
    document.getElementById('generator-symbolic').textContent = result.symbolic;
    document.getElementById('generator-summary').textContent = summarize(result);
    document.getElementById('generator-command').textContent = `chmod ${result.octal} filename`;
  }

  async function copy(button, text) {
    try {
      await navigator.clipboard.writeText(text);
      const original = button.textContent; button.textContent = '✓ コピーしました';
      setTimeout(() => { button.textContent = original; }, 1500);
    } catch (_) { button.textContent = 'コピーできませんでした'; }
  }

  document.getElementById('permission-input').addEventListener('input', renderChecker);
  document.getElementById('clear-checker').addEventListener('click', () => { const input = document.getElementById('permission-input'); input.value = ''; input.focus(); renderChecker(); });
  generatorGrid.addEventListener('change', renderGenerator);
  document.querySelector('.special-options').addEventListener('change', renderGenerator);
  document.getElementById('copy-checker').addEventListener('click', (event) => copy(event.currentTarget, checkerCommand));
  document.getElementById('copy-generator').addEventListener('click', (event) => copy(event.currentTarget, document.getElementById('generator-command').textContent));
  document.querySelectorAll('.tab').forEach((tab, index, tabs) => {
    tab.addEventListener('click', () => activate(tab.dataset.tab));
    tab.addEventListener('keydown', (event) => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; activate(next.dataset.tab); next.focus(); });
  });
  function activate(id) {
    document.querySelectorAll('.tab').forEach((tab) => { const active = tab.dataset.tab === id; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', active); tab.tabIndex = active ? 0 : -1; });
    document.querySelectorAll('.panel').forEach((panel) => { panel.hidden = panel.id !== id; });
  }
  renderChecker(); renderGenerator();
}());
