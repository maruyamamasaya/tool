(function () {
  'use strict';

  const ERROR_MESSAGE = '式を確認してください。';

  function tokenize(source) {
    const normalized = source.replace(/[×✕]/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    const tokens = [];
    let index = 0;

    while (index < normalized.length) {
      const character = normalized[index];
      if (/\s/.test(character)) {
        index += 1;
        continue;
      }
      if ('+-*/()'.includes(character)) {
        tokens.push(character);
        index += 1;
        continue;
      }
      const number = normalized.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!number) throw new Error(ERROR_MESSAGE);
      tokens.push(Number(number[0]));
      index += number[0].length;
    }
    return tokens;
  }

  function calculate(expression) {
    if (typeof expression !== 'string' || !expression.trim()) throw new Error(ERROR_MESSAGE);
    const tokens = tokenize(expression);
    let position = 0;

    function parsePrimary() {
      const token = tokens[position];
      if (token === '+' || token === '-') {
        position += 1;
        const value = parsePrimary();
        return token === '-' ? -value : value;
      }
      if (token === '(') {
        position += 1;
        const value = parseExpression();
        if (tokens[position] !== ')') throw new Error(ERROR_MESSAGE);
        position += 1;
        return value;
      }
      if (typeof token !== 'number' || !Number.isFinite(token)) throw new Error(ERROR_MESSAGE);
      position += 1;
      return token;
    }

    function parseTerm() {
      let value = parsePrimary();
      while (tokens[position] === '*' || tokens[position] === '/') {
        const operator = tokens[position];
        position += 1;
        const right = parsePrimary();
        if (operator === '/' && right === 0) throw new Error('0で割ることはできません。');
        value = operator === '*' ? value * right : value / right;
      }
      return value;
    }

    function parseExpression() {
      let value = parseTerm();
      while (tokens[position] === '+' || tokens[position] === '-') {
        const operator = tokens[position];
        position += 1;
        const right = parseTerm();
        value = operator === '+' ? value + right : value - right;
      }
      return value;
    }

    const result = parseExpression();
    if (position !== tokens.length || !Number.isFinite(result)) throw new Error(ERROR_MESSAGE);
    return Object.is(result, -0) ? 0 : result;
  }

  function formatNumber(value) {
    const rounded = Number.parseFloat(value.toPrecision(15));
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 15 }).format(rounded);
  }

  if (typeof module !== 'undefined') module.exports = { calculate, formatNumber, tokenize };
  if (typeof document === 'undefined') return;

  const form = document.getElementById('calculatorForm');
  const input = document.getElementById('expression');
  const result = document.getElementById('result');
  const error = document.getElementById('errorMessage');
  const historyList = document.getElementById('historyList');
  const emptyHistory = document.getElementById('emptyHistory');
  const clearHistory = document.getElementById('clearHistory');

  function updateHistoryState() {
    const isEmpty = historyList.children.length === 0;
    emptyHistory.hidden = !isEmpty;
    clearHistory.hidden = isEmpty;
  }

  function showCopyFeedback(button, copied) {
    button.textContent = copied ? 'コピー済み' : 'コピー失敗';
    window.setTimeout(() => { button.textContent = 'コピー'; }, 1200);
  }

  async function copyHistory(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      showCopyFeedback(button, true);
    } catch (_) {
      showCopyFeedback(button, false);
    }
  }

  function addHistory(expression, formattedResult) {
    const item = document.createElement('li');
    const calculation = document.createElement('span');
    const button = document.createElement('button');
    calculation.className = 'history-calculation';
    calculation.textContent = `${expression}  →  ${formattedResult}`;
    button.type = 'button';
    button.className = 'copy-button';
    button.textContent = 'コピー';
    button.setAttribute('aria-label', `${expression} の計算結果をコピー`);
    button.addEventListener('click', () => copyHistory(calculation.textContent, button));
    item.append(calculation, button);
    historyList.prepend(item);
    updateHistoryState();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.hidden = true;
    input.removeAttribute('aria-invalid');
    try {
      const value = calculate(input.value);
      const formatted = formatNumber(value);
      result.textContent = formatted;
      addHistory(input.value.trim(), formatted);
    } catch (calculationError) {
      result.textContent = '—';
      error.textContent = calculationError.message || ERROR_MESSAGE;
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    }
  });

  clearHistory.addEventListener('click', () => {
    historyList.replaceChildren();
    updateHistoryState();
  });

  updateHistoryState();
}());
