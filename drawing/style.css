(() => {
  "use strict";
  const canvas = document.querySelector("#board");
  const shell = document.querySelector("#canvasShell");
  const ctx = canvas.getContext("2d");
  const hint = document.querySelector("#emptyHint");
  const input = document.querySelector("#textInput");
  const status = document.querySelector("#status");
  const undoButton = document.querySelector("#undo");
  const redoButton = document.querySelector("#redo");
  const labels = { pointer: "ポインター", pencil: "鉛筆", eraser: "消しゴム", rect: "四角", arrow: "矢印", text: "テキスト" };
  let tool = "pointer", width = 2, objects = [], undoStack = [], redoStack = [];
  let active = null, start = null, moving = null, inputPoint = null;

  const clone = value => JSON.parse(JSON.stringify(value));
  const point = event => { const r = canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; };
  function snapshot() { undoStack.push(clone(objects)); if (undoStack.length > 100) undoStack.shift(); redoStack = []; updateControls(); }
  function updateControls() { undoButton.disabled = !undoStack.length; redoButton.disabled = !redoStack.length; hint.hidden = objects.length > 0 || active; }

  function drawArrow(o) {
    const angle = Math.atan2(o.y2 - o.y1, o.x2 - o.x1), head = Math.max(12, o.width * 3.2);
    ctx.beginPath(); ctx.moveTo(o.x1, o.y1); ctx.lineTo(o.x2, o.y2);
    ctx.moveTo(o.x2, o.y2); ctx.lineTo(o.x2 - head * Math.cos(angle - Math.PI / 6), o.y2 - head * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(o.x2, o.y2); ctx.lineTo(o.x2 - head * Math.cos(angle + Math.PI / 6), o.y2 - head * Math.sin(angle + Math.PI / 6)); ctx.stroke();
  }
  function renderObject(o) {
    ctx.save(); ctx.strokeStyle = "#111"; ctx.fillStyle = "#111"; ctx.lineWidth = o.width || 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (o.type === "stroke") { ctx.beginPath(); o.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); if (o.points.length === 1) ctx.lineTo(o.points[0].x + .1, o.points[0].y); ctx.stroke(); }
    if (o.type === "rect") { ctx.strokeRect(o.x, o.y, o.w, o.h); }
    if (o.type === "arrow") drawArrow(o);
    if (o.type === "text") { ctx.font = `${o.size}px Inter, "Noto Sans JP", sans-serif`; ctx.textBaseline = "top"; o.text.split("\n").forEach((line, i) => ctx.fillText(line, o.x, o.y + i * o.size * 1.35)); }
    ctx.restore();
  }
  function redraw() { ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); objects.forEach(renderObject); if (active) renderObject(active); updateControls(); }
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = shell.clientWidth;
    const height = shell.clientHeight;
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width === pixelWidth && canvas.height === pixelHeight) return;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }
  new ResizeObserver(resize).observe(shell);

  function bounds(o) {
    if (o.type === "stroke") { const xs = o.points.map(p => p.x), ys = o.points.map(p => p.y); return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs)-Math.min(...xs), h: Math.max(...ys)-Math.min(...ys) }; }
    if (o.type === "rect") return { x: Math.min(o.x,o.x+o.w), y: Math.min(o.y,o.y+o.h), w: Math.abs(o.w), h: Math.abs(o.h) };
    if (o.type === "arrow") return { x: Math.min(o.x1,o.x2), y: Math.min(o.y1,o.y2), w: Math.abs(o.x2-o.x1), h: Math.abs(o.y2-o.y1) };
    ctx.font = `${o.size}px sans-serif`; return { x:o.x, y:o.y, w:Math.max(...o.text.split("\n").map(t => ctx.measureText(t).width)), h:o.text.split("\n").length*o.size*1.35 };
  }
  function hit(p, o, padding = 9) { const b = bounds(o); return p.x >= b.x-padding && p.x <= b.x+b.w+padding && p.y >= b.y-padding && p.y <= b.y+b.h+padding; }
  function translate(o, dx, dy) { if (o.type === "stroke") o.points.forEach(p => {p.x+=dx;p.y+=dy;}); else if (o.type === "rect" || o.type === "text") {o.x+=dx;o.y+=dy;} else {o.x1+=dx;o.x2+=dx;o.y1+=dy;o.y2+=dy;} }

  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0) return; commitText(); canvas.setPointerCapture(event.pointerId); start = point(event);
    if (tool === "pencil") active = { type:"stroke", width, points:[start] };
    if (tool === "rect") active = { type:"rect", width, x:start.x, y:start.y, w:0, h:0 };
    if (tool === "arrow") active = { type:"arrow", width, x1:start.x, y1:start.y, x2:start.x, y2:start.y };
    if (tool === "eraser") { const i = objects.findLastIndex(o => hit(start,o,Math.max(8,width))); if (i >= 0) { snapshot(); objects.splice(i,1); redraw(); } }
    if (tool === "pointer") { const i = objects.findLastIndex(o => hit(start,o)); if (i >= 0) moving = { object: objects[i], last:start, changed:false }; }
    if (tool === "text") openText(start);
    redraw();
  });
  canvas.addEventListener("pointermove", event => {
    if (!start) return; const p = point(event);
    if (active?.type === "stroke") active.points.push(p);
    if (active?.type === "rect") { active.w=p.x-start.x; active.h=p.y-start.y; }
    if (active?.type === "arrow") { active.x2=p.x; active.y2=p.y; }
    if (moving) { const dx=p.x-moving.last.x, dy=p.y-moving.last.y; if (!moving.changed && Math.abs(dx)+Math.abs(dy)>0) { snapshot(); moving.changed=true; } translate(moving.object,dx,dy); moving.last=p; }
    redraw();
  });
  function finish() { if (active) { snapshot(); objects.push(active); active=null; } moving=null; start=null; redraw(); }
  canvas.addEventListener("pointerup", finish); canvas.addEventListener("pointercancel", finish);

  function openText(p) { inputPoint=p; input.value=""; input.style.display="block"; input.style.left=`${p.x}px`; input.style.top=`${p.y}px`; input.style.fontSize=`${Math.max(18,width*3+14)}px`; input.focus(); }
  function commitText() { if (input.style.display !== "block") return; const text=input.value.trim(); if (text) { snapshot(); objects.push({type:"text", x:inputPoint.x, y:inputPoint.y, text, size:Math.max(18,width*3+14), width}); } input.style.display="none"; inputPoint=null; redraw(); }
  input.addEventListener("blur", commitText); input.addEventListener("keydown", e => { if (e.key === "Escape") { input.value=""; input.blur(); } if ((e.ctrlKey||e.metaKey)&&e.key==="Enter") input.blur(); });

  function selectTool(next) { tool=next; shell.dataset.tool=tool; document.querySelectorAll("[data-tool]").forEach(b => { const on=b.dataset.tool===tool; b.classList.toggle("active",on); b.setAttribute("aria-pressed",on); }); status.textContent=`${labels[tool]}を選択中`; }
  document.querySelectorAll("[data-tool]").forEach(b => b.addEventListener("click",()=>selectTool(b.dataset.tool)));
  document.querySelectorAll("[data-width]").forEach(b => b.addEventListener("click",()=>{ width=Number(b.dataset.width); document.querySelectorAll("[data-width]").forEach(x=>{const on=x===b;x.classList.toggle("active",on);x.setAttribute("aria-pressed",on);}); }));
  function undo() { if (!undoStack.length) return; redoStack.push(clone(objects)); objects=undoStack.pop(); redraw(); }
  function redo() { if (!redoStack.length) return; undoStack.push(clone(objects)); objects=redoStack.pop(); redraw(); }
  undoButton.addEventListener("click",undo); redoButton.addEventListener("click",redo);
  document.querySelector("#clear").addEventListener("click",()=>{ if (!objects.length&&!active) return; snapshot(); objects=[]; active=null; redraw(); });
  document.addEventListener("keydown",e=>{ if (e.target===input) return; const key=e.key.toLowerCase(); if ((e.ctrlKey||e.metaKey)&&key==="z") { e.preventDefault(); e.shiftKey?redo():undo(); return; } if ((e.ctrlKey||e.metaKey)&&key==="y") {e.preventDefault();redo();return;} const shortcuts={v:"pointer",p:"pencil",e:"eraser",r:"rect",a:"arrow",t:"text"}; if(shortcuts[key]) selectTool(shortcuts[key]); });
  selectTool("pointer"); updateControls();
})();
