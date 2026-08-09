(function (root) {
  'use strict';

  const TYPE_META = {
    A: { label: 'IPv4 アドレス', placeholder: '192.0.2.1', hint: '例：192.0.2.1' },
    AAAA: { label: 'IPv6 アドレス', placeholder: '2001:db8::1', hint: '例：2001:db8::1' },
    CNAME: { label: '参照先ホスト名', placeholder: 'example.com.', hint: '例：example.com.' },
    MX: { label: 'メールサーバー', placeholder: 'mail.example.com.', hint: '例：mail.example.com.' },
    TXT: { label: 'テキスト', placeholder: 'v=spf1 include:example.com ~all', hint: '引用符は自動で付加されます' }
  };

  function isIPv4(value) {
    const parts = value.split('.');
    return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255);
  }

  function isIPv6(value) {
    if (!/^[0-9a-f:]+$/i.test(value) || !value.includes(':') || value.includes(':::') || (value.match(/::/g) || []).length > 1) return false;
    const parts = value.split(':');
    if (parts.some(part => part.length > 4)) return false;
    return value.includes('::') ? parts.filter(Boolean).length < 8 : parts.length === 8 && parts.every(Boolean);
  }

  function isHostname(value) {
    const name = value.endsWith('.') ? value.slice(0, -1) : value;
    return name.length > 0 && name.length <= 253 && name.split('.').every(label => /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i.test(label));
  }

  function validateRecord(record) {
    if (!record.host.trim()) return 'ホスト名を入力してください。';
    if (!/^(@|\*|(?:_?[a-z0-9-]+)(?:\.(?:_?[a-z0-9-]+))*)$/i.test(record.host.trim())) return 'ホスト名の形式を確認してください。';
    if (!Number.isInteger(record.ttl) || record.ttl < 0) return 'TTLは0以上の整数で入力してください。';
    if (!record.value.trim()) return `${TYPE_META[record.type].label}を入力してください。`;
    if (record.type === 'A' && !isIPv4(record.value.trim())) return '正しいIPv4アドレスを入力してください。';
    if (record.type === 'AAAA' && !isIPv6(record.value.trim())) return '正しいIPv6アドレスを入力してください。';
    if ((record.type === 'CNAME' || record.type === 'MX') && !isHostname(record.value.trim())) return '正しいホスト名を入力してください。';
    if (record.type === 'MX' && (!Number.isInteger(record.priority) || record.priority < 0 || record.priority > 65535)) return '優先度は0〜65535の整数で入力してください。';
    return '';
  }

  const quoteTXT = value => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const absoluteName = value => value === '@' || value.endsWith('.') ? value : `${value}.`;
  function formatRecord(record) {
    const host = record.host.trim();
    let value = record.value.trim();
    if (record.type === 'TXT') value = quoteTXT(value);
    if (record.type === 'CNAME' || record.type === 'MX') value = absoluteName(value);
    const priority = record.type === 'MX' ? `${record.priority} ` : '';
    return `${host}\t${record.ttl}\tIN\t${record.type}\t${priority}${value}`;
  }

  if (typeof module !== 'undefined') module.exports = { isIPv4, isIPv6, isHostname, validateRecord, formatRecord, quoteTXT, escapeHTML };
  if (!root.document) return;

  const $ = selector => document.querySelector(selector);
  let selectedType = 'A';
  let records = [];

  function updateType(type) {
    selectedType = type;
    const meta = TYPE_META[type];
    document.querySelectorAll('#typePicker button').forEach(button => {
      const active = button.dataset.type === type;
      button.classList.toggle('active', active);
      button.setAttribute('aria-checked', String(active));
    });
    $('#valueLabel').innerHTML = `${meta.label} <em>必須</em>`;
    $('#value').placeholder = meta.placeholder;
    $('#value').value = '';
    $('#valueHint').textContent = meta.hint;
    $('#priorityField').hidden = type !== 'MX';
    $('#formError').textContent = '';
  }

  function render() {
    $('#recordCount').textContent = records.length;
    $('#emptyState').hidden = records.length > 0;
    $('#clearButton').disabled = records.length === 0;
    $('#copyButton').disabled = records.length === 0;
    $('#recordList').innerHTML = records.map((record, index) => `<article class="record-card"><span class="type-badge type-${record.type.toLowerCase()}">${record.type}</span><div><b>${escapeHTML(record.host)}</b><code>${escapeHTML(formatRecord(record))}</code></div><button type="button" data-delete="${index}" aria-label="${escapeHTML(record.host)} の ${record.type} レコードを削除">×</button></article>`).join('');
    $('#output').textContent = records.length ? records.map(formatRecord).join('\n') : '; 追加したレコードがここに表示されます';
  }

  $('#typePicker').addEventListener('click', event => {
    const button = event.target.closest('button[data-type]');
    if (button) updateType(button.dataset.type);
  });
  $('#recordForm').addEventListener('submit', event => {
    event.preventDefault();
    const record = { type: selectedType, host: $('#host').value, ttl: Number($('#ttl').value), value: $('#value').value, priority: Number($('#priority').value) };
    const error = validateRecord(record);
    $('#formError').textContent = error;
    if (error) return;
    records.push(record);
    $('#value').value = '';
    render();
    $('#value').focus();
  });
  $('#recordList').addEventListener('click', event => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;
    records.splice(Number(button.dataset.delete), 1);
    render();
  });
  $('#clearButton').addEventListener('click', () => { records = []; render(); });
  $('#copyButton').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(records.map(formatRecord).join('\n'));
      $('#copyStatus').textContent = 'コピーしました';
    } catch (_) { $('#copyStatus').textContent = 'コピーできませんでした'; }
    setTimeout(() => { $('#copyStatus').textContent = ''; }, 2200);
  });
  render();
})(typeof window !== 'undefined' ? window : globalThis);
