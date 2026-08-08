"use strict";

const DATA={surnames:["田中","佐藤","鈴木","高橋","伊藤","渡辺","山本","中村"],givenNames:["太郎","花子","一郎","美咲","健太","さくら","直樹","結衣"],prefectures:["北海道","東京都","神奈川県","愛知県","京都府","大阪府","福岡県","沖縄県"],statuses:["active","inactive","pending","completed"],domains:["example.com","test.jp","sample.dev"],words:["sample","testing","project","system","account","order","update","preview"],jaTargets:["ユーザー情報","注文データ","システム設定","テスト環境","アカウント","商品情報"],jaActions:["を確認しています","を更新しました","の登録が完了しました","をテストしています","を準備しました"],jaDetails:["正常に処理されることを確認してください","開発環境での動作確認に使用できます","次の工程へ進む準備が整いました","入力内容に問題がないことを確認しました"],enSubjects:["The user profile","The order data","The system settings","This sample record","The test environment"],enActions:["was updated successfully","is ready for review","has been created","is being validated","was processed correctly"],types:["Number","Text","Name","Email","Date","Boolean","Status","Prefecture","Price","ID"]};
const defaults=[{name:"id",type:"Number"},{name:"name",type:"Name"},{name:"email",type:"Email"},{name:"status",type:"Status"},{name:"createdAt",type:"Date"},{name:"enabled",type:"Boolean"},{name:"prefecture",type:"Prefecture"},{name:"price",type:"Price"},{name:"code",type:"ID"},{name:"note",type:"Text"}];
const pick=items=>items[Math.floor(Math.random()*items.length)];
const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number.parseInt(value,10)||min));

function generateSentence(language="ja",length="normal"){
  const useEnglish=language==="en";
  let sentence=useEnglish?`${pick(DATA.enSubjects)} ${pick(DATA.enActions)}.`:`${pick(DATA.jaTargets)}${pick(DATA.jaActions)}。`;
  if(length!=="short") sentence+=useEnglish?` Please use it to verify the ${pick(DATA.words)} workflow.`:` ${pick(DATA.jaDetails)}。`;
  if(length==="long") sentence+=useEnglish?` The generated content can be safely replaced after the development process is complete.`:` この文章はテスト用のサンプルとして生成され、開発完了後に置き換えることができます。`;
  if(language==="mixed") sentence+=` [${pick(DATA.words)}-${Math.floor(Math.random()*900+100)}]`;
  return sentence;
}
function generateText(count,length,language){return Array.from({length:clamp(count,1,10)},()=>generateSentence(language,length)).join("\n");}
function csvEscape(value){const text=String(value);return /[",\r\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;}
function randomDate(){const start=new Date(2024,0,1).getTime(),end=new Date(2026,11,31).getTime();return new Date(start+Math.random()*(end-start)).toISOString().slice(0,10);}
function valueFor(type,index){const surname=pick(DATA.surnames),given=pick(DATA.givenNames);switch(type){case"Number":return index+1;case"Name":return surname+given;case"Email":return `${pick(["tanaka","sato","suzuki","takahashi","user"])}${String(index+1).padStart(2,"0")}@${pick(DATA.domains)}`;case"Date":return randomDate();case"Boolean":return pick(["true","false"]);case"Status":return pick(DATA.statuses);case"Prefecture":return pick(DATA.prefectures);case"Price":return Math.floor(Math.random()*1000+1)*100;case"ID":return `ID-${String(Math.floor(Math.random()*999999)).padStart(6,"0")}`;default:return `${pick(DATA.words)} ${pick(DATA.words)}, ${index+1}`;}}
function generateCsv(columns,rowCount){const clean=columns.map((column,index)=>({name:column.name.trim()||`column_${index+1}`,type:column.type}));const rows=[clean.map(c=>csvEscape(c.name)).join(",")];for(let i=0;i<clamp(rowCount,1,10);i++)rows.push(clean.map(c=>csvEscape(valueFor(c.type,i))).join(","));return rows.join("\n");}

if(typeof document!=="undefined"){
  const $=id=>document.getElementById(id);let toastTimer;
  function switchTab(mode){const text=mode==="text";$("textPanel").hidden=!text;$("csvPanel").hidden=text;$("textTab").classList.toggle("active",text);$("csvTab").classList.toggle("active",!text);$("textTab").setAttribute("aria-selected",text);$("csvTab").setAttribute("aria-selected",!text);}
  function normalize(input){input.value=clamp(input.value,Number(input.min),Number(input.max));return Number(input.value);}
  function renderColumns(){const count=normalize($("columnCount")),existing=[...document.querySelectorAll(".column-row")].map(row=>({name:row.querySelector("input").value,type:row.querySelector("select").value}));$("columnSettings").innerHTML="";for(let i=0;i<count;i++){const config=existing[i]||defaults[i],row=document.createElement("div");row.className="column-row";row.innerHTML=`<strong>${i+1}</strong><input aria-label="カラム${i+1}の名前" value="${config.name}"><select aria-label="カラム${i+1}の型">${DATA.types.map(type=>`<option${type===config.type?" selected":""}>${type}</option>`).join("")}</select>`;$("columnSettings").append(row);}}
  function makeText(){const count=normalize($("sentenceCount"));$("textOutput").value=generateText(count,$("textLength").value,$("textLanguage").value);$("textMeta").textContent=`${count} 文章・${$("textOutput").value.length} 文字`;}
  function columns(){return [...document.querySelectorAll(".column-row")].map(row=>({name:row.querySelector("input").value,type:row.querySelector("select").value}));}
  function makeCsv(){const rows=normalize($("rowCount"));$("csvOutput").value=generateCsv(columns(),rows);$("csvMeta").textContent=`${columns().length} カラム × ${rows} 行`;}
  function clear(output,meta){$(output).value="";$(meta).textContent="";}
  async function copy(output){if(!$(output).value)return;try{await navigator.clipboard.writeText($(output).value);}catch{ $(output).select();document.execCommand("copy");}$("toast").hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").hidden=true,1800);}
  $("textTab").addEventListener("click",()=>switchTab("text"));$("csvTab").addEventListener("click",()=>switchTab("csv"));$("columnCount").addEventListener("change",renderColumns);$("generateText").addEventListener("click",makeText);$("regenerateText").addEventListener("click",makeText);$("copyText").addEventListener("click",()=>copy("textOutput"));$("clearText").addEventListener("click",()=>clear("textOutput","textMeta"));$("generateCsv").addEventListener("click",makeCsv);$("regenerateCsv").addEventListener("click",makeCsv);$("copyCsv").addEventListener("click",()=>copy("csvOutput"));$("clearCsv").addEventListener("click",()=>clear("csvOutput","csvMeta"));renderColumns();makeText();makeCsv();
}
if(typeof module!=="undefined")module.exports={clamp,generateSentence,generateText,csvEscape,valueFor,generateCsv};
