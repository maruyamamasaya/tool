(function () {
  'use strict';

  const MAX_MATCHES = 10000;

  function findMatches(pattern, flags, text, limit = MAX_MATCHES) {
    const expression = new RegExp(pattern, flags);
    const matches = [];

    if (flags.includes('g')) {
      let match;
      while ((match = expression.exec(text)) !== null && matches.length < limit) {
        matches.push(toMatchData(match));
        if (match[0] === '') expression.lastIndex += 1;
      }
    } else {
      const match = expression.exec(text);
      if (match) matches.push(toMatchData(match));
    }
    return { matches, truncated: matches.length === limit };
  }

  function toMatchData(match) {
    return {
      value: match[0],
      index: match.index,
      end: match.index + match[0].length,
      groups: Array.from(match).slice(1)
    };
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[character]);
  }

  function buildHighlight(text, matches) {
    if (!matches.length) return escapeHtml(text);
    let cursor = 0;
    let output = '';
    matches.forEach((match, index) => {
      output += escapeHtml(text.slice(cursor, match.index));
      if (match.value === '') {
        output += `<mark class="empty-match" title="空文字にマッチ" data-number="${index + 1}"></mark>`;
      } else {
        output += `<mark data-number="${index + 1}">${escapeHtml(match.value)}</mark>`;
      }
      cursor = Math.max(cursor, match.end);
    });
    return output + escapeHtml(text.slice(cursor));
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { findMatches, escapeHtml, buildHighlight };
  }

  if (typeof document === 'undefined') return;

  const regexInput = document.querySelector('#regexInput');
  const testInput = document.querySelector('#testInput');
  const flagInputs = [...document.querySelectorAll('input[name="flag"]')];
  const activeFlags = document.querySelector('#activeFlags');
  const regexWrap = document.querySelector('#regexWrap');
  const errorMessage = document.querySelector('#errorMessage');
  const errorDetail = document.querySelector('#errorDetail');
  const matchCount = document.querySelector('#matchCount');
  const highlightOutput = document.querySelector('#highlightOutput');
  const matchList = document.querySelector('#matchList');
  const characterCount = document.querySelector('#characterCount');
  const copyButton = document.querySelector('#copyButton');
  const clearButton = document.querySelector('#clearButton');
  let updateFrame;

  function selectedFlags() {
    return flagInputs.filter(input => input.checked).map(input => input.value).join('');
  }

  function renderMatchList(matches, truncated) {
    matchList.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.innerHTML = '<strong>マッチはありません</strong><span>正規表現またはテスト文字列を変更してください。</span>';
      matchList.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    matches.forEach((match, index) => {
      const item = document.createElement('li');
      item.className = 'match-item';
      const groups = match.groups.map((group, groupIndex) => `
        <div class="group-row"><span>Group ${groupIndex + 1}</span><code>${group === undefined ? '<em>undefined</em>' : escapeHtml(group)}</code></div>`).join('');
      item.innerHTML = `
        <div class="match-number">${index + 1}</div>
        <div class="match-content">
          <div class="match-top"><code>${match.value === '' ? '<em>空文字</em>' : escapeHtml(match.value)}</code><span>位置: ${match.index}</span></div>
          ${groups ? `<div class="groups"><div class="group-row full"><span>Full Match</span><code>${match.value === '' ? '<em>空文字</em>' : escapeHtml(match.value)}</code></div>${groups}</div>` : ''}
        </div>`;
      fragment.append(item);
    });
    if (truncated) {
      const note = document.createElement('li');
      note.className = 'limit-note';
      note.textContent = `表示負荷を抑えるため、先頭 ${MAX_MATCHES.toLocaleString()} 件まで表示しています。`;
      fragment.append(note);
    }
    matchList.append(fragment);
  }

  function update() {
    const pattern = regexInput.value;
    const text = testInput.value;
    const flags = selectedFlags();
    activeFlags.value = flags || '—';
    characterCount.textContent = `${text.length.toLocaleString()} 文字`;

    try {
      const result = findMatches(pattern, flags, text);
      regexWrap.classList.remove('invalid');
      regexInput.setAttribute('aria-invalid', 'false');
      errorMessage.hidden = true;
      matchCount.innerHTML = `${result.matches.length.toLocaleString()} <span>${result.matches.length === 1 ? 'match' : 'matches'}</span>`;
      highlightOutput.innerHTML = buildHighlight(text, result.matches);
      renderMatchList(result.matches, result.truncated);
    } catch (error) {
      regexWrap.classList.add('invalid');
      regexInput.setAttribute('aria-invalid', 'true');
      errorMessage.hidden = false;
      errorDetail.textContent = error instanceof Error ? error.message : String(error);
      matchCount.innerHTML = '— <span>matches</span>';
      highlightOutput.textContent = text;
      matchList.innerHTML = '<li class="empty-state"><strong>結果を表示できません</strong><span>正規表現を修正してください。</span></li>';
    }
  }

  function scheduleUpdate() {
    cancelAnimationFrame(updateFrame);
    updateFrame = requestAnimationFrame(update);
  }

  regexInput.addEventListener('input', scheduleUpdate);
  testInput.addEventListener('input', scheduleUpdate);
  flagInputs.forEach(input => input.addEventListener('change', scheduleUpdate));

  clearButton.addEventListener('click', () => {
    regexInput.value = '';
    testInput.value = '';
    regexInput.focus();
    update();
  });

  copyButton.addEventListener('click', async () => {
    const original = copyButton.textContent;
    try {
      await navigator.clipboard.writeText(regexInput.value);
      copyButton.textContent = 'コピーしました';
    } catch (_) {
      regexInput.select();
      document.execCommand('copy');
      copyButton.textContent = 'コピーしました';
    }
    setTimeout(() => { copyButton.textContent = original; }, 1400);
  });

  update();
})();
