"use strict";

const input = document.querySelector("#jsonInput");
const output = document.querySelector("#jsonOutput");
const status = document.querySelector("#status");
const copyButton = document.querySelector("#copyButton");
const inputCount = document.querySelector("#inputCount");
const dropZone = document.querySelector("#dropZone");

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
  status.hidden = false;
}

function locateError(message, source) {
  const match = message.match(/position\s+(\d+)/i);
  if (!match) return message;

  const position = Number(match[1]);
  const beforeError = source.slice(0, position);
  const line = beforeError.split("\n").length;
  const lastLineBreak = beforeError.lastIndexOf("\n");
  const column = position - lastLineBreak;
  return `${message}（${line}行 ${column}列付近）`;
}

function parseInput() {
  const source = input.value.trim();
  if (!source) throw new Error("JSONを入力してください。");
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`JSONの構文に誤りがあります: ${locateError(error.message, source)}`);
  }
}

function run(action) {
  try {
    const value = parseInput();
    if (action !== "validate") {
      const indent = action === "format" ? Number(document.querySelector("#indentSelect").value) : 0;
      output.value = JSON.stringify(value, null, indent);
      copyButton.disabled = false;
    }
    const messages = { format: "JSONを整形しました。", minify: "JSONを圧縮しました。", validate: "構文は正しいJSONです。" };
    showStatus(messages[action]);
  } catch (error) {
    showStatus(error.message, true);
  }
}

document.querySelector("#formatButton").addEventListener("click", () => run("format"));
document.querySelector("#minifyButton").addEventListener("click", () => run("minify"));
document.querySelector("#validateButton").addEventListener("click", () => run("validate"));

document.querySelector("#clearButton").addEventListener("click", () => {
  input.value = "";
  output.value = "";
  status.hidden = true;
  copyButton.disabled = true;
  inputCount.textContent = "0 文字";
  input.focus();
});

input.addEventListener("input", () => {
  inputCount.textContent = `${input.value.length.toLocaleString("ja-JP")} 文字`;
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    showStatus("整形結果をクリップボードにコピーしました。");
  } catch {
    output.select();
    const copied = document.execCommand("copy");
    showStatus(copied ? "整形結果をクリップボードにコピーしました。" : "コピーできませんでした。出力を選択して手動でコピーしてください。", !copied);
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    run("format");
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
});

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
    showStatus("JSONファイル（.json）を選択してください。", true);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    input.value = reader.result;
    input.dispatchEvent(new Event("input"));
    showStatus(`${file.name} を読み込みました。`);
    run("format");
  });
  reader.addEventListener("error", () => showStatus("ファイルを読み込めませんでした。", true));
  reader.readAsText(file);
});
