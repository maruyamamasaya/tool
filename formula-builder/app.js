(function () {
  "use strict";

  const CATEGORIES = ["集計", "条件", "条件付き集計", "検索・参照", "文字列", "日付", "数値", "データ整理"];
  const f = (name, category, description, syntax, fields, example, exampleText, keywords = [], note = "") => ({ name, category, description, syntax, fields, example, exampleText, keywords, note });
  const field = (key, label, placeholder, required = true, type = "text", options = []) => ({ key, label, placeholder, required, type, options });
  const range = [field("range", "対象範囲", "A1:A10")];
  const FUNCTIONS = [
    f("SUM","集計","指定した範囲の数値をすべて合計します。","SUM(数値1, [数値2], …)",range,"=SUM(A1:A10)","A1からA10までの数値を合計します。",["合計","足す","総計"]),
    f("AVERAGE","集計","指定した範囲の数値の平均を求めます。","AVERAGE(数値1, [数値2], …)",range,"=AVERAGE(B2:B20)","B2からB20までの平均を求めます。",["平均"]),
    f("MAX","集計","範囲の中から最も大きい数値を返します。","MAX(数値1, [数値2], …)",range,"=MAX(C2:C50)","C列の最大値を返します。",["最大","一番大きい"]),
    f("MIN","集計","範囲の中から最も小さい数値を返します。","MIN(数値1, [数値2], …)",range,"=MIN(C2:C50)","C列の最小値を返します。",["最小","一番小さい"]),
    f("COUNT","集計","範囲に含まれる数値セルの個数を数えます。","COUNT(値1, [値2], …)",range,"=COUNT(A2:A100)","数値が入ったセルを数えます。",["件数","数える","数字"]),
    f("COUNTA","集計","空白ではないセルの個数を数えます。","COUNTA(値1, [値2], …)",range,"=COUNTA(A2:A100)","文字や数値が入ったセルを数えます。",["件数","空白以外","入力済み"]),
    f("IF","条件","条件によって返す値を切り替えます。","IF(論理式, TRUEの場合, FALSEの場合)",[field("cell","対象セル","A1"),field("operator","条件",">=",true,"select",["=",">=","<=",">","<","<>"]),field("compare","比較する値","100"),field("trueValue","TRUEの場合","\"OK\""),field("falseValue","FALSEの場合","\"NG\"")],"=IF(A1>=100,\"OK\",\"NG\")","A1が100以上なら「OK」、それ以外なら「NG」を返します。",["もし","条件","分岐","なら"]),
    f("IFS","条件","複数の条件を上から順に判定し、最初に合う値を返します。","IFS(条件1, 値1, [条件2, 値2], …)",[field("condition1","条件1","A1>=80"),field("value1","条件1の結果","\"A\""),field("condition2","条件2","A1>=60",false),field("value2","条件2の結果","\"B\"",false)],"=IFS(A1>=80,\"A\",A1>=60,\"B\",TRUE,\"C\")","点数を上から順に評価します。",["複数条件","分岐","評価"]),
    f("AND","条件","すべての条件を満たすとTRUEを返します。","AND(論理式1, [論理式2], …)",[field("condition1","条件1","A1>=10"),field("condition2","条件2","A1<=20")],"=AND(A1>=10,A1<=20)","A1が10以上かつ20以下か確認します。",["かつ","すべて","条件"]),
    f("OR","条件","どれか1つの条件を満たすとTRUEを返します。","OR(論理式1, [論理式2], …)",[field("condition1","条件1","A1=\"東京\""),field("condition2","条件2","A1=\"大阪\"")],"=OR(A1=\"東京\",A1=\"大阪\")","A1が東京または大阪か確認します。",["または","どれか","条件"]),
    f("IFERROR","条件","数式がエラーになったとき、代わりの値を返します。","IFERROR(値, エラーの場合の値)",[field("value","数式・値","A1/B1"),field("fallback","エラーの場合","\"-\"")],"=IFERROR(A1/B1,\"-\")","割り算がエラーなら「-」を表示します。",["エラー","代替","空欄"]),
    f("COUNTIF","条件付き集計","1つの条件に合うセルの個数を数えます。","COUNTIF(条件範囲, 条件)",[field("criteriaRange","条件範囲","A2:A100"),field("criteria","条件","\"東京\"")],"=COUNTIF(A2:A100,\"東京\")","「東京」と入力されたセルを数えます。",["条件に合う件数","数える","件数"]),
    f("COUNTIFS","条件付き集計","複数の条件すべてに合う行の個数を数えます。","COUNTIFS(条件範囲1, 条件1, …)",[field("range1","条件範囲1","A2:A100"),field("criteria1","条件1","\"東京\""),field("range2","条件範囲2","B2:B100"),field("criteria2","条件2",">=100")],"=COUNTIFS(A2:A100,\"東京\",B2:B100,\">=100\")","東京かつ100以上の行を数えます。",["複数条件","件数","条件に合う件数"]),
    f("SUMIF","条件付き集計","1つの条件に合う値だけを合計します。","SUMIF(条件範囲, 条件, [合計範囲])",[field("criteriaRange","条件範囲","A2:A100"),field("criteria","条件","\"東京\""),field("sumRange","合計範囲","B2:B100",false)],"=SUMIF(A2:A100,\"東京\",B2:B100)","東京の行にある金額だけを合計します。",["合計","条件付き合計"]),
    f("SUMIFS","条件付き集計","複数の条件すべてに合う値だけを合計します。","SUMIFS(合計範囲, 条件範囲1, 条件1, …)",[field("sumRange","合計範囲","C2:C100"),field("range1","条件範囲1","A2:A100"),field("criteria1","条件1","\"東京\""),field("range2","条件範囲2","B2:B100"),field("criteria2","条件2","\">=100\"")],"=SUMIFS(C2:C100,A2:A100,\"東京\",B2:B100,\">=100\")","東京かつ100以上の行の金額を合計します。",["合計","複数条件","条件付き合計"]),
    f("XLOOKUP","検索・参照","検索範囲から値を探し、対応する別の範囲の値を返します。","XLOOKUP(検索値, 検索範囲, 戻り範囲, [見つからない場合])",[field("lookup","検索値","A2"),field("lookupRange","検索範囲","D2:D100"),field("returnRange","戻り範囲","E2:E100"),field("notFound","見つからない場合","\"\"",false)],"=XLOOKUP(A2,D2:D100,E2:E100,\"\")","D列でA2を探し、同じ行のE列の値を返します。",["検索","別表から値を持ってくる","参照","探す"],"Excel 2021 / Microsoft 365 と Google Sheets で使用できます。古いExcelではVLOOKUPをご利用ください。"),
    f("VLOOKUP","検索・参照","表の左端で値を探し、指定した列の値を返します。","VLOOKUP(検索値, 範囲, 列番号, 検索方法)",[field("lookup","検索値","A2"),field("table","検索する表","D2:F100"),field("column","列番号","2"),field("match","検索方法","FALSE",true,"select",["FALSE","TRUE"])],"=VLOOKUP(A2,D2:F100,2,FALSE)","表の左端でA2を完全一致検索し、2列目を返します。",["検索","別表から値を持ってくる","参照"]),
    f("INDEX","検索・参照","範囲内の行・列位置を指定して値を取り出します。","INDEX(範囲, 行番号, [列番号])",[field("range","範囲","A2:C100"),field("row","行番号","3"),field("column","列番号","2",false)],"=INDEX(A2:C100,3,2)","範囲の3行目・2列目の値を返します。",["参照","位置","取り出す"]),
    f("MATCH","検索・参照","検索値が範囲の何番目にあるかを返します。","MATCH(検索値, 検索範囲, 照合方法)",[field("lookup","検索値","A2"),field("range","検索範囲","D2:D100"),field("match","照合方法","0",true,"select",["0","1","-1"])],"=MATCH(A2,D2:D100,0)","D列でA2と完全一致する位置を返します。",["検索","何番目","位置"]),
    f("LEFT","文字列","文字列の左端から指定した文字数を取り出します。","LEFT(文字列, [文字数])",[field("text","文字列・セル","A1"),field("count","文字数","3",false)],"=LEFT(A1,3)","A1の左から3文字を取り出します。",["文字","左","取り出す"]),
    f("RIGHT","文字列","文字列の右端から指定した文字数を取り出します。","RIGHT(文字列, [文字数])",[field("text","文字列・セル","A1"),field("count","文字数","4",false)],"=RIGHT(A1,4)","A1の右から4文字を取り出します。",["文字","右","取り出す"]),
    f("MID","文字列","文字列の途中から指定した文字数を取り出します。","MID(文字列, 開始位置, 文字数)",[field("text","文字列・セル","A1"),field("start","開始位置","2"),field("count","文字数","3")],"=MID(A1,2,3)","A1の2文字目から3文字を取り出します。",["文字","途中","取り出す"]),
    f("LEN","文字列","文字列に含まれる文字数を数えます。","LEN(文字列)",[field("text","文字列・セル","A1")],"=LEN(A1)","A1の文字数を返します。",["文字数","長さ","数える"]),
    f("TRIM","文字列","余分な空白を取り除き、単語間を1つの空白に整えます。","TRIM(文字列)",[field("text","文字列・セル","A1")],"=TRIM(A1)","A1の前後や連続した余分な空白を整えます。",["空白を消す","スペース","整える"]),
    f("CONCAT","文字列","複数の文字列や範囲を1つにつなげます。","CONCAT(文字列1, [文字列2], …)",[field("text1","文字列1","A1"),field("text2","文字列2","B1")],"=CONCAT(A1,B1)","A1とB1の内容をつなげます。",["文字","結合","つなぐ"]),
    f("TEXTJOIN","文字列","区切り文字を入れながら複数の文字列をつなげます。","TEXTJOIN(区切り文字, 空白を無視, 文字列1, …)",[field("delimiter","区切り文字","\",\""),field("ignore","空白を無視","TRUE",true,"select",["TRUE","FALSE"]),field("text","文字列・範囲","A1:A10")],"=TEXTJOIN(\",\",TRUE,A1:A10)","空白を飛ばし、カンマ区切りでつなげます。",["文字","結合","区切り","つなぐ"]),
    f("TODAY","日付","今日の日付を自動で返します。","TODAY()",[],"=TODAY()","ファイルを開いた日の年月日を表示します。",["今日","日付","現在"]),
    f("NOW","日付","現在の日付と時刻を自動で返します。","NOW()",[],"=NOW()","現在の年月日と時刻を表示します。",["今","日時","時刻","現在"]),
    f("YEAR","日付","日付から年だけを取り出します。","YEAR(日付)",[field("date","日付・セル","A1")],"=YEAR(A1)","A1の日付から年を返します。",["日付","年"]),
    f("MONTH","日付","日付から月だけを取り出します。","MONTH(日付)",[field("date","日付・セル","A1")],"=MONTH(A1)","A1の日付から月を返します。",["日付","月"]),
    f("DAY","日付","日付から日だけを取り出します。","DAY(日付)",[field("date","日付・セル","A1")],"=DAY(A1)","A1の日付から日を返します。",["日付","日"]),
    f("ROUND","数値","数値を指定した桁数で四捨五入します。","ROUND(数値, 桁数)",[field("number","数値・セル","A1"),field("digits","桁数","0")],"=ROUND(A1,0)","A1の数値を整数に四捨五入します。",["四捨五入","丸める"]),
    f("ROUNDUP","数値","数値を指定した桁数で切り上げます。","ROUNDUP(数値, 桁数)",[field("number","数値・セル","A1"),field("digits","桁数","0")],"=ROUNDUP(A1,0)","A1の数値を整数に切り上げます。",["切り上げ","丸める"]),
    f("ROUNDDOWN","数値","数値を指定した桁数で切り捨てます。","ROUNDDOWN(数値, 桁数)",[field("number","数値・セル","A1"),field("digits","桁数","0")],"=ROUNDDOWN(A1,0)","A1の数値を整数に切り捨てます。",["切り捨て","丸める"]),
    f("FILTER","データ整理","条件に合う行や列だけを抜き出します。","FILTER(範囲, 条件, [該当なし])",[field("range","抽出する範囲","A2:C100"),field("condition","条件","C2:C100>=100"),field("empty","該当なし","\"該当なし\"",false)],"=FILTER(A2:C100,C2:C100>=100,\"該当なし\")","C列が100以上の行だけを抽出します。",["絞り込み","抽出","条件に合う","行を抜き出す"],"結果は複数セルに自動展開されます。展開先を空けておいてください。"),
    f("SORT","データ整理","範囲を指定した列の順番で並べ替えます。","SORT(範囲, [並べ替え列], [昇順])",[field("range","並べ替える範囲","A2:C100"),field("column","並べ替え列","2",false),field("ascending","順序","TRUE",false,"select",["TRUE","FALSE"])],"=SORT(A2:C100,2,TRUE)","範囲を2列目の昇順で並べ替えます。",["並べ替え","昇順","降順","ソート"]),
    f("UNIQUE","データ整理","範囲から重複した値を除き、固有の値だけを返します。","UNIQUE(範囲)",[field("range","対象範囲","A2:A100")],"=UNIQUE(A2:A100)","A列から重複を除いた一覧を作ります。",["重複","重複を消す","一意","ユニーク"],"結果は複数セルに自動展開されます。展開先を空けておいてください。")
  ];

  const $ = (selector) => document.querySelector(selector);
  const storage = { get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } }, set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} } };
  let current = FUNCTIONS[0], selectedCategory = "", service = storage.get("formula-builder-service", "excel");
  let favorites = storage.get("formula-builder-favorites", []), recents = storage.get("formula-builder-recents", []);

  function formulaFor(fn) {
    const values = Object.fromEntries(fn.fields.map((item) => [item.key, ($(`[name="${item.key}"]`) || {}).value?.trim() || ""]));
    if (fn.name === "IF") return `=IF(${values.cell}${values.operator}${values.compare},${values.trueValue},${values.falseValue})`;
    const args = fn.fields.map((item) => values[item.key]);
    while (args.length && !args.at(-1)) args.pop();
    return `=${fn.name}(${args.join(",")})`;
  }
  function isComplete(fn) { return fn.fields.every((item) => !item.required || ($(`[name="${item.key}"]`)?.value.trim())); }
  function renderCategories() { $("#categories").innerHTML = CATEGORIES.map((c) => `<button class="category ${c === selectedCategory ? "active" : ""}" data-category="${c}" type="button">${c}</button>`).join(""); }
  function filteredFunctions() { const q = $("#search").value.trim().toLowerCase(); return FUNCTIONS.filter((fn) => (!selectedCategory || fn.category === selectedCategory) && (!q || [fn.name,fn.category,fn.description,...fn.keywords].join(" ").toLowerCase().includes(q))); }
  function renderList() { const items = filteredFunctions(); $("#resultCount").textContent = `${items.length} FUNCTIONS`; $("#listTitle").textContent = selectedCategory || ($("#search").value ? "検索結果" : "すべての関数"); $("#functionList").innerHTML = items.length ? items.map((fn) => `<button class="function-item ${fn.name === current.name ? "active" : ""} ${favorites.includes(fn.name) ? "favorite" : ""}" data-name="${fn.name}" role="option" aria-selected="${fn.name === current.name}" type="button"><span class="mini-star">${favorites.includes(fn.name) ? "★" : "☆"}</span><strong>${fn.name}</strong><small>${fn.category}</small></button>`).join("") : `<p class="no-results">該当する関数がありません。<br>別の言葉で検索してみてください。</p>`; }
  function renderSaved() { const chips = (names, empty) => names.length ? names.map((name) => `<button class="chip" data-name="${name}" type="button">${name}</button>`).join("") : `<p class="empty-mini">${empty}</p>`; $("#favorites").innerHTML = chips(favorites,"☆から登録できます"); $("#recents").innerHTML = chips(recents,"まだありません"); }
  function addRecent(name) { recents = [name,...recents.filter((item) => item !== name)].slice(0,10); storage.set("formula-builder-recents",recents); renderSaved(); }
  function updateFormula() { const complete = isComplete(current); $("#formulaResult").textContent = formulaFor(current); $("#inputStatus").textContent = complete ? "入力済み" : "必須項目を入力してください"; $("#copyButton").disabled = !complete; }
  function renderDetail(fn, track = true) { current = fn; $("#detailCategory").textContent = fn.category.toUpperCase(); $("#functionName").textContent = fn.name; $("#description").textContent = fn.description; $("#syntax").textContent = `=${fn.syntax}`; $("#compatibility").textContent = service === "excel" ? "Excel 対応" : "Google Sheets 対応"; $("#serviceNote").textContent = fn.note || (service === "excel" ? "Excelでは引数の区切りにカンマ（,）を使用します。" : "Google Sheetsでも同じ構文で使用できます。地域設定により区切り記号が異なる場合があります。"); $("#formulaForm").innerHTML = fn.fields.length ? fn.fields.map((item) => `<div class="field ${fn.fields.length === 1 ? "full" : ""}"><label for="field-${item.key}">${item.label}${item.required ? "<em>必須</em>" : ""}</label>${item.type === "select" ? `<select id="field-${item.key}" name="${item.key}">${item.options.map((option) => `<option>${option}</option>`).join("")}</select>` : `<input id="field-${item.key}" name="${item.key}" placeholder="${item.placeholder.replaceAll('"','&quot;')}">`}</div>`).join("") : `<p class="no-results">入力は必要ありません。そのままコピーできます。</p>`; $("#exampleFormula").textContent = fn.example; $("#exampleText").textContent = fn.exampleText; const favored = favorites.includes(fn.name); $("#favoriteButton").textContent = favored ? "★" : "☆"; $("#favoriteButton").classList.toggle("active",favored); $("#favoriteButton").setAttribute("aria-label",favored ? "お気に入りから削除" : "お気に入りに追加"); $("#copyStatus").textContent = ""; updateFormula(); renderList(); if (track) addRecent(fn.name); }
  async function copyText(text, button) { try { await navigator.clipboard.writeText(text); } catch (_) { const area=document.createElement("textarea"); area.value=text; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); } addRecent(current.name); $("#copyStatus").textContent="コピーしました"; const old=button.innerHTML; button.textContent="✓ コピー済み"; setTimeout(()=>{ button.innerHTML=old; },1200); }
  function selectByName(name) { const fn=FUNCTIONS.find((item)=>item.name===name); if(fn){ renderDetail(fn); if(innerWidth<801) $("#detail").scrollIntoView({behavior:"smooth"}); } }
  function initialize() {
    document.querySelectorAll(".service").forEach((button)=>button.classList.toggle("active",button.dataset.service===service)); renderCategories(); renderSaved(); renderDetail(current,false);
    $("#search").addEventListener("input",renderList); $("#formulaForm").addEventListener("input",updateFormula);
    $("#categories").addEventListener("click",(e)=>{ if(!e.target.dataset.category)return; selectedCategory=selectedCategory===e.target.dataset.category?"":e.target.dataset.category; renderCategories(); renderList(); });
    $("#clearFilter").addEventListener("click",()=>{selectedCategory=""; $("#search").value=""; renderCategories(); renderList();});
    document.addEventListener("click",(e)=>{const target=e.target.closest("[data-name]"); if(target&&!target.classList.contains("service")) selectByName(target.dataset.name);});
    $("#favoriteButton").addEventListener("click",()=>{ favorites=favorites.includes(current.name)?favorites.filter((n)=>n!==current.name):[...favorites,current.name]; storage.set("formula-builder-favorites",favorites); renderSaved(); renderDetail(current,false); });
    document.querySelectorAll(".service").forEach((button)=>button.addEventListener("click",()=>{service=button.dataset.service; storage.set("formula-builder-service",service); document.querySelectorAll(".service").forEach((b)=>b.classList.toggle("active",b===button)); renderDetail(current,false);}));
    $("#copyButton").addEventListener("click",()=>copyText($("#formulaResult").textContent,$("#copyButton"))); $("#copyExample").addEventListener("click",()=>copyText(current.example,$("#copyExample")));
    document.addEventListener("keydown",(e)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#search").focus();}});
  }
  if(typeof module!=="undefined") module.exports={FUNCTIONS, formulaFromValues:(fn,values)=>fn.name==="IF"?`=IF(${values.cell}${values.operator}${values.compare},${values.trueValue},${values.falseValue})`:`=${fn.name}(${fn.fields.map(x=>values[x.key]||"").filter((v,i,a)=>v||a.slice(i+1).some(Boolean)).join(",")})`};
  if(typeof document!=="undefined") document.addEventListener("DOMContentLoaded",initialize);
})();
