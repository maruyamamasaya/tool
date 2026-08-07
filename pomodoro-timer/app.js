(function () {
  'use strict';
  const STORAGE_KEY = 'pomodoroTimerSettings';
  const COUNT_KEY = 'pomodoroTimerDailyCount';
  const DEFAULTS = { workMinutes: 25, breakMinutes: 5 };

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function formatTime(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
  }
  function validMinutes(value, max) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= max;
  }
  if (typeof module !== 'undefined') module.exports = { dateKey, formatTime, validMinutes };
  if (typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const elements = { display:$('timerDisplay'), label:$('modeLabel'), pill:$('modePill'), hint:$('timerHint'), progress:$('progressBar'), start:$('startButton'), pause:$('pauseButton'), reset:$('resetButton'), count:$('completedCount'), panel:$('settingsPanel'), toggle:$('settingsToggle'), close:$('settingsClose'), form:$('settingsForm'), work:$('workMinutes'), break:$('breakMinutes'), error:$('settingsError') };
  let settings = loadSettings();
  let mode = 'work';
  let remaining = settings.workMinutes * 60;
  let running = false;
  let endAt = 0;
  let intervalId = null;
  let completed = loadCount();

  function safeParse(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } }
  function loadSettings() { const saved=safeParse(STORAGE_KEY); return saved && validMinutes(saved.workMinutes,180) && validMinutes(saved.breakMinutes,60) ? saved : {...DEFAULTS}; }
  function loadCount() { const saved=safeParse(COUNT_KEY); return saved && saved.date===dateKey() && Number.isInteger(saved.count) ? saved.count : 0; }
  function saveCount() { localStorage.setItem(COUNT_KEY,JSON.stringify({date:dateKey(),count:completed})); }
  function duration() { return (mode==='work' ? settings.workMinutes : settings.breakMinutes) * 60; }
  function render() {
    elements.display.textContent=formatTime(remaining);
    elements.label.textContent=mode==='work'?'作業中':'休憩中';
    elements.pill.classList.toggle('break',mode==='break');
    elements.progress.style.width=`${Math.min(100,Math.max(0,(1-remaining/duration())*100))}%`;
    elements.progress.style.background=mode==='work'?'var(--red)':'var(--green)';
    elements.hint.textContent=running ? (mode==='work'?'目の前のひとつに集中しましょう。':'ゆっくり休んで、次に備えましょう。') : remaining<duration()?'一時停止中です。':'準備ができたら、集中を始めましょう。';
    elements.start.disabled=running; elements.pause.disabled=!running; elements.count.textContent=completed;
    document.title=`${formatTime(remaining)} · ${mode==='work'?'作業':'休憩'} | Pomodoro`;
  }
  function start() { if(running)return; running=true; endAt=Date.now()+remaining*1000; intervalId=setInterval(tick,250); render(); }
  function pause() { if(!running)return; remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000)); running=false; clearInterval(intervalId); render(); }
  function reset() { running=false; clearInterval(intervalId); remaining=duration(); render(); }
  function tick() { remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000)); if(remaining<=0) completePhase(); render(); }
  function completePhase() {
    clearInterval(intervalId);
    if(mode==='work'){ completed+=1; saveCount(); }
    playSound(); mode=mode==='work'?'break':'work'; remaining=duration(); running=true; endAt=Date.now()+remaining*1000; intervalId=setInterval(tick,250);
  }
  function playSound() {
    try { const AudioContext=window.AudioContext||window.webkitAudioContext; const ctx=new AudioContext(); [0,.18].forEach((delay)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=660;gain.gain.setValueAtTime(.001,ctx.currentTime+delay);gain.gain.exponentialRampToValueAtTime(.18,ctx.currentTime+delay+.02);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+delay+.16);osc.connect(gain).connect(ctx.destination);osc.start(ctx.currentTime+delay);osc.stop(ctx.currentTime+delay+.18);}); } catch (_) { /* Audio may be unavailable until user interaction. */ }
  }
  function setPanel(open) { elements.panel.hidden=!open; elements.toggle.setAttribute('aria-expanded',String(open)); if(open)elements.work.focus(); }
  elements.start.addEventListener('click',start); elements.pause.addEventListener('click',pause); elements.reset.addEventListener('click',reset);
  elements.toggle.addEventListener('click',()=>setPanel(elements.panel.hidden)); elements.close.addEventListener('click',()=>setPanel(false));
  elements.form.addEventListener('submit',(event)=>{ event.preventDefault(); if(!validMinutes(elements.work.value,180)||!validMinutes(elements.break.value,60)){elements.error.textContent='作業時間は1〜180分、休憩時間は1〜60分で入力してください。';return;} settings={workMinutes:Number(elements.work.value),breakMinutes:Number(elements.break.value)}; localStorage.setItem(STORAGE_KEY,JSON.stringify(settings)); elements.error.textContent=''; reset(); setPanel(false); });
  elements.work.value=settings.workMinutes; elements.break.value=settings.breakMinutes; render();
}());
