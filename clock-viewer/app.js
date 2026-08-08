(function(){
  "use strict";
  const KEY="clock-viewer.v1";
  const defaults={theme:"dark",showSeconds:true,showDate:true,showWeekday:true,showCountdown:true,targetTime:"",mode:"clock",layout:"auto"};
  function load(storage){try{return {...defaults,...JSON.parse(storage.getItem(KEY)||"{}")};}catch(_){return {...defaults};}}
  function targetDate(now,time){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return null;const [h,m]=time.split(":").map(Number);const target=new Date(now);target.setHours(h,m,0,0);if(target.getTime()<now.getTime()-999)target.setDate(target.getDate()+1);return target;}
  function remainingInfo(now,time){const target=targetDate(now,time);if(!target)return null;const ms=target-now;if(ms<=999)return {reached:true,text:"時間になりました",detail:"",target};if(ms<60000)return {reached:false,text:`あと${Math.ceil(ms/1000)}秒`,detail:"",target};const minutes=Math.ceil(ms/60000);return {reached:false,text:`あと${minutes}分`,detail:minutes>=60?`${Math.floor(minutes/60)}時間${minutes%60}分`:"",target};}
  function pad(n){return String(n).padStart(2,"0");}
  function quickTarget(now,minutes){const date=new Date(now.getTime()+minutes*60000);return `${pad(date.getHours())}:${pad(date.getMinutes())}`;}
  if(typeof module!=="undefined")module.exports={targetDate,remainingInfo,quickTarget,load};
  if(typeof document==="undefined")return;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  let state=load(localStorage), idleTimer;
  const app=$("#app"), settings=$("#settings"), backdrop=$("#backdrop"), note=$("#orientationNote");
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function apply(){document.documentElement.dataset.theme=state.theme;app.dataset.mode=state.mode;app.dataset.layout=state.layout;$("#seconds").classList.toggle("is-hidden",!state.showSeconds);$("#date").classList.toggle("is-hidden",!state.showDate);$("#weekday").classList.toggle("is-hidden",!state.showWeekday);$("#calendar").classList.toggle("is-hidden",!state.showDate&&!state.showWeekday);$("#countdownBlock").classList.toggle("is-hidden",!state.showCountdown);$("#targetTime").value=state.targetTime;["showSeconds","showDate","showWeekday","showCountdown"].forEach(k=>$("#"+k).checked=state[k]);$$('[data-theme],[data-mode],[data-layout]').forEach(b=>b.classList.toggle("active",b.dataset.theme===state.theme||b.dataset.mode===state.mode||b.dataset.layout===state.layout));save();tick();}
  function tick(){const now=new Date();$("#clock").textContent=`${pad(now.getHours())}:${pad(now.getMinutes())}`;$("#seconds").textContent=`:${pad(now.getSeconds())}`;$("#date").textContent=`${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())}`;$("#weekday").textContent=`${["日","月","火","水","木","金","土"][now.getDay()]}曜日`;const info=remainingInfo(now,state.targetTime);$("#targetLabel").textContent=info?`${state.targetTime}まで`:"目標時刻を設定";$("#remaining").textContent=info?info.text:"あと--分";$("#remainingDetail").textContent=info?info.detail:"設定から時刻を選択できます";$("#countdownBlock").classList.toggle("reached",!!info?.reached);}
  function openSettings(open){settings.classList.toggle("open",open);settings.setAttribute("aria-hidden",String(!open));$("#settingsButton").setAttribute("aria-expanded",String(open));backdrop.hidden=!open;resetIdle();}
  function resetIdle(){const dock=$("#quickDock");dock.classList.remove("idle");clearTimeout(idleTimer);if(!settings.classList.contains("open"))idleTimer=setTimeout(()=>dock.classList.add("idle"),4000);}
  function setTarget(value){if(value){state.targetTime=value;state.showCountdown=true;apply();}}
  function toggleFullscreen(){const root=document.documentElement;if(!document.fullscreenElement){const request=root.requestFullscreen||root.webkitRequestFullscreen;if(request)request.call(root).catch?.(()=>{});}else{(document.exitFullscreen||document.webkitExitFullscreen)?.call(document);}}
  async function setLayout(layout){state.layout=layout;note.textContent="";apply();if(screen.orientation){try{if(layout==="auto")screen.orientation.unlock();else await screen.orientation.lock(layout);}catch(_){note.textContent="画面固定には対応していないため、レイアウトのみ変更しました。";}}}
  $("#settingsButton").addEventListener("click",e=>{e.stopPropagation();openSettings(true);});$("#closeSettings").addEventListener("click",()=>openSettings(false));backdrop.addEventListener("click",()=>openSettings(false));
  $("#displayTap").addEventListener("click",()=>{state.mode=state.mode==="clock"?"countdown":"clock";apply();});
  $("#setTarget").addEventListener("click",()=>setTarget($("#targetTime").value));$("#targetTime").addEventListener("change",e=>setTarget(e.target.value));$("#clearTarget").addEventListener("click",()=>{state.targetTime="";apply();});
  $$("[data-add]").forEach(b=>b.addEventListener("click",()=>setTarget(quickTarget(new Date(),Number(b.dataset.add)))));
  $$("[data-theme]").forEach(b=>b.addEventListener("click",()=>{state.theme=b.dataset.theme;apply();}));$$("[data-mode]").forEach(b=>b.addEventListener("click",()=>{state.mode=b.dataset.mode;apply();}));$$("[data-layout]").forEach(b=>b.addEventListener("click",()=>setLayout(b.dataset.layout)));
  ["showSeconds","showDate","showWeekday","showCountdown"].forEach(k=>$("#"+k).addEventListener("change",e=>{state[k]=e.target.checked;apply();}));
  $("#fullscreen").addEventListener("click",toggleFullscreen);$("#fullscreenQuick").addEventListener("click",e=>{e.stopPropagation();toggleFullscreen();});document.addEventListener("fullscreenchange",()=>$("#fullscreen").textContent=document.fullscreenElement?"× フルスクリーンを終了":"⛶ フルスクリーンで表示");
  ["pointerdown","pointermove","keydown"].forEach(name=>document.addEventListener(name,resetIdle,{passive:true}));apply();setInterval(tick,250);resetIdle();
})();
