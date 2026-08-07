"use strict";

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(String(text));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value) {
  const normalized = String(value).replace(/\s/g, "");
  if (!normalized) return "";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
    throw new Error("Base64の形式が正しくありません");
  }

  let binary;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error("Base64の形式が正しくありません");
  }

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("UTF-8のテキストとして復元できません");
  }
}

if (typeof document !== "undefined") {
  const input = document.querySelector("#input");
  const output = document.querySelector("#output");
  const encodeButton = document.querySelector("#encodeButton");
  const decodeButton = document.querySelector("#decodeButton");
  const copyButton = document.querySelector("#copyButton");
  const clearButton = document.querySelector("#clearButton");
  const status = document.querySelector("#status");
  let statusTimer;

  function setStatus(message, isError = false) {
    clearTimeout(statusTimer);
    status.textContent = message;
    status.classList.toggle("error", isError);
    if (message && !isError) statusTimer = setTimeout(() => setStatus(""), 1800);
  }

  function updateButtons() {
    const hasInput = input.value.length > 0;
    encodeButton.disabled = !hasInput;
    decodeButton.disabled = !hasInput;
    clearButton.disabled = !hasInput && !output.value;
    copyButton.disabled = !output.value;
  }

  function convert(converter) {
    try {
      output.value = converter(input.value);
      setStatus("変換しました");
    } catch (error) {
      output.value = "";
      setStatus(error.message, true);
    }
    updateButtons();
  }

  input.addEventListener("input", () => {
    setStatus("");
    updateButtons();
  });
  encodeButton.addEventListener("click", () => convert(encodeBase64));
  decodeButton.addEventListener("click", () => convert(decodeBase64));

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.value);
    } catch {
      output.select();
      document.execCommand("copy");
      input.focus();
    }
    setStatus("コピーしました");
  });

  clearButton.addEventListener("click", () => {
    input.value = "";
    output.value = "";
    setStatus("");
    updateButtons();
    input.focus();
  });

  updateButtons();
}

if (typeof module !== "undefined") module.exports = { encodeBase64, decodeBase64 };
