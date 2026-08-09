(function () {
  "use strict";

  const pools = {
    jaSubjects: ["新しいプロジェクトは", "私たちのチームは", "朝の静かなオフィスでは", "このサービスは", "週末の図書館では", "季節の変化とともに"],
    jaMiddles: ["小さな発見を重ねながら", "利用者の声を丁寧に集めて", "分かりやすさを大切にしながら", "柔軟なアイデアを取り入れて", "穏やかな時間の中で", "次の目標に向かって"],
    jaEnds: ["少しずつ前へ進んでいます。", "より良い方法を考えています。", "日々の暮らしを支えています。", "新しい可能性を広げていきます。", "確かな成果につながりました。"],
    enSubjects: ["Our creative team", "The new service", "A quiet morning", "This simple project", "People in the community", "Every small idea"],
    enVerbs: ["brings useful ideas together", "creates a better experience", "continues to grow every day", "helps us discover new possibilities", "turns careful planning into progress"],
    enEnds: ["with confidence.", "for everyone.", "one step at a time.", "in a clear and thoughtful way.", "for the future."],
    words: ["aurora", "canvas", "delta", "forest", "harbor", "lumen", "maple", "orbit", "pixel", "river", "studio", "violet"],
    domains: ["example.com", "sample.net", "test.local"],
    extensions: ["txt", "csv", "json", "log", "md", "png"]
  };
  const chars = {
    alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    number: "0123456789",
    alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    symbols: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*+-_=?."
  };

  const pick = (items, random = Math.random) => items[Math.floor(random() * items.length)];
  const randomChars = (pool, length, random = Math.random) => Array.from({ length }, () => pool[Math.floor(random() * pool.length)]).join("");
  const clampInteger = (value, min, max) => Math.min(max, Math.max(min, Math.floor(Number(value) || min)));

  function fitLength(value, length, filler, random) {
    let result = value;
    while (result.length < length) result += filler(random);
    return result.slice(0, length);
  }

  function sentence(language, random = Math.random) {
    if (language === "ja") return `${pick(pools.jaSubjects, random)}${pick(pools.jaMiddles, random)}、${pick(pools.jaEnds, random)}`;
    return `${pick(pools.enSubjects, random)} ${pick(pools.enVerbs, random)} ${pick(pools.enEnds, random)}`;
  }

  function structured(type, random) {
    const word = () => pick(pools.words, random);
    if (type === "uuid") return `${randomChars("0123456789abcdef", 8, random)}-${randomChars("0123456789abcdef", 4, random)}-4${randomChars("0123456789abcdef", 3, random)}-${pick("89ab", random)}${randomChars("0123456789abcdef", 3, random)}-${randomChars("0123456789abcdef", 12, random)}`;
    if (type === "email") return `${word()}.${randomChars("abcdefghijklmnopqrstuvwxyz0123456789", 5, random)}@${pick(pools.domains, random)}`;
    if (type === "url") return `https://${pick(pools.domains, random)}/${word()}/${randomChars(chars.alphanumeric, 6, random)}`;
    if (type === "ip") return Array.from({ length: 4 }, () => Math.floor(random() * 256)).join(".");
    return `${word()}_${new Date().getFullYear()}_${randomChars("0123456789", 4, random)}.${pick(pools.extensions, random)}`;
  }

  function generateItem(type, length, random = Math.random) {
    if (type === "ja" || type === "en") {
      return fitLength("", length, () => sentence(type, random), random);
    }
    if (chars[type]) return randomChars(chars[type], length, random);
    return fitLength(structured(type, random), length, () => `-${structured(type, random)}`, random);
  }

  function generateText(options, random = Math.random) {
    const length = clampInteger(options.length, 1, 10000);
    const lines = clampInteger(options.lines, 1, 1000);
    const separators = { newline: "\n", comma: ",", space: " ", tab: "\t" };
    const separator = separators[options.separator] ?? "\n";
    return Array.from({ length: lines }, () => generateItem(options.type, length, random)).join(separator);
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { clampInteger, generateItem, generateText, sentence };
  if (typeof document === "undefined") return;

  const byId = (id) => document.getElementById(id);
  const elements = { type: byId("type"), length: byId("length"), lines: byId("lines"), separator: byId("separator"), customLength: byId("customLength"), customLines: byId("customLines"), output: byId("output"), meta: byId("meta"), toast: byId("toast") };
  function toggleCustom(select, fieldId) { byId(fieldId).hidden = select.value !== "custom"; }
  elements.length.addEventListener("change", () => toggleCustom(elements.length, "customLengthField"));
  elements.lines.addEventListener("change", () => toggleCustom(elements.lines, "customLinesField"));

  function currentOptions() {
    return {
      type: elements.type.value,
      length: elements.length.value === "custom" ? elements.customLength.value : elements.length.value,
      lines: elements.lines.value === "custom" ? elements.customLines.value : elements.lines.value,
      separator: elements.separator.value
    };
  }
  function render() {
    const options = currentOptions();
    elements.output.value = generateText(options);
    const lines = clampInteger(options.lines, 1, 1000);
    const perLine = clampInteger(options.length, 1, 10000);
    elements.meta.textContent = `${lines.toLocaleString()}件・各${perLine.toLocaleString()}文字 / 合計${elements.output.value.length.toLocaleString()}文字`;
  }
  function showToast(message) {
    elements.toast.textContent = message; elements.toast.hidden = false;
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 1800);
  }
  byId("generate").addEventListener("click", render);
  byId("regenerate").addEventListener("click", render);
  byId("clear").addEventListener("click", () => { elements.output.value = ""; elements.meta.textContent = "未生成"; elements.output.focus(); });
  byId("copy").addEventListener("click", async () => {
    if (!elements.output.value) { showToast("コピーするテキストがありません"); return; }
    try { await navigator.clipboard.writeText(elements.output.value); }
    catch (_) { elements.output.select(); document.execCommand("copy"); }
    showToast("全文をコピーしました");
  });
})();
