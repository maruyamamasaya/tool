"use strict";

function cleanText(text) {
  return String(text)
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b\ufeff]/g, "");
}

if (typeof document !== "undefined") {
  const textInput = document.querySelector("#textInput");
  const count = document.querySelector("#count");
  const copyButton = document.querySelector("#copyButton");
  const clearButton = document.querySelector("#clearButton");
  const status = document.querySelector("#status");
  let statusTimer;

  function update() {
    const hasText = textInput.value.length > 0;
    count.textContent = `${[...textInput.value].length.toLocaleString("ja-JP")} 文字`;
    copyButton.disabled = !hasText;
    clearButton.disabled = !hasText;
    status.textContent = "";
  }

  textInput.addEventListener("paste", (event) => {
    const plainText = event.clipboardData?.getData("text/plain");
    if (plainText === undefined) return;

    event.preventDefault();
    const start = textInput.selectionStart;
    const end = textInput.selectionEnd;
    textInput.setRangeText(cleanText(plainText), start, end, "end");
    update();
  });

  textInput.addEventListener("input", () => {
    const start = textInput.selectionStart;
    const cleaned = cleanText(textInput.value);
    if (cleaned !== textInput.value) {
      textInput.value = cleaned;
      textInput.setSelectionRange(start, start);
    }
    update();
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(textInput.value);
    } catch {
      textInput.select();
      document.execCommand("copy");
      textInput.setSelectionRange(textInput.value.length, textInput.value.length);
    }
    clearTimeout(statusTimer);
    status.textContent = "コピーしました";
    statusTimer = setTimeout(() => { status.textContent = ""; }, 1800);
  });

  clearButton.addEventListener("click", () => {
    textInput.value = "";
    update();
    textInput.focus();
  });

  update();
}

if (typeof module !== "undefined") module.exports = { cleanText };
