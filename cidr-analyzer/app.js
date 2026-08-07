(function () {
  'use strict';

  function ipToNumber(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
    return parts.reduce((value, part) => (value * 256) + Number(part), 0) >>> 0;
  }

  function numberToIp(value) {
    return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
  }

  function parseCidr(line) {
    const value = line.trim();
    const match = value.match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*([^\s]+)$/);
    if (!match) return { error: value.includes('/') ? '解釈不能な行です' : 'CIDRが存在しません' };
    const ipNumber = ipToNumber(match[1]);
    if (ipNumber === null) return { error: 'IPv4アドレスが不正です' };
    if (!/^\d+$/.test(match[2]) || Number(match[2]) < 0 || Number(match[2]) > 32) return { error: 'CIDRは0～32で指定してください' };
    const cidr = Number(match[2]);
    const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
    const network = (ipNumber & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - cidr);
    const usable = cidr === 32 ? 1 : cidr === 31 ? 2 : Math.max(0, total - 2);
    const first = cidr >= 31 ? network : network + 1;
    const last = cidr >= 31 ? broadcast : broadcast - 1;
    return { ip: match[1], ipNumber, cidr, mask, network, broadcast, total, usable, first, last, key: `${numberToIp(network)}/${cidr}` };
  }

  function formatInput(text) {
    return text.replace(/\r/g, '').split('\n').filter((line) => line.trim()).map((line) => {
      const clean = line.replace(/[　\t]+/g, ' ').replace(/／/g, '/').trim();
      const match = clean.match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*(?:\/\s*|\s+)(\d{1,2})$/);
      if (!match || ipToNumber(match[1]) === null || Number(match[2]) > 32) return `解析不能: ${line.trim()}`;
      return `${match[1]}/${Number(match[2])}`;
    }).join('\n');
  }

  function buildHierarchy(items) {
    const networks = [...new Map(items.map((item) => [item.key, { ...item, children: [], ips: [] }])).values()]
      .sort((a, b) => a.cidr - b.cidr || a.network - b.network);
    networks.forEach((node) => {
      const parents = networks.filter((candidate) => candidate !== node && candidate.cidr < node.cidr && node.network >= candidate.network && node.broadcast <= candidate.broadcast);
      node.parent = parents.sort((a, b) => b.cidr - a.cidr)[0] || null;
      if (node.parent) node.parent.children.push(node);
    });
    items.forEach((item) => networks.find((network) => network.key === item.key).ips.push(item.ip));
    return networks.filter((network) => !network.parent);
  }

  if (typeof module !== 'undefined') module.exports = { ipToNumber, numberToIp, parseCidr, formatInput, buildHierarchy };
  if (typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  $('formatButton').addEventListener('click', () => {
    const output = formatInput($('sourceInput').value);
    $('formattedOutput').value = output;
    $('formatCount').textContent = output ? `${output.split('\n').length} 行` : '';
  });
  $('copyButton').addEventListener('click', async () => {
    if (!$('formattedOutput').value) return;
    try { await navigator.clipboard.writeText($('formattedOutput').value); $('copyStatus').textContent = 'コピーしました'; }
    catch (_) { $('formattedOutput').select(); document.execCommand('copy'); $('copyStatus').textContent = 'コピーしました'; }
    setTimeout(() => { $('copyStatus').textContent = ''; }, 1800);
  });
  $('sendButton').addEventListener('click', () => {
    $('analysisInput').value = $('formattedOutput').value.split('\n').filter((line) => !line.startsWith('解析不能:')).join('\n');
    $('analysisInput').focus();
    $('analysisInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function renderTree(nodes) {
    const ul = document.createElement('ul');
    nodes.forEach((node) => {
      const li = document.createElement('li');
      const label = document.createElement('span'); label.className = 'tree-network'; label.textContent = node.key; li.appendChild(label);
      const childNodes = [];
      node.children.forEach((child) => childNodes.push({ type: 'network', value: child }));
      node.ips.forEach((ip) => childNodes.push({ type: 'ip', value: ip }));
      if (childNodes.length) {
        const childUl = document.createElement('ul');
        childNodes.forEach((child) => {
          if (child.type === 'network') childUl.appendChild(renderTree([child.value]).firstChild);
          else { const ipLi = document.createElement('li'); const span = document.createElement('span'); span.className = 'tree-ip'; span.textContent = child.value; ipLi.appendChild(span); childUl.appendChild(ipLi); }
        });
        li.appendChild(childUl);
      }
      ul.appendChild(li);
    });
    return ul;
  }

  $('analyzeButton').addEventListener('click', () => {
    const lines = $('analysisInput').value.replace(/\r/g, '').split('\n').filter((line) => line.trim());
    const valid = [], errors = [];
    lines.forEach((line, index) => { const parsed = parseCidr(line); parsed.error ? errors.push(`行 ${index + 1}「${line.trim()}」: ${parsed.error}`) : valid.push(parsed); });
    $('results').hidden = false;
    $('resultSummary').textContent = `${valid.length} 件成功 / ${errors.length} 件エラー`;
    $('errorBox').hidden = !errors.length;
    $('errorBox').innerHTML = errors.length ? `<strong>入力エラー（${errors.length}件）</strong><ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>` : '';
    $('resultBody').innerHTML = valid.map((item) => `<tr><td>${item.ip}</td><td>/${item.cidr}</td><td>${numberToIp(item.mask)}</td><td>${item.key}</td><td>${numberToIp(item.first)}</td><td>${numberToIp(item.last)}</td><td>${numberToIp(item.broadcast)}</td><td>${item.total.toLocaleString()}</td><td>${item.usable.toLocaleString()}</td></tr>`).join('');
    const groups = [...new Map(valid.map((item) => [item.key, []])).entries()];
    valid.forEach((item) => groups.find(([key]) => key === item.key)[1].push(item.ip));
    $('networkList').innerHTML = groups.length ? groups.map(([key, ips]) => `<div class="network-group"><div class="network-name">${key}</div><div class="ip-chips">${ips.map((ip) => `<span class="ip-chip">${ip}</span>`).join('')}</div></div>`).join('') : '<p class="empty">解析できるネットワークがありません。</p>';
    $('containmentTree').replaceChildren(valid.length ? renderTree(buildHierarchy(valid)) : Object.assign(document.createElement('p'), { className: 'empty', textContent: '解析できるネットワークがありません。' }));
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
}());
