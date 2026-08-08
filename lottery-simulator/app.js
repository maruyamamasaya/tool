(function () {
  "use strict";

  function parseItems(value) { return String(value).split(/\r?\n/).map((v) => v.trim()).filter(Boolean); }
  function validateWeights(weights) { return weights.every((v) => Number.isFinite(v) && v >= 0) && Math.abs(weights.reduce((a, b) => a + b, 0) - 100) < 0.0001; }
  function theoretical(items, weights) { return weights ? weights.map((v) => v / 100) : items.map(() => 1 / items.length); }
  function pickIndex(probabilities, randomValue = Math.random()) {
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i += 1) { cumulative += probabilities[i]; if (randomValue < cumulative || i === probabilities.length - 1) return i; }
    return probabilities.length - 1;
  }
  function draw(items, probabilities, count, allowDuplicates, random = Math.random) {
    if (!items.length) throw new Error("候補を1つ以上入力してください");
    if (!allowDuplicates && count > items.length) throw new Error(`重複なしでは最大${items.length}回まで抽選できます`);
    const pool = items.map((name, index) => ({ name, weight: probabilities[index] }));
    const results = [];
    for (let n = 0; n < count; n += 1) {
      const total = pool.reduce((sum, item) => sum + item.weight, 0);
      const index = pickIndex(pool.map((item) => item.weight / total), random());
      results.push(pool[index].name);
      if (!allowDuplicates) pool.splice(index, 1);
    }
    return results;
  }

  if (typeof module !== "undefined") module.exports = { parseItems, validateWeights, theoretical, pickIndex, draw };
  if (typeof document === "undefined") return;

  const $ = (selector) => document.querySelector(selector);
  const itemsInput = $("#items"), probabilityPanel = $("#probabilityPanel"), rows = $("#probabilityRows"), warning = $("#probabilityWarning"), totalLabel = $("#totalProbability");
  const history = []; let weightsByName = new Map([["A賞", 1], ["B賞", 5], ["C賞", 14], ["はずれ", 80]]); let timer;
  const mode = () => document.querySelector('input[name="mode"]:checked').value;

  function syncItems() {
    const items = parseItems(itemsInput.value); $("#itemCount").textContent = `${items.length}項目`;
    rows.innerHTML = "";
    items.forEach((name) => {
      const label = document.createElement("label"); label.className = "prob-row";
      const span = document.createElement("span"); span.textContent = name;
      const input = document.createElement("input"); input.type = "number"; input.min = "0"; input.max = "100"; input.step = "0.1"; input.value = weightsByName.has(name) ? weightsByName.get(name) : (100 / items.length).toFixed(2); input.dataset.name = name;
      const unit = document.createElement("i"); unit.textContent = "%"; label.append(span, input, unit); rows.append(label);
    }); updateProbability();
  }
  function updateProbability() {
    const inputs = [...rows.querySelectorAll("input")]; inputs.forEach((input) => weightsByName.set(input.dataset.name, Number(input.value)));
    const total = inputs.reduce((sum, input) => sum + (Number(input.value) || 0), 0); const valid = Math.abs(total - 100) < 0.0001;
    totalLabel.textContent = `合計 ${Number(total.toFixed(2))}%`; totalLabel.classList.toggle("bad", !valid); warning.hidden = valid;
  }
  function settings() {
    const items = parseItems(itemsInput.value); let probabilities;
    if (mode() === "weighted") { const values = [...rows.querySelectorAll("input")].map((input) => Number(input.value)); if (!validateWeights(values)) throw new Error("確率の合計を100%にしてください"); probabilities = values.map((v) => v / 100); }
    else probabilities = theoretical(items);
    return { items, probabilities };
  }
  function renderHistory() {
    $("#historyCount").textContent = `${history.length}件`;
    $("#history").innerHTML = history.length ? history.slice(-100).reverse().map((entry, i) => `<li><span>${history.length - i}</span><b>${escapeHtml(entry.name)}</b><time>${entry.time}</time></li>`).join("") : '<li class="empty">まだ抽選結果がありません</li>';
  }
  function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }
  function renderStats(items, probabilities) {
    const counts = new Map(items.map((item) => [item, 0])); history.forEach((entry) => { if (counts.has(entry.name)) counts.set(entry.name, counts.get(entry.name) + 1); });
    $("#totalDraws").textContent = `TOTAL ${history.length.toLocaleString("ja-JP")}`; $("#statsEmpty").hidden = history.length > 0; $("#stats").hidden = history.length === 0;
    $("#statsBody").innerHTML = items.map((item, i) => { const count = counts.get(item); const actual = history.length ? count / history.length * 100 : 0; const expected = probabilities[i] * 100; const diff = actual - expected; return `<tr><th>${escapeHtml(item)}</th><td>${count.toLocaleString("ja-JP")}</td><td>${actual.toFixed(2)}%</td><td>${expected.toFixed(2)}%</td><td class="${diff >= 0 ? "plus" : "minus"}">${diff >= 0 ? "+" : ""}${diff.toFixed(2)}pt</td></tr>`; }).join("");
    const max = Math.max(1, ...counts.values()); $("#chart").innerHTML = items.map((item, i) => `<div class="bar-row"><span>${escapeHtml(item)}</span><div><i style="width:${counts.get(item) / max * 100}%"></i><em style="left:${Math.min(100, probabilities[i] * 100)}%" title="理論値"></em></div><b>${counts.get(item)}</b></div>`).join("");
  }
  function run(count) {
    $("#error").hidden = true;
    try {
      const { items, probabilities } = settings(); const results = draw(items, probabilities, count, $("#duplicates").checked); const now = new Date();
      results.forEach((name) => history.push({ name, time: now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }));
      const latest = $("#latestResult"); latest.textContent = count === 1 ? results[0] : `${count.toLocaleString("ja-JP")}回 完了！`; $("#resultMeta").textContent = count === 1 ? "おめでとうございます！" : `最新: ${results.slice(-3).join(" / ")}`;
      $("#resultStage").classList.remove("reveal"); void $("#resultStage").offsetWidth; $("#resultStage").classList.add("reveal"); renderHistory(); renderStats(items, probabilities);
    } catch (error) { $("#error").textContent = error.message; $("#error").hidden = false; }
  }
  function showToast(message) { $("#toast").textContent = message; $("#toast").classList.add("show"); clearTimeout(timer); timer = setTimeout(() => $("#toast").classList.remove("show"), 1800); }
  document.querySelectorAll('input[name="mode"]').forEach((input) => input.addEventListener("change", () => { probabilityPanel.hidden = mode() !== "weighted"; }));
  itemsInput.addEventListener("input", syncItems); rows.addEventListener("input", updateProbability); document.querySelectorAll("[data-count]").forEach((button) => button.addEventListener("click", () => run(Number(button.dataset.count))));
  $("#duplicates").addEventListener("change", (event) => { event.target.closest("label").lastChild.textContent = event.target.checked ? "重複あり" : "重複なし"; });
  $("#clear").addEventListener("click", () => { history.length = 0; renderHistory(); const config = settings(); renderStats(config.items, config.probabilities); $("#latestResult").textContent = "READY?"; $("#resultMeta").textContent = "ボタンを押して抽選スタート"; });
  $("#copy").addEventListener("click", async () => { if (!history.length) return showToast("コピーする履歴がありません"); const text = history.map((entry, i) => `${i + 1}. ${entry.name} (${entry.time})`).join("\n"); try { await navigator.clipboard.writeText(text); showToast("抽選履歴をコピーしました"); } catch (_) { showToast("コピーできませんでした"); } });
  syncItems();
}());
