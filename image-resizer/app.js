const MAX_FILE_SIZE = 30 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  return `${value.toFixed(index === 0 || value >= 10 ? 0 : 1)} ${units[index]}`;
}

function dimensionsAtScale(width, height, scale) {
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function outputExtension(type) {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[type] || "png";
}

if (typeof module !== "undefined") module.exports = { formatBytes, dimensionsAtScale, outputExtension, MAX_FILE_SIZE, SUPPORTED_TYPES };

if (typeof document !== "undefined") {
  const byId = (id) => document.getElementById(id);
  const elements = {
    file: byId("fileInput"), drop: byId("dropZone"), error: byId("error"), source: byId("sourceInfo"),
    thumb: byId("sourceThumb"), name: byId("sourceName"), meta: byId("sourceMeta"), replace: byId("replaceButton"),
    settings: byId("settingsStep"), width: byId("widthInput"), height: byId("heightInput"), ratio: byId("keepRatio"),
    format: byId("formatSelect"), qualityField: byId("qualityField"), quality: byId("qualityInput"), qualityValue: byId("qualityValue"),
    resize: byId("resizeButton"), result: byId("resultStep"), preview: byId("resultPreview"), before: byId("beforeSize"),
    after: byId("afterSize"), download: byId("downloadButton")
  };
  let source = null;
  let sourceUrl = "";
  let resultUrl = "";
  let syncing = false;

  function showError(message) { elements.error.textContent = message; }
  function setDimension(changed) {
    if (!source || syncing || !elements.ratio.checked) return;
    syncing = true;
    if (changed === "width") elements.height.value = Math.max(1, Math.round(Number(elements.width.value) * source.height / source.width));
    else elements.width.value = Math.max(1, Math.round(Number(elements.height.value) * source.width / source.height));
    syncing = false;
  }
  function updateQualityVisibility() {
    const type = elements.format.value === "original" ? source?.type : elements.format.value;
    elements.qualityField.hidden = !["image/jpeg", "image/webp"].includes(type);
  }
  function loadFile(file) {
    showError("");
    if (!file || !SUPPORTED_TYPES.includes(file.type)) return showError("JPG・PNG・WebPの画像を選択してください。");
    if (file.size > MAX_FILE_SIZE) return showError("ファイルサイズは30 MB以下にしてください。");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      sourceUrl = url;
      source = { file, image, width: image.naturalWidth, height: image.naturalHeight, type: file.type };
      elements.thumb.src = url; elements.name.textContent = file.name;
      elements.meta.textContent = `${source.width} × ${source.height} px · ${formatBytes(file.size)}`;
      elements.width.value = source.width; elements.height.value = source.height;
      elements.drop.hidden = true; elements.source.hidden = false;
      elements.settings.classList.remove("disabled"); elements.settings.setAttribute("aria-disabled", "false"); elements.resize.disabled = false;
      elements.result.hidden = true; updateQualityVisibility();
      document.querySelectorAll("[data-scale]").forEach((button) => button.classList.toggle("active", button.dataset.scale === "1"));
    };
    image.onerror = () => { URL.revokeObjectURL(url); showError("画像を読み込めませんでした。"); };
    image.src = url;
  }
  elements.file.addEventListener("change", () => loadFile(elements.file.files[0]));
  elements.replace.addEventListener("click", () => { elements.file.value = ""; elements.file.click(); });
  elements.drop.addEventListener("keydown", (event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); elements.file.click(); } });
  ["dragenter", "dragover"].forEach((name) => elements.drop.addEventListener(name, (event) => { event.preventDefault(); elements.drop.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((name) => elements.drop.addEventListener(name, (event) => { event.preventDefault(); elements.drop.classList.remove("dragging"); }));
  elements.drop.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));
  elements.width.addEventListener("input", () => setDimension("width"));
  elements.height.addEventListener("input", () => setDimension("height"));
  document.querySelectorAll("[data-scale]").forEach((button) => button.addEventListener("click", () => {
    const size = dimensionsAtScale(source.width, source.height, Number(button.dataset.scale));
    elements.width.value = size.width; elements.height.value = size.height;
    document.querySelectorAll("[data-scale]").forEach((item) => item.classList.toggle("active", item === button));
  }));
  elements.format.addEventListener("change", updateQualityVisibility);
  elements.quality.addEventListener("input", () => { elements.qualityValue.value = `${elements.quality.value}%`; });
  elements.resize.addEventListener("click", () => {
    const width = Number(elements.width.value), height = Number(elements.height.value);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 16384 || height > 16384) return showError("幅と高さは1〜16384 pxで指定してください。");
    showError(""); elements.resize.disabled = true; elements.resize.firstChild.textContent = "処理中… ";
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high"; context.drawImage(source.image, 0, 0, width, height);
    const type = elements.format.value === "original" ? source.type : elements.format.value;
    canvas.toBlob((blob) => {
      elements.resize.disabled = false; elements.resize.firstChild.textContent = "リサイズする ";
      if (!blob) return showError("画像の変換に失敗しました。");
      if (resultUrl) URL.revokeObjectURL(resultUrl); resultUrl = URL.createObjectURL(blob);
      elements.preview.src = resultUrl; elements.before.textContent = `${source.width} × ${source.height} px · ${formatBytes(source.file.size)}`;
      elements.after.textContent = `${width} × ${height} px · ${formatBytes(blob.size)}`;
      const base = source.file.name.replace(/\.[^.]+$/, ""); elements.download.href = resultUrl; elements.download.download = `${base}-${width}x${height}.${outputExtension(type)}`;
      elements.result.hidden = false; elements.result.scrollIntoView({ behavior: "smooth", block: "start" });
    }, type, Number(elements.quality.value) / 100);
  });
}
