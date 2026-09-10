(function (root) {
  "use strict";

  function outputDevices(devices) {
    return (devices || []).filter(function (device) { return device.kind === "audiooutput"; }).map(function (device, index) {
      return { id: device.deviceId || "", label: device.label || "音声出力 " + (index + 1), isDefault: device.deviceId === "default" };
    });
  }

  function testSequence(mode) {
    if (mode === "left") return [{ pan: -1, delay: 0, label: "左" }];
    if (mode === "right") return [{ pan: 1, delay: 0, label: "右" }];
    return [{ pan: -1, delay: 0, label: "左" }, { pan: 1, delay: 0.65, label: "右" }, { pan: 0, delay: 1.3, label: "両方" }];
  }

  var api = { outputDevices: outputDevices, testSequence: testSequence };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!root.document) return;

  var context = null;
  var activeNodes = [];
  var statusTimers = [];
  var endTimer = null;
  var selectedDeviceId = "default";
  var buttons = Array.from(document.querySelectorAll("[data-test]"));

  function setPlaying(mode, label) {
    buttons.forEach(function (button) { button.classList.toggle("active", button.dataset.test === mode); });
    document.getElementById("levelLeft").classList.toggle("on", label === "左" || label === "両方");
    document.getElementById("levelRight").classList.toggle("on", label === "右" || label === "両方");
    document.getElementById("playStatus").textContent = label ? label + "から再生中" : "ボタンを押すと短い確認音が流れます";
    document.getElementById("stopButton").disabled = !label;
  }

  function stop() {
    activeNodes.forEach(function (node) { try { node.stop(); } catch (_) {} });
    activeNodes = [];
    statusTimers.forEach(root.clearTimeout); statusTimers = [];
    root.clearTimeout(endTimer); endTimer = null;
    setPlaying("", "");
  }

  async function ensureContext() {
    if (!context) {
      var AudioContext = root.AudioContext || root.webkitAudioContext;
      if (!AudioContext) throw new Error("このブラウザは音声再生に対応していません。");
      context = new AudioContext();
      document.getElementById("sampleRate").textContent = context.sampleRate.toLocaleString("ja-JP") + " Hz";
    }
    if (context.state === "suspended") await context.resume();
    if (selectedDeviceId && selectedDeviceId !== "default" && typeof context.setSinkId === "function") await context.setSinkId(selectedDeviceId);
    return context;
  }

  async function play(mode) {
    stop();
    try {
      var audioContext = await ensureContext();
      var volume = Number(document.getElementById("volume").value);
      var sequence = testSequence(mode);
      sequence.forEach(function (step) {
        var start = audioContext.currentTime + step.delay;
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        var panner = audioContext.createStereoPanner();
        oscillator.type = "sine"; oscillator.frequency.value = 440;
        panner.pan.value = step.pan;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
        gain.gain.setValueAtTime(volume, start + 0.38);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.52);
        oscillator.connect(gain).connect(panner).connect(audioContext.destination);
        oscillator.start(start); oscillator.stop(start + 0.54); activeNodes.push(oscillator);
        statusTimers.push(root.setTimeout(function () { setPlaying(mode, step.label); }, step.delay * 1000));
      });
      endTimer = root.setTimeout(stop, (sequence[sequence.length - 1].delay + 0.62) * 1000);
    } catch (error) {
      stop(); document.getElementById("playStatus").textContent = error.message || "音声を再生できませんでした。";
    }
  }

  function setDeviceMessage(state, name, detail, limited) {
    var badge = document.getElementById("deviceState"); badge.textContent = state; badge.classList.toggle("limited", !!limited);
    document.getElementById("deviceName").textContent = name; document.getElementById("deviceDetail").textContent = detail;
  }

  async function refreshDevices(preferredId) {
    var select = document.getElementById("outputSelect");
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      select.innerHTML = "<option>ブラウザの既定出力</option>"; select.disabled = true;
      document.getElementById("outputCount").textContent = "取得不可";
      setDeviceMessage("制限あり", "ブラウザの既定出力", "デバイス情報APIに未対応", true); return;
    }
    try {
      var devices = await Promise.race([
        navigator.mediaDevices.enumerateDevices(),
        new Promise(function (_, reject) { root.setTimeout(function () { reject(new Error("device timeout")); }, 2500); })
      ]);
      var outputs = outputDevices(devices);
      document.getElementById("outputCount").textContent = outputs.length ? outputs.length + " 件" : "情報なし";
      if (!outputs.length) {
        select.innerHTML = "<option>ブラウザの既定出力</option>"; select.disabled = true;
        setDeviceMessage("制限あり", "ブラウザの既定出力", "出力デバイス名は取得できません", true); return;
      }
      select.innerHTML = "";
      outputs.forEach(function (device) { var option = document.createElement("option"); option.value = device.id; option.textContent = device.label + (device.isDefault ? "（既定）" : ""); select.appendChild(option); });
      var requested = preferredId || selectedDeviceId;
      if (outputs.some(function (device) { return device.id === requested; })) select.value = requested;
      selectedDeviceId = select.value;
      var selected = outputs.find(function (device) { return device.id === selectedDeviceId; }) || outputs[0];
      var canRoute = context ? typeof context.setSinkId === "function" : "setSinkId" in (root.AudioContext || root.webkitAudioContext || function () {}).prototype;
      select.disabled = !canRoute;
      setDeviceMessage(selected.label.indexOf("音声出力 ") === 0 ? "検出済み" : "接続済み", selected.label, selected.isDefault ? "ブラウザの既定の音声出力" : "選択可能な音声出力", selected.label.indexOf("音声出力 ") === 0);
    } catch (_) {
      select.innerHTML = "<option>ブラウザの既定出力</option>"; select.disabled = true; document.getElementById("outputCount").textContent = "取得不可";
      setDeviceMessage("制限あり", "ブラウザの既定出力", "デバイス情報を取得できませんでした", true);
    }
  }

  buttons.forEach(function (button) { button.addEventListener("click", function () { play(button.dataset.test); }); });
  document.getElementById("stopButton").addEventListener("click", stop);
  document.getElementById("volume").addEventListener("input", function (event) { document.getElementById("volumeValue").textContent = Math.round(Number(event.target.value) * 100) + "%"; });
  document.getElementById("refreshButton").addEventListener("click", function () { refreshDevices(); });
  document.getElementById("outputSelect").addEventListener("change", async function (event) { selectedDeviceId = event.target.value; try { if (context && typeof context.setSinkId === "function") await context.setSinkId(selectedDeviceId); await refreshDevices(selectedDeviceId); } catch (_) { setDeviceMessage("制限あり", "出力先を変更できませんでした", "OSまたはブラウザの設定をご確認ください", true); } });
  var chooseButton = document.getElementById("chooseOutputButton");
  if (navigator.mediaDevices && typeof navigator.mediaDevices.selectAudioOutput === "function") {
    chooseButton.hidden = false;
    chooseButton.addEventListener("click", async function () { try { var device = await navigator.mediaDevices.selectAudioOutput(); selectedDeviceId = device.deviceId; await refreshDevices(device.deviceId); } catch (_) {} });
  }
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener("devicechange", function () { refreshDevices(); });
  document.getElementById("stereoSupport").textContent = (root.AudioContext || root.webkitAudioContext) && "StereoPannerNode" in root ? "対応" : "未対応";
  refreshDevices();
}(typeof globalThis !== "undefined" ? globalThis : this));
