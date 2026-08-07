(function () {
  "use strict";
  if (typeof document === "undefined") return;

  const input = document.querySelector("#urlInput");
  const count = document.querySelector("#byteCount");
  const error = document.querySelector("#urlError");
  const generate = document.querySelector("#generateButton");
  const clear = document.querySelector("#clearButton");
  const download = document.querySelector("#downloadButton");
  const qrCode = document.querySelector("#qrCode");
  const placeholder = document.querySelector("#placeholder");
  const resultHint = document.querySelector("#resultHint");
  let currentSvg = "";

  function byteLength(value) { return QRCodeGenerator.utf8Bytes(value).length; }
  function validate(value) {
    const text = value.trim();
    if (!text) return "URLを入力してください";
    if (byteLength(text) > 106) return "URLが長すぎます。106バイト以内で入力してください";
    try {
      const url = new URL(text);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch (_) { return "http:// または https:// で始まるURLを入力してください"; }
    return "";
  }
  function updateCount() {
    count.textContent = byteLength(input.value);
    if (error.textContent) error.textContent = validate(input.value);
  }
  function makeQr() {
    const message = validate(input.value);
    error.textContent = message;
    if (message) { input.focus(); return; }
    const url = input.value.trim();
    currentSvg = QRCodeGenerator.toSvg(url);
    qrCode.innerHTML = currentSvg;
    qrCode.hidden = false;
    placeholder.hidden = true;
    download.disabled = false;
    resultHint.textContent = "生成できました。読み取りを確認してください";
  }
  function downloadPng() {
    const image = new Image();
    const blob = new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024; canvas.height = 1024;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff"; context.fillRect(0, 0, 1024, 1024);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, 1024, 1024);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(png => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(png);
        link.download = "qr-code.png";
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }, "image/png");
    };
    image.src = objectUrl;
  }
  input.addEventListener("input", updateCount);
  input.addEventListener("keydown", event => { if (event.key === "Enter") makeQr(); });
  clear.addEventListener("click", () => { input.value = ""; updateCount(); error.textContent = ""; input.focus(); });
  generate.addEventListener("click", makeQr);
  download.addEventListener("click", downloadPng);
})();
