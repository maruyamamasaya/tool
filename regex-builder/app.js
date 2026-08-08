(function (root) {
  'use strict';
  const STORAGE_KEY = 'regex-builder-state-v1';
  const LABELS = {digit:'数字',letter:'英字',alnum:'英数字',literal:'固定文字',space:'空白',nonspace:'空白以外',any:'任意の文字',word:'単語文字',nonword:'単語文字以外',class:'文字クラス',group:'グループ',or:'ORグループ',raw:'プリセット条件'};
  const basePatterns = {digit:'\\d',alnum:'[A-Za-z0-9]',space:'\\s',nonspace:'\\S',any:'.',word:'\\w',nonword:'\\W'};
  const escapeLiteral = value => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function quantifier(item) {
    const mode=item.repeat||'one', min=Math.max(0,Number(item.min)||0), max=Math.max(min,Number(item.max)||0);
    return mode==='optional'?'?':mode==='zeroMore'?'*':mode==='oneMore'?'+':mode==='exact'?`{${min}}`:mode==='range'?`{${min},${max}}`:mode==='atLeast'?`{${min},}`:'';
  }
  function classPattern(value, negate) {
    let source=String(value||'').replace(/\]/g,'\\]').replace(/\^/g,'\\^');
    if (source.startsWith('-')) source='\\-'+source.slice(1);
    return `[${negate?'^':''}${source}]`;
  }
  function itemPattern(item) {
    let pattern=basePatterns[item.type]||'';
    if(item.type==='digit') pattern=item.style==='range'?'[0-9]':'\\d';
    if(item.type==='letter') pattern=item.case==='lower'?'[a-z]':item.case==='upper'?'[A-Z]':'[A-Za-z]';
    if(item.type==='literal') pattern=escapeLiteral(item.value);
    if(item.type==='class') pattern=classPattern(item.value,item.negate);
    if(item.type==='group') pattern=`${item.capture===false?'(?:':'('}${escapeLiteral(item.value)})`;
    if(item.type==='or') pattern=`(${escapeLiteral(item.a)}|${escapeLiteral(item.b)})`;
    if(item.type==='raw') pattern=item.value||'';
    return pattern+quantifier(item);
  }
  function buildPattern(state) { return `${state.start?'^':''}${state.items.map(itemPattern).join('')}${state.end?'$':''}`; }
  function describeRepeat(item) { const m=item.repeat||'one'; if(m==='optional')return 'を0回または1回';if(m==='zeroMore')return 'を0回以上';if(m==='oneMore')return 'を1回以上';if(m==='exact')return `を${item.min}文字`;if(m==='range')return `を${item.min}〜${item.max}文字`;if(m==='atLeast')return `を最低${item.min}文字`;return ''; }
  function describeItem(item) { let text=LABELS[item.type]||'条件'; if(item.type==='literal')text=`「${item.value||''}」`;if(item.type==='class')text=`${item.negate?'含まない':'いずれかの文字'}「${item.value||''}」`;if(item.type==='group')text=`${item.capture===false?'非キャプチャ':'キャプチャ'}グループ「${item.value||''}」`;if(item.type==='or')text=`「${item.a||''}」または「${item.b||''}」`;if(item.type==='raw')text=item.description||'プリセット条件';return text+describeRepeat(item); }
  const makeItem = type => ({id:Date.now()+Math.random(),type,repeat:'one',min:type==='digit'?1:1,max:5,style:'short',case:'all',value:'',capture:true,a:'cat',b:'dog',negate:false});
  const presets={
    postal:{start:true,end:true,items:[{type:'digit',repeat:'exact',min:3},{type:'literal',value:'-'},{type:'digit',repeat:'exact',min:4}],test:'123-4567\n1234-567'},
    digits:{start:true,end:true,items:[{type:'digit',repeat:'oneMore'}],test:'12345\n12a'},
    alnum:{start:true,end:true,items:[{type:'alnum',repeat:'oneMore'}],test:'abc123\nabc-123'},
    email:{start:true,end:true,items:[{type:'raw',value:'[^\\s@]+',description:'空白と@以外を1文字以上'},{type:'literal',value:'@'},{type:'raw',value:'[^\\s@]+',description:'空白と@以外を1文字以上'},{type:'literal',value:'.'},{type:'raw',value:'[^\\s@]+',description:'空白と@以外を1文字以上'}],test:'hello@example.com\nhello @example.com'},
    url:{start:true,end:false,items:[{type:'raw',value:'https?://',description:'http または https の後に「://」'},{type:'nonspace',repeat:'oneMore'}],test:'https://example.com\nftp://example.com'},
    ipv4:{start:true,end:true,items:[{type:'digit',repeat:'range',min:1,max:3},{type:'raw',value:'(\\.\\d{1,3}){3}',description:'「.」と1〜3桁の数字を3回'}],test:'192.168.0.1\n999.999.999.999\n192.168.1'}
  };

  if (typeof module !== 'undefined') module.exports={escapeLiteral,quantifier,classPattern,itemPattern,buildPattern,describeItem,presets};
  if (!root.document) return;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  let state={items:[],start:true,end:true,flags:[],format:'plain',test:''};
  try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(saved&&Array.isArray(saved.items)) state={...state,...saved}; } catch (_) {}
  const repeatOptions=[['one','1回'],['optional','0回または1回'],['zeroMore','0回以上'],['oneMore','1回以上'],['exact','指定回数'],['range','範囲指定'],['atLeast','最低回数']];
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function extraFields(item,index){
    if(item.type==='digit')return `<label>表記 <select data-key="style"><option value="short">\\d</option><option value="range" ${item.style==='range'?'selected':''}>[0-9]</option></select></label>`;
    if(item.type==='letter')return `<label>種類 <select data-key="case"><option value="all">英字</option><option value="lower" ${item.case==='lower'?'selected':''}>小文字</option><option value="upper" ${item.case==='upper'?'selected':''}>大文字</option></select></label>`;
    if(item.type==='literal')return `<label>値 <input data-key="value" type="text" value="${esc(item.value||'')}" placeholder="例：-、.com"></label>`;
    if(item.type==='class')return `<label>文字 <input data-key="value" type="text" value="${esc(item.value||'')}" placeholder="a-zA-Z0-9_-"></label><label><input data-key="negate" type="checkbox" ${item.negate?'checked':''}> 含まない</label>`;
    if(item.type==='group')return `<label>内容 <input data-key="value" type="text" value="${esc(item.value||'')}" placeholder="abc"></label><label>種類 <select data-key="capture"><option value="true">キャプチャ</option><option value="false" ${item.capture===false?'selected':''}>非キャプチャ</option></select></label>`;
    if(item.type==='or')return `<label>条件A <input data-key="a" type="text" value="${esc(item.a||'')}"></label><label>条件B <input data-key="b" type="text" value="${esc(item.b||'')}"></label>`;
    if(item.type==='raw')return `<span class="hint">プリセットから追加された条件</span>`; return '';
  }
  function renderCards(){ const list=$('#conditionList');list.innerHTML=state.items.map((item,i)=>{const repeat=repeatOptions.map(([v,l])=>`<option value="${v}" ${item.repeat===v?'selected':''}>${l}</option>`).join('');const nums=item.repeat==='exact'||item.repeat==='atLeast'?`<label>回数 <input data-key="min" type="number" min="0" value="${item.min||0}"></label>`:item.repeat==='range'?`<label>最小 <input data-key="min" type="number" min="0" value="${item.min||0}"></label><label>最大 <input data-key="max" type="number" min="0" value="${item.max||0}"></label>`:'';return `<article class="condition-card" data-index="${i}"><span class="number">${String(i+1).padStart(2,'0')}</span><div class="condition-main"><h3>${LABELS[item.type]||'条件'}</h3><div class="fields">${extraFields(item,i)}<label>回数 <select data-key="repeat">${repeat}</select></label>${nums}</div></div><div class="actions"><button data-action="up" title="上へ" ${i===0?'disabled':''}>↑</button><button data-action="down" title="下へ" ${i===state.items.length-1?'disabled':''}>↓</button><button class="delete" data-action="delete">削除</button></div></article>`}).join('');$('#emptyState').hidden=state.items.length>0;$('#itemCount').textContent=`${state.items.length}件`; }
  function validate(pattern,flags){try{new RegExp(pattern,flags);return true}catch(_){return false}}
  function highlight(line,pattern,flags){let regex;try{regex=new RegExp(pattern,flags.replace('g','')+'g')}catch(_){return document.createTextNode(line)}const frag=document.createDocumentFragment();let last=0,count=0,m;while((m=regex.exec(line))&&count++<200){frag.append(document.createTextNode(line.slice(last,m.index)));const mark=document.createElement('mark');mark.textContent=m[0]||' ';frag.append(mark);last=m.index+m[0].length;if(!m[0])regex.lastIndex++}frag.append(document.createTextNode(line.slice(last)));return frag}
  function renderTest(pattern,valid){const out=$('#testResults');out.textContent='';if(!state.test)return;state.test.split('\n').forEach(line=>{const row=document.createElement('div');let pass=false;if(valid)try{pass=new RegExp(pattern,state.flags.filter(f=>f!=='g').join('')).test(line)}catch(_){}row.className=`test-line ${pass?'pass':'fail'}`;row.append(document.createTextNode(pass?'✓ ':'× '));if(pass)row.append(highlight(line,pattern,state.flags.join('')));else row.append(document.createTextNode(line||'（空の行）'));out.append(row)})}
  function update(save=true){const pattern=buildPattern(state),flags=state.flags.join(''),valid=validate(pattern,flags);$('#regexOutput').textContent=state.format==='literal'?`/${pattern}/${flags}`:pattern;$('#regexError').hidden=valid;$('#regexBox').style.borderColor=valid?'':'var(--danger)';$('#explanationList').innerHTML=[...(state.start?['文字列の先頭']:[]),...state.items.map(describeItem),...(state.end?['文字列の末尾']:[])].map(x=>`<li>${esc(x)}</li>`).join('');renderTest(pattern,valid);if(save)try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_){} }
  function render(){renderCards();$('#startAnchor').checked=state.start;$('#endAnchor').checked=state.end;$$('.flags input').forEach(x=>x.checked=state.flags.includes(x.value));$(`input[name=format][value=${state.format}]`).checked=true;$('#testInput').value=state.test;update(false)}
  $('#addButtons').addEventListener('click',e=>{const type=e.target.closest('button')?.dataset.type;if(!type)return;state.items.push(makeItem(type));renderCards();update()});
  $('#conditionList').addEventListener('input',e=>{const card=e.target.closest('.condition-card');if(!card)return;const item=state.items[Number(card.dataset.index)],key=e.target.dataset.key;if(!key)return;let value=e.target.type==='checkbox'?e.target.checked:e.target.value;if(key==='capture')value=value==='true';if(key==='min'||key==='max')value=Math.max(0,Number(value));item[key]=value;if(key==='repeat')renderCards();update()});
  $('#conditionList').addEventListener('click',e=>{const action=e.target.dataset.action;if(!action)return;const i=Number(e.target.closest('.condition-card').dataset.index);if(action==='delete')state.items.splice(i,1);if(action==='up'&&i){[state.items[i-1],state.items[i]]=[state.items[i],state.items[i-1]]}if(action==='down'&&i<state.items.length-1){[state.items[i+1],state.items[i]]=[state.items[i],state.items[i+1]]}renderCards();update()});
  $('#presets').addEventListener('click',e=>{const p=presets[e.target.dataset.preset];if(!p)return;state.items=p.items.map(x=>({...makeItem(x.type),...x}));state.start=p.start;state.end=p.end;state.test=p.test;render() ;update()});
  $('#startAnchor').addEventListener('change',e=>{state.start=e.target.checked;update()});$('#endAnchor').addEventListener('change',e=>{state.end=e.target.checked;update()});
  $$('.flags input').forEach(x=>x.addEventListener('change',()=>{state.flags=$$('.flags input:checked').map(x=>x.value);update()}));$$('input[name=format]').forEach(x=>x.addEventListener('change',e=>{state.format=e.target.value;update()}));
  $('#testInput').addEventListener('input',e=>{state.test=e.target.value;update()});
  $('#copyButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#regexOutput').textContent);$('#copyStatus').textContent='コピーしました';setTimeout(()=>$('#copyStatus').textContent='',2200)}catch(_){$('#copyStatus').textContent='コピーできませんでした'}});
  $('#resetButton').addEventListener('click',()=>{state={items:[],start:true,end:true,flags:[],format:'plain',test:''};render();update()});
  render();
})(typeof window !== 'undefined' ? window : globalThis);
