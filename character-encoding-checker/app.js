"use strict";

const INVISIBLE_NAMES = new Map([
  [0x00a0, "ノーブレークスペース"], [0x00ad, "ソフトハイフン"],
  [0x034f, "結合書記素接合子"], [0x061c, "アラビア文字マーク"],
  [0x200b, "ゼロ幅スペース"], [0x200c, "ゼロ幅非接合子"], [0x200d, "ゼロ幅接合子"],
  [0x200e, "左から右マーク"], [0x200f, "右から左マーク"],
  [0x202a, "左から右埋め込み"], [0x202b, "右から左埋め込み"], [0x202c, "方向書式解除"],
  [0x202d, "左から右上書き"], [0x202e, "右から左上書き"],
  [0x2060, "単語結合子"], [0x2061, "関数適用"], [0x2062, "不可視の乗算記号"],
  [0x2063, "不可視の区切り文字"], [0x2064, "不可視の加算記号"],
  [0x2066, "左から右分離"], [0x2067, "右から左分離"], [0x2068, "先頭強分離"], [0x2069, "方向分離解除"],
  [0xfeff, "ゼロ幅ノーブレークスペース"]
]);

function codePointLabel(codePoint) {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function suspiciousName(character, codePoint) {
  if (codePoint === 0xfffd) return "�（Unicode置換文字）";
  if (codePoint === 0x3000) return "全角スペース";
  if (INVISIBLE_NAMES.has(codePoint)) return INVISIBLE_NAMES.get(codePoint);
  if ((codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)) && ![0x09, 0x0a, 0x0d].includes(codePoint)) return "制御文字";
  if ((codePoint >= 0xe000 && codePoint <= 0xf8ff) || (codePoint >= 0xf0000 && codePoint <= 0xffffd) || (codePoint >= 0x100000 && codePoint <= 0x10fffd)) return "私用領域の文字";
  if ((codePoint >= 0xfdd0 && codePoint <= 0xfdef) || (codePoint & 0xffff) >= 0xfffe) return "Unicode非文字";
  if (character.length === 1 && codePoint >= 0xd800 && codePoint <= 0xdfff) return "不正なサロゲート";
  return null;
}

function analyzeText(value) {
  const text = String(value);
  const characters = [...text];
  const counts = { ascii: 0, hiragana: 0, katakana: 0, kanji: 0, other: 0 };
  const suspicious = [];
  let line = 1;
  let fullWidthSpaces = 0;
  let replacements = 0;

  for (const character of characters) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0x7f) counts.ascii++;
    else if (/\p{Script=Hiragana}/u.test(character)) counts.hiragana++;
    else if (/\p{Script=Katakana}/u.test(character)) counts.katakana++;
    else if (/\p{Script=Han}/u.test(character)) counts.kanji++;
    else counts.other++;

    if (codePoint === 0x3000) fullWidthSpaces++;
    if (codePoint === 0xfffd) replacements++;
    const name = suspiciousName(character, codePoint);
    if (name) suspicious.push({ line, character, name, codePoint: codePointLabel(codePoint) });
    if (character === "\n") line++;
  }

  return {
    total: characters.length,
    counts,
    newlines: (text.match(/\n/g) || []).length,
    fullWidthSpaces,
    replacements,
    suspicious
  };
}

if (typeof document !== "undefined") {
  const input = document.querySelector("#textInput");
  const clearButton = document.querySelector("#clearButton");
  const summaryGrid = document.querySelector("#summaryGrid");
  const composition = document.querySelector("#composition");
  const suspiciousList = document.querySelector("#suspiciousList");
  const suspiciousBadge = document.querySelector("#suspiciousBadge");
  const resultStatus = document.querySelector("#resultStatus");
  const number = (value) => value.toLocaleString("ja-JP");
  const summaryItems = [
    ["総文字数", "total", "文字"], ["改行", "newlines", "件"],
    ["全角スペース", "fullWidthSpaces", "件"], ["置換文字 �", "replacements", "件"],
    ["怪しい文字", "suspiciousCount", "件"]
  ];
  const categoryItems = [
    ["ASCII", "ascii"], ["ひらがな", "hiragana"], ["カタカナ", "katakana"],
    ["漢字", "kanji"], ["その他 Unicode", "other"]
  ];

  function render() {
    const result = analyzeText(input.value);
    const values = { ...result, suspiciousCount: result.suspicious.length };
    clearButton.disabled = result.total === 0;
    resultStatus.textContent = result.total ? `${number(result.total)} 文字を解析しました` : "テキストを入力してください";
    summaryGrid.innerHTML = summaryItems.map(([label, key, unit]) =>
      `<div class="summary-item${["replacements", "suspiciousCount"].includes(key) && values[key] ? " alert" : ""}"><span>${label}</span><strong>${number(values[key])}</strong><small>${unit}</small></div>`
    ).join("");
    composition.innerHTML = categoryItems.map(([label, key]) => {
      const percentage = result.total ? (result.counts[key] / result.total) * 100 : 0;
      return `<div class="composition-row"><span class="composition-label">${label}</span><div class="track"><div class="bar" style="width:${percentage}%"></div></div><span class="composition-value">${number(result.counts[key])} 件・${percentage.toFixed(1)}%</span></div>`;
    }).join("");
    suspiciousBadge.textContent = `${number(result.suspicious.length)} 件`;
    suspiciousList.innerHTML = result.suspicious.length
      ? result.suspicious.map((item) => `<div class="suspicious-row"><span class="line">${number(item.line)} 行目</span><span class="character">${item.name}</span><code>${item.codePoint}</code></div>`).join("")
      : `<div class="empty">${result.total ? "怪しい文字は見つかりませんでした" : "解析すると、ここに該当文字が表示されます"}</div>`;
  }

  input.addEventListener("input", render);
  clearButton.addEventListener("click", () => { input.value = ""; render(); input.focus(); });
  render();
}

if (typeof module !== "undefined") module.exports = { analyzeText, codePointLabel, suspiciousName };
