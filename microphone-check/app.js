(function (root) {
  "use strict";

  function inputDevices(devices) {
    return (devices || []).filter(function (device) { return device.kind === "audioinput"; }).map(function (device, index) {
      return { id: device.deviceId || "", label: device.label || "マイク " + (index + 1), isDefault: device.deviceId === "default" };
    });
  }

  function levelFromSamples(samples) {
    if (!samples || !samples.length) return 0;
    var sum = 0;
    for (var i = 0; i < samples.length; i += 1) { var centered = (samples[i] - 128) / 128; sum += centered * centered; }
    return Math.min(100, Math.round(Math.sqrt(sum / samples.length) * 220));
  }

  function formatDuration(seconds) {
    var safe = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
  }

  var api = { inputDevices: inputDevices, levelFromSamples: levelFromSamples, formatDuration: formatDuration };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!root.document) return;

  var stream = null;
  var context = null;
  var analyser = null;
  var animationId = null;
  var recorder = null;
  var chunks = [];
  var recordStartedAt = 0;
  var recordInterval = null;
  var recordTimeout = null;
  var recordingUrl = "";
  var maxSeconds = 10;

  function setMessage(text, error) { var message = document.getElementById("permissionMessage"); message.textContent = text; message.classList.toggle("error", !!error); }
  function setState(text, className) { var state = document.getElementById("micState"); state.textContent = text; state.className = "state-pill" + (className ? " " + className : ""); }
  function levelLabel(level) { return level < 8 ? "音声を待っています" : level < 60 ? "入力されています" : level < 82 ? "会議にちょうどよい音量です" : "少し大きめです"; }

  function renderMeter() {
    if (!analyser) return;
    var data = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(data);
    var level = levelFromSamples(data);
    document.getElementById("meterFill").style.width = level + "%";
    document.getElementById("levelPercent").textContent = level + "%";
    document.getElementById("levelLabel").textContent = levelLabel(level);
    document.querySelector(".live-visual").style.setProperty("--level", String(Math.max(.15, level / 100)));
    animationId = root.requestAnimationFrame(renderMeter);
  }

  function resetMeter() {
    document.getElementById("meterFill").style.width = "0%"; document.getElementById("levelPercent").textContent = "0%";
    document.getElementById("levelLabel").textContent = "マイクを開始してください"; document.querySelector(".live-visual").style.setProperty("--level", ".15");
  }

  async function refreshDevices(preferredId) {
    var select = document.getElementById("deviceSelect");
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) { document.getElementById("inputCount").textContent = "取得不可"; select.disabled = true; return; }
    try {
      var devices = await Promise.race([navigator.mediaDevices.enumerateDevices(), new Promise(function (_, reject) { root.setTimeout(function () { reject(new Error("timeout")); }, 2500); })]);
      var inputs = inputDevices(devices); var current = preferredId !== undefined ? preferredId : select.value;
      select.innerHTML = "<option value=\"\">ブラウザの既定マイク</option>";
      inputs.filter(function (device) { return !device.isDefault; }).forEach(function (device) { var option = document.createElement("option"); option.value = device.id; option.textContent = device.label; select.appendChild(option); });
      if (inputs.some(function (device) { return device.id === current; })) select.value = current;
      document.getElementById("inputCount").textContent = inputs.length ? inputs.length + " 件" : "情報なし";
    } catch (_) { document.getElementById("inputCount").textContent = "取得不可"; }
  }

  async function startMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setMessage("このブラウザはマイク入力に対応していません。", true); return; }
    try {
      var deviceId = document.getElementById("deviceSelect").value;
      stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      var AudioContext = root.AudioContext || root.webkitAudioContext; context = new AudioContext();
      analyser = context.createAnalyser(); analyser.fftSize = 1024; context.createMediaStreamSource(stream).connect(analyser);
      var settings = stream.getAudioTracks()[0].getSettings ? stream.getAudioTracks()[0].getSettings() : {};
      document.getElementById("sampleRate").textContent = (settings.sampleRate || context.sampleRate).toLocaleString("ja-JP") + " Hz";
      document.getElementById("channelCount").textContent = settings.channelCount ? settings.channelCount + " ch" : "取得不可";
      document.getElementById("startButton").disabled = true; document.getElementById("stopMicButton").disabled = false;
      document.getElementById("recordButton").disabled = typeof root.MediaRecorder !== "function";
      document.getElementById("deviceSelect").disabled = true; setState("入力中", "live"); setMessage("マイク入力を確認しています。声を出してメーターをご覧ください。");
      await refreshDevices(deviceId); renderMeter();
    } catch (error) {
      var denied = error && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
      setMessage(denied ? "マイクが許可されていません。ブラウザのサイト設定をご確認ください。" : "マイクを開始できませんでした。接続とブラウザ設定をご確認ください。", true); setState("利用不可", "");
    }
  }

  function stopMic(options) {
    options = options || {};
    if (recorder && recorder.state === "recording" && !options.fromRecorder) { recorder.stop(); return; }
    if (animationId) root.cancelAnimationFrame(animationId); animationId = null; analyser = null;
    if (stream) stream.getTracks().forEach(function (track) { track.stop(); }); stream = null;
    if (context) context.close(); context = null;
    document.getElementById("startButton").disabled = false; document.getElementById("stopMicButton").disabled = true; document.getElementById("recordButton").disabled = true; document.getElementById("deviceSelect").disabled = false;
    setState("停止中", ""); resetMeter(); if (!options.silent) setMessage("マイクを停止しました。");
  }

  function updateTimer() { var elapsed = Math.min(maxSeconds, (Date.now() - recordStartedAt) / 1000); document.getElementById("recordTimer").textContent = formatDuration(elapsed) + " / 00:10"; }

  function startRecording() {
    if (!stream || typeof root.MediaRecorder !== "function") return;
    chunks = []; recorder = new MediaRecorder(stream);
    recorder.addEventListener("dataavailable", function (event) { if (event.data.size) chunks.push(event.data); });
    recorder.addEventListener("stop", finishRecording); recorder.start(); recordStartedAt = Date.now(); updateTimer();
    recordInterval = root.setInterval(updateTimer, 100); recordTimeout = root.setTimeout(stopRecording, maxSeconds * 1000);
    document.getElementById("recordButton").disabled = true; document.getElementById("stopRecordButton").disabled = false; setState("録音中", "recording"); setMessage("録音しています。終わったら「録音を停止」を押してください。");
  }

  function stopRecording() { if (recorder && recorder.state === "recording") recorder.stop(); }

  function finishRecording() {
    root.clearInterval(recordInterval); root.clearTimeout(recordTimeout); updateTimer();
    var duration = Math.min(maxSeconds, (Date.now() - recordStartedAt) / 1000); var type = recorder.mimeType || "audio/webm"; var blob = new Blob(chunks, { type: type });
    if (recordingUrl) URL.revokeObjectURL(recordingUrl); recordingUrl = URL.createObjectURL(blob);
    var audio = document.getElementById("playback"); audio.src = recordingUrl;
    document.getElementById("playbackEmpty").hidden = true; document.getElementById("playbackPanel").hidden = false;
    document.getElementById("recordingInfo").textContent = formatDuration(duration) + "・" + Math.max(1, Math.round(blob.size / 1024)) + " KB";
    document.getElementById("stopRecordButton").disabled = true; stopMic({ fromRecorder: true, silent: true }); setMessage("録音できました。再生ボタンで声を確認できます。");
  }

  document.getElementById("startButton").addEventListener("click", startMic);
  document.getElementById("stopMicButton").addEventListener("click", function () { stopMic(); });
  document.getElementById("recordButton").addEventListener("click", startRecording);
  document.getElementById("stopRecordButton").addEventListener("click", stopRecording);
  document.getElementById("refreshButton").addEventListener("click", function () { refreshDevices(); });
  document.getElementById("deviceSelect").addEventListener("change", function (event) { refreshDevices(event.target.value); });
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener("devicechange", function () { refreshDevices(); });
  root.addEventListener("pagehide", function () { stopMic({ silent: true }); if (recordingUrl) URL.revokeObjectURL(recordingUrl); });
  refreshDevices();
}(typeof globalThis !== "undefined" ? globalThis : this));
