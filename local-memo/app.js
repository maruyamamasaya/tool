(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.document) api.start(root.document, root);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const NOTES_KEY = "local-memo.notes.v1";
  const HISTORY_KEY = "local-memo.history.v1";
  const SNAPSHOT_INTERVAL = 60 * 1000;
  const MAX_HISTORY = 5;

  const normalizeNote = (value) => {
    if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
    const createdAt = validDate(value.createdAt) ? value.createdAt : new Date().toISOString();
    return { id:value.id, title:typeof value.title === "string" ? value.title : "", content:typeof value.content === "string" ? value.content : "", createdAt, updatedAt:validDate(value.updatedAt) ? value.updatedAt : createdAt };
  };
  const validDate = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
  const validateBackup = (value) => {
    const source = Array.isArray(value) ? value : value && Array.isArray(value.notes) ? value.notes : null;
    if (!source) throw new Error("メモ配列を含むバックアップではありません。");
    const notes = source.map(normalizeNote);
    if (notes.some((note) => !note)) throw new Error("メモの形式が正しくありません。");
    if (new Set(notes.map((note) => note.id)).size !== notes.length) throw new Error("重複したメモIDがあります。");
    return notes;
  };
  const sortNotes = (notes) => [...notes].sort((a,b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const snapshotHistory = (history, notes, at) => [{ id:`snapshot-${at}`, createdAt:new Date(at).toISOString(), notes:JSON.parse(JSON.stringify(notes)) }, ...history].slice(0,MAX_HISTORY);

  function start(document, window) {
    const $ = (id) => document.getElementById(id);
    const elements = { list:$("note-list"), count:$("note-count"), title:$("note-title"), content:$("note-content"), fields:$("editor-fields"), empty:$("empty-state"), status:$("save-status"), message:$("message"), historyList:$("history-list") };
    let notes = load(NOTES_KEY, []).map(normalizeNote).filter(Boolean);
    let history = load(HISTORY_KEY, []);
    let selectedId = notes[0]?.id || null;
    let saveTimer = null;
    let lastSnapshotAt = history[0] ? Date.parse(history[0].createdAt) : 0;

    function load(key, fallback) { try { const parsed=JSON.parse(window.localStorage.getItem(key)); return parsed ?? fallback; } catch (_) { return fallback; } }
    function notify(text, error=false) { elements.message.textContent=text; elements.message.hidden=false; elements.message.classList.toggle("error",error); window.clearTimeout(notify.timer); notify.timer=window.setTimeout(()=>{ elements.message.hidden=true; },4500); }
    function persist({ forceSnapshot=false }={}) {
      window.clearTimeout(saveTimer);
      try {
        window.localStorage.setItem(NOTES_KEY,JSON.stringify(notes));
        const now=Date.now();
        if (forceSnapshot || (now-lastSnapshotAt >= SNAPSHOT_INTERVAL)) {
          history=snapshotHistory(history,notes,now);
          window.localStorage.setItem(HISTORY_KEY,JSON.stringify(history));
          lastSnapshotAt=now;
        }
        elements.status.textContent=`自動保存済み ${formatTime(new Date())}`;
        return true;
      } catch (_) { elements.status.textContent="保存できませんでした"; notify("保存容量が不足しています。JSONを書き出して不要なデータを整理してください。",true); return false; }
    }
    function formatTime(date) { return new Intl.DateTimeFormat("ja-JP",{hour:"2-digit",minute:"2-digit"}).format(date); }
    function formatDate(value) { return new Intl.DateTimeFormat("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value)); }
    function current() { return notes.find((note)=>note.id===selectedId); }
    function render() {
      notes=sortNotes(notes);
      elements.list.textContent="";
      notes.forEach((note)=>{ const li=document.createElement("li"); li.className=`note-item${note.id===selectedId?" active":""}`; const button=document.createElement("button"); button.type="button"; const name=document.createElement("span"); name.className="note-name"; name.textContent=note.title.trim()||"無題のメモ"; const date=document.createElement("span"); date.className="note-date"; date.textContent=formatDate(note.updatedAt); button.append(name,date); button.addEventListener("click",()=>{ selectedId=note.id; render(); closeSidebar(); }); li.append(button); elements.list.append(li); });
      elements.count.textContent=`${notes.length}件`;
      const note=current(); elements.fields.hidden=!note; elements.empty.hidden=Boolean(note);
      if(note){ elements.title.value=note.title; elements.content.value=note.content; }
    }
    function addNote() { const now=new Date().toISOString(); const id=window.crypto?.randomUUID?.() || `note-${Date.now()}-${Math.random().toString(16).slice(2)}`; notes.push({id,title:"",content:"",createdAt:now,updatedAt:now}); selectedId=id; persist({forceSnapshot:true}); render(); elements.title.focus(); closeSidebar(); }
    function updateCurrent() { const note=current(); if(!note)return; note.title=elements.title.value; note.content=elements.content.value; note.updatedAt=new Date().toISOString(); elements.status.textContent="保存中…"; window.clearTimeout(saveTimer); saveTimer=window.setTimeout(()=>{ persist(); render(); },500); }
    function replaceNotes(next) { notes=sortNotes(next); selectedId=notes[0]?.id||null; if(persist({forceSnapshot:true})){ render(); notify("メモを復元しました。"); } }
    function closeSidebar(){ document.body.classList.remove("sidebar-open"); $("menu-button").setAttribute("aria-expanded","false"); }
    function showHistory(){ elements.historyList.textContent=""; if(!history.length){ const p=document.createElement("p"); p.className="history-empty"; p.textContent="バックアップ履歴はまだありません。"; elements.historyList.append(p); } history.forEach((item)=>{ const row=document.createElement("div"); row.className="history-item"; const info=document.createElement("div"); const strong=document.createElement("strong"); strong.textContent=new Date(item.createdAt).toLocaleString("ja-JP"); const p=document.createElement("p"); p.textContent=`${item.notes.length}件のメモ`; info.append(strong,p); const button=document.createElement("button"); button.type="button"; button.textContent="復元"; button.addEventListener("click",()=>{ if(window.confirm("現在のメモをこのバックアップで上書きしますか？")){ replaceNotes(validateBackup(item.notes)); $("history-dialog").close(); } }); row.append(info,button); elements.historyList.append(row); }); $("history-dialog").showModal(); }

    $("new-note").addEventListener("click",addNote);
    elements.title.addEventListener("input",updateCurrent); elements.content.addEventListener("input",updateCurrent);
    $("save-button").addEventListener("click",()=>{ if(persist({forceSnapshot:true}))notify("保存しました。"); });
    $("delete-note").addEventListener("click",()=>{ const note=current(); if(note&&window.confirm(`「${note.title.trim()||"無題のメモ"}」を削除しますか？`)){ notes=notes.filter((item)=>item.id!==note.id); selectedId=sortNotes(notes)[0]?.id||null; persist({forceSnapshot:true}); render(); notify("メモを削除しました。"); } });
    $("menu-button").addEventListener("click",()=>{ const open=document.body.classList.toggle("sidebar-open"); $("menu-button").setAttribute("aria-expanded",String(open)); }); $("sidebar-overlay").addEventListener("click",closeSidebar);
    $("backup-button").addEventListener("click",()=>$("backup-dialog").showModal()); $("history-button").addEventListener("click",showHistory);
    document.querySelectorAll(".dialog-close").forEach((button)=>button.addEventListener("click",()=>button.closest("dialog").close()));
    $("export-button").addEventListener("click",()=>{ persist(); const data={version:1,exportedAt:new Date().toISOString(),notes:sortNotes(notes)}; const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const link=document.createElement("a"); link.href=URL.createObjectURL(blob); link.download=`notes-backup-${new Date().toISOString().slice(0,10)}.json`; link.click(); window.setTimeout(()=>URL.revokeObjectURL(link.href),0); notify("JSONバックアップを書き出しました。"); });
    $("import-button").addEventListener("click",()=>$("import-file").click());
    $("import-file").addEventListener("change",async(event)=>{ const file=event.target.files[0]; event.target.value=""; if(!file)return; try { const restored=validateBackup(JSON.parse(await file.text())); if(window.confirm("現在のメモを選択したバックアップで上書きしますか？")){ replaceNotes(restored); $("backup-dialog").close(); } } catch(error){ notify(`復元できません: ${error.message}`,true); } });
    window.addEventListener("beforeunload",()=>persist());
    if(!notes.length)addNote(); else render();
  }
  return { normalizeNote, validateBackup, sortNotes, snapshotHistory, MAX_HISTORY };
});
