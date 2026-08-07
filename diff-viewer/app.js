(function () {
  'use strict';
  const MAX_LINES = 1000;

  function splitLines(text) { return text === '' ? [] : text.replace(/\r\n?/g, '\n').split('\n'); }

  function lcsDiff(left, right) {
    const n = left.length, m = right.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const result = []; let i = 0, j = 0, leftNo = 1, rightNo = 1;
    while (i < n || j < m) {
      if (i < n && j < m && left[i] === right[j]) {
        result.push({ type: 'same', left: left[i++], right: right[j++], leftNo: leftNo++, rightNo: rightNo++ });
      } else {
        const removed = [], added = [];
        while ((i < n || j < m) && !(i < n && j < m && left[i] === right[j])) {
          if (j >= m || (i < n && dp[i + 1][j] >= dp[i][j + 1])) removed.push({ text: left[i++], no: leftNo++ });
          else added.push({ text: right[j++], no: rightNo++ });
        }
        result.push(...pairChangeBlock(removed, added));
      }
    }
    return result;
  }

  function lineSimilarity(a, b) {
    if (a === b) return 1;
    const max = Math.max(a.length, b.length); if (!max) return 1;
    let prefix = 0, suffix = 0;
    while (prefix < Math.min(a.length, b.length) && a[prefix] === b[prefix]) prefix++;
    while (suffix < Math.min(a.length, b.length) - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
    const tokensA = new Set(a.match(/[\p{L}\p{N}_]+/gu) || []), tokensB = new Set(b.match(/[\p{L}\p{N}_]+/gu) || []);
    let shared = 0; tokensA.forEach(t => { if (tokensB.has(t)) shared += t.length; });
    return Math.min(1, (prefix + suffix + shared * .5) / max);
  }

  function pairChangeBlock(removed, added) {
    const n = removed.length, m = added.length, gap = .72;
    const dp = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
    for (let i = 1; i <= n; i++) dp[i][0] = i * gap;
    for (let j = 1; j <= m; j++) dp[0][j] = j * gap;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      const sub = 1 - lineSimilarity(removed[i - 1].text, added[j - 1].text);
      dp[i][j] = Math.min(dp[i - 1][j] + gap, dp[i][j - 1] + gap, dp[i - 1][j - 1] + sub);
    }
    const out = []; let i = n, j = m;
    while (i || j) {
      const sub = i && j ? 1 - lineSimilarity(removed[i - 1].text, added[j - 1].text) : Infinity;
      if (i && j && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + sub)) < .001) {
        const l = removed[--i], r = added[--j]; out.push({ type: 'changed', left: l.text, right: r.text, leftNo: l.no, rightNo: r.no });
      } else if (i && (!j || dp[i - 1][j] <= dp[i][j - 1])) { const l = removed[--i]; out.push({ type: 'removed', left: l.text, right: null, leftNo: l.no, rightNo: null }); }
      else { const r = added[--j]; out.push({ type: 'added', left: null, right: r.text, leftNo: null, rightNo: r.no }); }
    }
    return out.reverse();
  }

  function changedRange(a, b) {
    let start = 0, suffix = 0;
    while (start < Math.min(a.length, b.length) && a[start] === b[start]) start++;
    while (suffix < Math.min(a.length, b.length) - start && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
    let leftEnd = a.length - suffix, rightEnd = b.length - suffix;
    const word = /[\p{L}\p{N}_]/u;
    if ((word.test(a[start - 1] || '') && word.test(a[start] || '')) || (word.test(b[start - 1] || '') && word.test(b[start] || '')))
      while (start > 0 && (word.test(a[start - 1] || '') || word.test(b[start - 1] || ''))) start--;
    while (leftEnd < a.length && word.test(a[leftEnd] || '')) leftEnd++;
    while (rightEnd < b.length && word.test(b[rightEnd] || '')) rightEnd++;
    return { start, leftEnd, rightEnd };
  }

  if (typeof module !== 'undefined') module.exports = { splitLines, lcsDiff, changedRange, lineSimilarity };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id), leftInput = $('leftInput'), rightInput = $('rightInput');
  function updateCounts() { $('leftCount').textContent = `${splitLines(leftInput.value).length} 行`; $('rightCount').textContent = `${splitLines(rightInput.value).length} 行`; }
  function appendCode(cell, text, range, side) {
    if (text === null) { cell.classList.add('empty'); return; }
    if (!range) { cell.textContent = text || ' '; return; }
    cell.append(document.createTextNode(text.slice(0, range.start)));
    const mark = document.createElement('mark'); mark.className = side === 'left' ? 'char-removed' : 'char-added';
    mark.textContent = text.slice(range.start, side === 'left' ? range.leftEnd : range.rightEnd) || '\u00a0'; cell.append(mark, document.createTextNode(text.slice(side === 'left' ? range.leftEnd : range.rightEnd) || (text ? '' : ' ')));
  }
  function render(rows) {
    const body = $('diffBody'); body.replaceChildren(); const frag = document.createDocumentFragment(); const counts = { same: 0, changed: 0, removed: 0, added: 0 };
    rows.forEach(row => {
      counts[row.type]++; const tr = document.createElement('tr'); tr.className = `diff-row ${row.type}`;
      const ln = document.createElement('td'), lc = document.createElement('td'), rn = document.createElement('td'), rc = document.createElement('td'), detail = document.createElement('td');
      ln.className = 'line-no left'; lc.className = 'code left'; rn.className = 'line-no right'; rc.className = 'code right'; detail.className = 'detail';
      ln.textContent = row.leftNo ?? '−'; rn.textContent = row.rightNo ?? '−'; const range = row.type === 'changed' ? changedRange(row.left, row.right) : null;
      appendCode(lc, row.left, range, 'left'); appendCode(rc, row.right, range, 'right');
      const labels = { same: '同一', changed: '変更', removed: '削除', added: '追加' }; const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = labels[row.type]; detail.append(badge);
      if (range) detail.append(document.createTextNode(`L ${row.leftNo}行 ${range.start + 1}文字目～ / R ${row.rightNo}行 ${range.start + 1}文字目～`));
      tr.append(ln, lc, rn, rc, detail); frag.append(tr);
    }); body.append(frag);
    $('summary').innerHTML = `<b>${counts.changed + counts.removed + counts.added}</b> 件の差分 ・ 変更 ${counts.changed} / 削除 ${counts.removed} / 追加 ${counts.added}`;
  }
  $('compareButton').addEventListener('click', () => {
    const left = splitLines(leftInput.value), right = splitLines(rightInput.value), warning = $('warning');
    if (left.length > MAX_LINES || right.length > MAX_LINES) { warning.textContent = `1000行を超えています（Left: ${left.length}行 / Right: ${right.length}行）。先頭1000行を比較します。`; warning.hidden = false; } else warning.hidden = true;
    render(lcsDiff(left.slice(0, MAX_LINES), right.slice(0, MAX_LINES))); $('resultSection').hidden = false; $('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('swapButton').addEventListener('click', () => { [leftInput.value, rightInput.value] = [rightInput.value, leftInput.value]; updateCounts(); });
  $('clearButton').addEventListener('click', () => { leftInput.value = rightInput.value = ''; $('resultSection').hidden = true; $('warning').hidden = true; updateCounts(); leftInput.focus(); });
  $('wrapToggle').addEventListener('change', e => { $('diffShell').classList.toggle('wrap', e.target.checked); $('diffShell').classList.toggle('nowrap', !e.target.checked); });
  leftInput.addEventListener('input', updateCounts); rightInput.addEventListener('input', updateCounts); updateCounts();
})();
