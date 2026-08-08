(function (root) {
  'use strict';

  const CLAUSES = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'];
  const JOIN_RE = /\b(?:(INNER|LEFT|RIGHT)\s+)?JOIN\b/gi;

  function maskNested(sql) {
    let depth = 0, quote = '', out = '';
    for (let i = 0; i < sql.length; i++) {
      const c = sql[i], next = sql[i + 1];
      if (quote) {
        out += ' ';
        if (c === quote && next === quote) { out += ' '; i++; }
        else if (c === quote && sql[i - 1] !== '\\') quote = '';
      } else if (c === "'" || c === '"' || c === '`') { quote = c; out += ' '; }
      else if (c === '(') { depth++; out += ' '; }
      else if (c === ')') { depth = Math.max(0, depth - 1); out += ' '; }
      else out += depth ? ' ' : c;
    }
    return out;
  }

  function splitTopLevel(text, separator) {
    const masked = maskNested(text);
    const parts = []; let start = 0; let match;
    const re = separator instanceof RegExp ? new RegExp(separator.source, separator.flags.includes('g') ? separator.flags : separator.flags + 'g') : /,/g;
    while ((match = re.exec(masked))) { parts.push(text.slice(start, match.index).trim()); start = match.index + match[0].length; }
    parts.push(text.slice(start).trim());
    return parts.filter(Boolean);
  }

  function findClauses(sql) {
    const flat = maskNested(sql), found = [];
    CLAUSES.forEach(name => {
      const m = new RegExp('\\b' + name.replace(' ', '\\s+') + '\\b', 'i').exec(flat);
      if (m) found.push({ name, index: m.index, end: m.index + m[0].length });
    });
    found.sort((a, b) => a.index - b.index);
    const values = {};
    found.forEach((clause, i) => { values[clause.name] = sql.slice(clause.end, found[i + 1]?.index ?? sql.length).trim().replace(/;\s*$/, ''); });
    return values;
  }

  function parseTable(text) {
    const clean = text.trim().replace(/;$/, '');
    const m = clean.match(/^([\w.`"-]+)(?:\s+(?:AS\s+)?([\w`"]+))?/i);
    return m ? { name: unquote(m[1]), alias: m[2] ? unquote(m[2]) : '' } : null;
  }
  function unquote(value) { return value.replace(/^[`"]|[`"]$/g, ''); }

  function parseFrom(text) {
    const masked = maskNested(text); const joins = []; let firstJoin;
    JOIN_RE.lastIndex = 0; firstJoin = JOIN_RE.exec(masked);
    const base = parseTable(text.slice(0, firstJoin?.index ?? text.length));
    JOIN_RE.lastIndex = 0; let m;
    const matches = [];
    while ((m = JOIN_RE.exec(masked))) matches.push({ index: m.index, end: JOIN_RE.lastIndex, type: (m[1] || 'INNER').toUpperCase() });
    matches.forEach((item, i) => {
      const chunk = text.slice(item.end, matches[i + 1]?.index ?? text.length).trim();
      const onMatch = /\bON\b/i.exec(maskNested(chunk));
      const table = parseTable(chunk.slice(0, onMatch?.index ?? chunk.length));
      if (table) joins.push({ type: item.type, table, on: onMatch ? chunk.slice(onMatch.index + onMatch[0].length).trim() : '' });
    });
    return { base, joins };
  }

  function aliasMap(parsed) {
    const map = {};
    [parsed.from.base, ...parsed.from.joins.map(j => j.table)].filter(Boolean).forEach(t => { map[t.alias || t.name] = t.name; });
    return map;
  }
  function expand(value, aliases) { return value.replace(/\b([A-Za-z_]\w*)\./g, (all, a) => (aliases[a] || a) + '.'); }

  function parseSelectItem(item) {
    const aliasMatch = item.match(/\s+AS\s+([\w`"]+)\s*$/i) || item.match(/\s+([\w`"]+)\s*$/);
    let alias = '', expression = item.trim();
    if (aliasMatch && (aliasMatch[0].match(/\s+/g) || []).length && !/[.)]$/.test(aliasMatch[1])) {
      alias = unquote(aliasMatch[1]); expression = item.slice(0, aliasMatch.index).trim();
    }
    const agg = expression.match(/^(COUNT|SUM|AVG|MIN|MAX)\s*\((.*)\)$/i);
    return { expression, alias, aggregate: agg ? agg[1].toUpperCase() : '', argument: agg ? agg[2].trim() : '' };
  }

  function parseSQL(input) {
    const sql = String(input || '').trim();
    if (!sql) throw new Error('SQLを入力してください。');
    const clauses = findClauses(sql);
    if (!clauses.SELECT) throw new Error('SELECT文を入力してください。');
    const from = parseFrom(clauses.FROM || '');
    const parsed = {
      raw: sql, distinct: /^\s*DISTINCT\b/i.test(clauses.SELECT),
      select: splitTopLevel(clauses.SELECT.replace(/^\s*DISTINCT\b/i, ''), /,/g).map(parseSelectItem),
      from, where: splitTopLevel(clauses.WHERE || '', /\b(?:AND|OR)\b/gi),
      group: splitTopLevel(clauses['GROUP BY'] || '', /,/g), having: splitTopLevel(clauses.HAVING || '', /\b(?:AND|OR)\b/gi),
      order: splitTopLevel(clauses['ORDER BY'] || '', /,/g).map(x => { const m = x.match(/\s+(ASC|DESC)\s*$/i); return { expression: m ? x.slice(0, m.index).trim() : x, direction: m ? m[1].toUpperCase() : 'ASC' }; }),
      limit: (clauses.LIMIT || '').match(/^\d+/)?.[0] || '', warnings: []
    };
    if (!clauses.FROM || !from.base) parsed.warnings.push('FROM句を読み取れませんでした。');
    if (/\b(UNION|WITH|OVER|CASE)\b/i.test(maskNested(sql))) parsed.warnings.push('初版の対応範囲外の構文が含まれています。');
    return parsed;
  }

  const aggregateNames = { COUNT: '件数', SUM: '合計', AVG: '平均', MIN: '最小値', MAX: '最大値' };
  function literal(value) { return /^'(.*)'$/.test(value) ? `「${value.slice(1, -1)}」` : value.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function describeCondition(condition, aliases) {
    let c = expand(condition.trim(), aliases);
    let m = c.match(/^(.+?)\s+IS\s+(NOT\s+)?NULL$/i);
    if (m) return `${m[1].trim()} がNULL${m[2] ? 'ではない' : ''}`;
    m = c.match(/^(.+?)\s+(NOT\s+)?LIKE\s+(.+)$/i);
    if (m) return `${m[1].trim()} が ${literal(m[3].trim())} のパターンに${m[2] ? '一致しない' : '一致'}`;
    m = c.match(/^(.+?)\s+(NOT\s+)?IN\s*(\(.+\))$/i);
    if (m) return `${m[1].trim()} が指定された値のいずれかに${m[2] ? '該当しない' : '該当'}`;
    m = c.match(/^(.+?)\s*(>=|<=|!=|<>|=|>|<)\s*(.+)$/);
    if (!m) return c;
    const words = { '=': 'が ', '!=': 'が ', '<>': 'が ', '>': 'が ', '>=': 'が ', '<': 'が ', '<=': 'が ' };
    const suffix = { '=': 'に等しい', '!=': 'と等しくない', '<>': 'と等しくない', '>': 'より大きい', '>=': '以上', '<': 'より小さい', '<=': '以下' };
    const right = literal(m[3].trim());
    return `${m[1].trim()} ${words[m[2]]}${right}${suffix[m[2]]}`;
  }

  function selectLabel(item, aliases) {
    if (item.expression === '*') return 'すべてのカラム';
    if (item.aggregate) return `${aggregateNames[item.aggregate]} ${expand(item.argument, aliases)}${item.alias ? ` → ${item.alias}` : ''}`;
    return `${expand(item.expression, aliases)}${item.alias ? ` → ${item.alias}` : ''}`;
  }
  function orderLabel(item, parsed, aliases) {
    const selected = parsed.select.find(s => s.alias && s.alias.toLowerCase() === item.expression.toLowerCase());
    const subject = selected?.aggregate ? `${aggregateNames[selected.aggregate]}${expand(selected.argument, aliases)}` : expand(item.expression, aliases);
    return `${subject} の${item.direction === 'DESC' ? '大きい順' : '小さい順'}`;
  }

  function explainSQL(parsed) {
    const aliases = aliasMap(parsed), base = parsed.from.base?.name || '対象';
    const tables = [parsed.from.base, ...parsed.from.joins.map(j => j.table)].filter(Boolean);
    let summary = parsed.from.joins.length ? `${tables.map(t => t.name).join(' と ')} を結合し、` : `${base}テーブルから`;
    if (parsed.where.length) summary += '条件に一致するデータを';
    summary += parsed.group.length ? `${parsed.group.map(x => expand(x, aliases)).join('、')}ごとに集計します。` : `取得します。`;
    if (parsed.order.length || parsed.limit) {
      summary = summary.replace(/取得します。$/, '');
      if (parsed.order.length) summary += `${orderLabel(parsed.order[0], parsed, aliases)}に`;
      summary += `${parsed.limit ? `最大${parsed.limit}件` : ''}取得します。`;
    }
    const sections = [];
    sections.push({ title: parsed.select.some(x => x.aggregate) ? '取得・集計' : '取得する項目', icon: '⌘', items: parsed.select.map(x => selectLabel(x, aliases)) });
    sections.push({ title: '使用するテーブル', icon: '▦', items: tables.map(t => `${t.name}${t.alias ? `（${t.alias}）` : ''}`) });
    if (parsed.from.joins.length) sections.push({ title: '結合', icon: '⇄', items: parsed.from.joins.map(j => `${j.type} JOIN：${j.table.name}\n${expand(j.on, aliases)}`), notes: parsed.from.joins.map(j => ({ INNER: '両方のテーブルに一致するデータを結合', LEFT: '左側のテーブルをすべて残して結合', RIGHT: '右側のテーブルをすべて残して結合' }[j.type])).filter(Boolean) });
    if (parsed.where.length) sections.push({ title: '条件', icon: '⌁', items: parsed.where.map(x => describeCondition(x, aliases)) });
    if (parsed.group.length) sections.push({ title: 'グループ', icon: '≡', items: parsed.group.map(x => `${expand(x, aliases)} ごと`) });
    if (parsed.having.length) sections.push({ title: '集計後の条件', icon: '∑', items: parsed.having.map(x => describeCondition(x, aliases).replace(/COUNT\s*\(\*\)/i, '件数')) });
    if (parsed.order.length) sections.push({ title: '並び順', icon: '↕', items: parsed.order.map(x => orderLabel(x, parsed, aliases)) });
    if (parsed.limit) sections.push({ title: '取得件数', icon: '#', items: [`最大${parsed.limit}件`] });
    if (parsed.distinct) sections[0].notes = ['重複する行を除外します。'];
    return { summary, sections, structure: buildStructure(parsed) };
  }

  function buildStructure(p) {
    const lines = ['SELECT' + (p.distinct ? ' DISTINCT' : ''), ...p.select.map(x => `  └ ${x.expression}${x.alias ? ` AS ${x.alias}` : ''}`)];
    if (p.from.base) lines.push('', 'FROM', `  └ ${p.from.base.name}${p.from.base.alias ? ` ${p.from.base.alias}` : ''}`);
    p.from.joins.forEach(j => lines.push('', `${j.type} JOIN`, `  └ ${j.table.name}${j.table.alias ? ` ${j.table.alias}` : ''}`, `     ON ${j.on}`));
    [['WHERE', p.where], ['GROUP BY', p.group], ['HAVING', p.having]].forEach(([name, items]) => { if (items.length) lines.push('', name, ...items.map(x => `  └ ${x}`)); });
    if (p.order.length) lines.push('', 'ORDER BY', ...p.order.map(x => `  └ ${x.expression} ${x.direction}`));
    if (p.limit) lines.push('', 'LIMIT', `  └ ${p.limit}`);
    return lines.join('\n');
  }

  function init() {
    const $ = id => document.getElementById(id), input = $('sqlInput'), results = $('results'), warning = $('errorMessage'); let current = null;
    function analyze() {
      warning.hidden = true;
      try {
        const parsed = parseSQL(input.value); current = explainSQL(parsed); render(current);
        warning.hidden = !parsed.warnings.length;
      } catch (error) { results.hidden = true; warning.hidden = false; warning.querySelector('b').textContent = `⚠ ${error.message}`; warning.querySelector('span').textContent = 'SELECT文を確認して、もう一度お試しください。'; }
    }
    function render(data) {
      $('summaryText').textContent = data.summary; $('structureText').textContent = data.structure;
      $('detailGrid').replaceChildren(...data.sections.map(section => {
        const card = document.createElement('article'); card.className = 'detail-card';
        const header = document.createElement('header'), icon = document.createElement('span'), h3 = document.createElement('h3'); icon.className = 'icon'; icon.textContent = section.icon; h3.textContent = section.title; header.append(icon, h3);
        const ul = document.createElement('ul'); section.items.forEach(item => { const li = document.createElement('li'); li.textContent = item; ul.append(li); }); card.append(header, ul);
        (section.notes || []).forEach(note => { const small = document.createElement('small'); small.textContent = note; card.append(small); }); return card;
      })); results.hidden = false;
    }
    $('analyzeButton').addEventListener('click', analyze);
    $('sampleButton').addEventListener('click', () => { input.value = "SELECT department, COUNT(*) AS user_count, AVG(salary) AS avg_salary\nFROM employees\nWHERE active = true\nGROUP BY department\nHAVING COUNT(*) >= 5\nORDER BY avg_salary DESC;"; input.focus(); });
    $('clearButton').addEventListener('click', () => { input.value = ''; results.hidden = true; warning.hidden = true; input.focus(); });
    $('copyButton').addEventListener('click', async event => { if (!current) return; const text = [current.summary, ...current.sections.map(s => `${s.title}\n${s.items.map(x => `・${x}`).join('\n')}`), `SQLの構造\n${current.structure}`].join('\n\n'); try { await navigator.clipboard.writeText(text); event.currentTarget.textContent = 'コピーしました'; setTimeout(() => event.currentTarget.textContent = '説明をコピー', 1600); } catch (_) { event.currentTarget.textContent = 'コピーできませんでした'; } });
    analyze();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseSQL, explainSQL, describeCondition, buildStructure };
  if (root.document) root.document.addEventListener('DOMContentLoaded', init);
})(typeof window !== 'undefined' ? window : globalThis);
