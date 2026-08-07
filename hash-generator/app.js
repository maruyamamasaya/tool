"use strict";

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === "function") return btoa(binary);
  return Buffer.from(bytes).toString("base64");
}

async function generateHash(text, algorithm = "SHA-256", format = "hex", cryptoProvider = globalThis.crypto) {
  const supportedAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
  if (!supportedAlgorithms.includes(algorithm)) throw new Error("対応していないアルゴリズムです");
  if (!["hex", "base64"].includes(format)) throw new Error("対応していない出力形式です");
  if (!cryptoProvider?.subtle) throw new Error("この環境ではハッシュを生成できません");

  const data = new TextEncoder().encode(String(text));
  const digest = await cryptoProvider.subtle.digest(algorithm, data);
  const bytes = new Uint8Array(digest);
  return format === "hex" ? bytesToHex(bytes) : bytesToBase64(bytes);
}

if (typeof document !== "undefined") {
  const input = document.querySelector("#inputText");
  const generateButton = document.querySelector("#generateButton");
  const clearButton = document.querySelector("#clearButton");
  const copyButton = document.querySelector("#copyButton");
  const result = document.querySelector("#result");
  const badge = document.querySelector("#resultBadge");
  const characterCount = document.querySelector("#characterCount");
  const byteCount = document.querySelector("#byteCount");
  const toast = document.querySelector("#toast");
  let toastTimer;

  const selectedValue = (name) => document.querySelector(`input[name="${name}"]:checked`).value;

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function updateMeta() {
    const hasText = input.value.length > 0;
    characterCount.textContent = Array.from(input.value).length;
    byteCount.textContent = new TextEncoder().encode(input.value).length;
    generateButton.disabled = !hasText;
    clearButton.disabled = !hasText;
  }

  function updateBadge() {
    badge.textContent = `${selectedValue("algorithm")} · ${selectedValue("format").toUpperCase()}`;
  }

  async function createHash() {
    generateButton.disabled = true;
    generateButton.lastChild.textContent = " 生成中...";
    try {
      result.textContent = await generateHash(input.value, selectedValue("algorithm"), selectedValue("format"));
      result.classList.add("has-result");
      copyButton.disabled = false;
    } catch (error) {
      result.textContent = error.message;
      result.classList.remove("has-result");
      copyButton.disabled = true;
    } finally {
      generateButton.lastChild.textContent = " ハッシュを生成";
      generateButton.disabled = !input.value;
    }
  }

  input.addEventListener("input", updateMeta);
  document.querySelectorAll('input[name="algorithm"], input[name="format"]').forEach((control) => control.addEventListener("change", updateBadge));
  generateButton.addEventListener("click", createHash);
  clearButton.addEventListener("click", () => {
    input.value = "";
    result.textContent = "入力後に生成ボタンを押してください";
    result.classList.remove("has-result");
    copyButton.disabled = true;
    updateMeta();
    input.focus();
  });
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(result.textContent);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(result);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("copy");
      selection.removeAllRanges();
    }
    showToast("ハッシュ値をコピーしました");
  });
}

if (typeof module !== "undefined") module.exports = { bytesToHex, bytesToBase64, generateHash };
