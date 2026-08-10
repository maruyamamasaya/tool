const assert = require("assert");
const { start, normalizeNote, validateBackup, sortNotes, snapshotHistory, MAX_HISTORY } = require("./app.js");

assert.strictEqual(typeof start,"function");
const old = { id:"old", title:"Old", content:"a", createdAt:"2026-01-01T00:00:00.000Z", updatedAt:"2026-01-01T00:00:00.000Z" };
const recent = { ...old, id:"recent", title:"Recent", updatedAt:"2026-08-10T09:18:00.000Z" };
assert.deepStrictEqual(sortNotes([old,recent]).map((note)=>note.id),["recent","old"]);
assert.strictEqual(normalizeNote({ id:"x", createdAt:old.createdAt, updatedAt:old.updatedAt }).content,"");
assert.deepStrictEqual(validateBackup({ notes:[old] }),[old]);
assert.throws(()=>validateBackup({ hello:"world" }),/バックアップ/);
assert.throws(()=>validateBackup({ notes:[old,old] }),/重複/);
let history=[];
for(let index=0;index<8;index+=1) history=snapshotHistory(history,[old],Date.UTC(2026,0,index+1));
assert.strictEqual(history.length,MAX_HISTORY);
assert.strictEqual(history[0].createdAt,"2026-01-08T00:00:00.000Z");
console.log("Local Memo tests passed");
