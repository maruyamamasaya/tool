(function () {
  "use strict";

  const LETTERS = ["B", "I", "N", "G", "O"];
  const MAX_PLAYERS = 16;

  function shuffle(values, random = Math.random) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function generateCard(random = Math.random) {
    const card = Array.from({ length: 5 }, () => Array(5));
    for (let col = 0; col < 5; col += 1) {
      const start = col * 15 + 1;
      const numbers = shuffle(Array.from({ length: 15 }, (_, i) => start + i), random).slice(0, 5);
      for (let row = 0; row < 5; row += 1) card[row][col] = row === 2 && col === 2 ? null : numbers[row];
    }
    return card;
  }

  function getWinningLines(card, drawn) {
    const marked = (row, col) => card[row][col] === null || drawn.has(card[row][col]);
    const lines = [];
    for (let i = 0; i < 5; i += 1) {
      if ([0, 1, 2, 3, 4].every((col) => marked(i, col))) lines.push([0, 1, 2, 3, 4].map((col) => [i, col]));
      if ([0, 1, 2, 3, 4].every((row) => marked(row, i))) lines.push([0, 1, 2, 3, 4].map((row) => [row, i]));
    }
    if ([0, 1, 2, 3, 4].every((i) => marked(i, i))) lines.push([0, 1, 2, 3, 4].map((i) => [i, i]));
    if ([0, 1, 2, 3, 4].every((i) => marked(i, 4 - i))) lines.push([0, 1, 2, 3, 4].map((i) => [i, 4 - i]));
    return lines;
  }

  function ballLetter(number) { return LETTERS[Math.floor((number - 1) / 15)]; }

  if (typeof module !== "undefined") module.exports = { shuffle, generateCard, getWinningLines, ballLetter };
  if (typeof document === "undefined") return;

  const $ = (selector) => document.querySelector(selector);
  let players = [{ id: 1, name: "", card: generateCard() }];
  let nextId = 2;
  let drawn = [];

  function displayName(player, index) { return player.name.trim() || `Player ${index + 1}`; }
  function winners() { const set = new Set(drawn); return players.filter((player) => getWinningLines(player.card, set).length); }

  function renderNumberBoard() {
    const called = new Set(drawn);
    $("#numberBoard").innerHTML = LETTERS.map((letter, col) => `<div class="number-row"><b>${letter}</b><div>${Array.from({ length: 15 }, (_, i) => { const n = col * 15 + i + 1; return `<span class="${called.has(n) ? "called" : ""}">${n}</span>`; }).join("")}</div></div>`).join("");
  }

  function renderCards() {
    const called = new Set(drawn);
    $("#playerCount").textContent = `${players.length} / ${MAX_PLAYERS}`;
    $("#addPlayer").disabled = players.length >= MAX_PLAYERS;
    $("#cards").innerHTML = players.map((player, playerIndex) => {
      const winningCells = new Set(getWinningLines(player.card, called).flat().map(([r, c]) => `${r}-${c}`));
      const isBingo = winningCells.size > 0;
      const cells = player.card.map((row, r) => row.map((number, c) => {
        const marked = number === null || called.has(number);
        return `<div class="cell${marked ? " marked" : ""}${winningCells.has(`${r}-${c}`) ? " winning" : ""}">${number === null ? '<span class="free-star">★</span><small>FREE</small>' : number}</div>`;
      }).join("")).join("");
      return `<article class="bingo-card${isBingo ? " bingo" : ""}" data-id="${player.id}"><div class="card-top">${isBingo ? '<strong class="bingo-badge">🎉 BINGO!</strong>' : `<span>CARD ${String(playerIndex + 1).padStart(2, "0")}</span>`}<button class="remove" type="button" aria-label="${displayName(player, playerIndex)}を削除" ${players.length === 1 ? "disabled" : ""}>×</button></div><input class="player-name" value="${escapeHtml(player.name)}" placeholder="${displayName(player, playerIndex)}" aria-label="ユーザー名"><div class="card-letters">${LETTERS.map((l) => `<b>${l}</b>`).join("")}</div><div class="card-cells">${cells}</div></article>`;
    }).join("");
  }

  function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
  function renderHistory() {
    $("#historyCount").textContent = `${drawn.length} BALL${drawn.length === 1 ? "" : "S"}`;
    $("#history").innerHTML = drawn.length ? drawn.slice().reverse().map((number, i) => `<li${i === 0 ? ' class="latest"' : ""}><span>${drawn.length - i}</span><b>${ballLetter(number)}</b><strong>${number}</strong></li>`).join("") : '<li class="empty">まだ番号は抽選されていません</li>';
  }
  function render(message) {
    const last = drawn.at(-1);
    $("#currentBall").innerHTML = last ? `<small>${ballLetter(last)}</small>${last}` : "<small>—</small>";
    $("#drawCount").textContent = `抽選済み ${drawn.length} / 75 球`;
    $("#drawNext").disabled = drawn.length === 75;
    $("#drawToBingo").disabled = drawn.length === 75 || winners().length > 0;
    if (message) $("#resultMessage").innerHTML = message;
    renderNumberBoard(); renderCards(); renderHistory();
  }
  function drawOne() {
    if (drawn.length >= 75) return null;
    const available = Array.from({ length: 75 }, (_, i) => i + 1).filter((n) => !drawn.includes(n));
    const number = available[Math.floor(Math.random() * available.length)];
    drawn.push(number); return number;
  }
  function winnerMessage(found) {
    const names = found.map((player) => `<b>${escapeHtml(displayName(player, players.indexOf(player)))}</b>`).join("、");
    return `🎉 ${names} が <strong>${drawn.length}球目</strong>（${ballLetter(drawn.at(-1))} ${drawn.at(-1)}）でBINGO！`;
  }
  $("#drawNext").addEventListener("click", () => { drawOne(); const found = winners(); render(found.length ? winnerMessage(found) : `今回の番号は <b>${ballLetter(drawn.at(-1))} ${drawn.at(-1)}</b> です`); });
  $("#drawToBingo").addEventListener("click", () => { let found = winners(); while (!found.length && drawn.length < 75) { drawOne(); found = winners(); } render(found.length ? winnerMessage(found) : "すべての番号を抽選しました"); });
  $("#addPlayer").addEventListener("click", () => { if (players.length < MAX_PLAYERS) { players.push({ id: nextId++, name: "", card: generateCard() }); render("新しいカードを追加しました"); } });
  $("#regenerate").addEventListener("click", () => { players.forEach((player) => { player.card = generateCard(); }); drawn = []; render("全員のカードを再生成しました"); });
  $("#resetGame").addEventListener("click", () => { drawn = []; render("カードはそのまま、抽選結果をリセットしました"); });
  $("#cards").addEventListener("input", (event) => { if (!event.target.classList.contains("player-name")) return; const player = players.find((p) => p.id === Number(event.target.closest("article").dataset.id)); player.name = event.target.value; });
  $("#cards").addEventListener("click", (event) => { if (!event.target.classList.contains("remove") || players.length === 1) return; players = players.filter((p) => p.id !== Number(event.target.closest("article").dataset.id)); render("ユーザーを削除しました"); });
  render();
}());
