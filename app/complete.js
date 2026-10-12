// complete.js — VS Code-like editing for the plain textarea.
// Autocomplete popup (keywords + game/math/tk API + your own names),
// auto-close pairs with skip-over, Tab indent, smart Enter.
// No dependencies; attaches to #editor on DOMContentLoaded.
(function(){
var WORDS=('print len range str int input def return if elif else while for in and or not is pass import from as True False None '+
// game API (tiny/ursina)
'Entity box circle player coin image text score on_click on_key say clear bg color update '+
// modules + widget names
'math tkinter tiny ursina Tk Label Button Entry').split(' ');
var MEMBERS={
math:'pi e tau inf nan sqrt cbrt floor ceil trunc fabs factorial gcd comb perm pow exp log log10 log2 sin cos tan asin acos atan atan2 hypot degrees radians copysign isclose isfinite isinf isnan'.split(' '),
tkinter:['Tk','Label','Button','Entry'],
ursina:'Entity box circle player coin image text score on_click on_key say clear bg color update'.split(' '),
tiny:'Entity box circle player coin image text score on_click on_key say clear bg color update'.split(' ')
};
var PAIRS={'(' : ')', '[' : ']', '{' : '}', '"' : '"', "'" : "'"};
var CLOSERS={')' : 1, ']' : 1, '}' : 1};
var box=null, items=[], sel=0, lastC=null;

function ed(){ return (typeof document === 'undefined') ? null : document.getElementById('editor'); }
function fireInput(ta){ try{ ta.dispatchEvent(new Event('input', {bubbles: true})); }catch(e){} }
function setText(ta, text, s, e, caret){
  if(ta.setRangeText) ta.setRangeText(text, s, e, 'end');
  else ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
  if(caret !== undefined){ ta.selectionStart = ta.selectionEnd = caret; }
  fireInput(ta);
}
function collect(code){
  var out=[], seen={}, m, re;
  re=/(?:^|\n)\s*def\s+([A-Za-z_]\w*)/g; while((m=re.exec(code))) add(m[1]);
  re=/(?:^|\n)([A-Za-z_]\w*)\s*=(?!=)/g; while((m=re.exec(code))) add(m[1]);
  re=/\bfor\s+([A-Za-z_]\w*)\s+in\b/g; while((m=re.exec(code))) add(m[1]);
  function add(n){ if(!seen[n]){ seen[n]=1; out.push(n); } }
  return out;
}
function currentWord(ta){
  if(ta.selectionEnd !== ta.selectionStart) return null;
  var m=ta.value.slice(0, ta.selectionStart).match(/[A-Za-z_]\w*$/);
  return m ? {word: m[0], start: ta.selectionStart - m[0].length} : null;
}
function candidates(ta){
  var w=currentWord(ta);
  if(!w || !w.word) return null;
  var before=ta.value.slice(0, w.start);
  var dm=before.match(/([A-Za-z_]\w*)\.$/);
  var pool;
  if(dm){
    if(!MEMBERS[dm[1]]) return null;
    pool=MEMBERS[dm[1]];
  }else{
    pool=WORDS.concat(collect(ta.value));
  }
  var lw=w.word.toLowerCase(), seen={}, out=[];
  for(var i=0;i<pool.length;i++){
    var n=pool[i];
    if(seen[n]||n.toLowerCase().indexOf(lw)!==0) continue;
    seen[n]=1; out.push(n);
    if(out.length>=8) break;
  }
  if(!out.length) return null;
  if(out.length===1 && out[0]===w.word) return null;
  return {word: w.word, start: w.start, list: out};
}
function ensureBox(ta){
  if(box) return box;
  var wrap=(ta.closest) ? ta.closest('.editor-wrap') : null;
  box=document.createElement('div');
  box.className='complete-box'; box.hidden=true;
  (wrap || document.body).appendChild(box);
  return box;
}
function caretXY(ta){
  var wrap=(ta.closest) ? ta.closest('.editor-wrap') : null;
  var fallback={x: 8, y: 8};
  if(!wrap || !document.createElement) return fallback;
  var cs=(typeof window !== 'undefined' && window.getComputedStyle) ? window.getComputedStyle(ta) : null;
  var mir=document.createElement('div');
  mir.style.position='absolute'; mir.style.visibility='hidden';
  mir.style.whiteSpace='pre-wrap'; mir.style.wordWrap='break-word'; mir.style.overflow='hidden';
  mir.style.font=cs ? cs.font : '14px ui-monospace,Consolas,monospace';
  mir.style.padding=cs ? cs.padding : '14px 16px';
  try{ mir.style.width=ta.clientWidth+'px'; }catch(e){ mir.style.width='600px'; }
  mir.textContent=ta.value.slice(0, ta.selectionStart);
  var mk=document.createElement('span'); mk.textContent='\u200b';
  mir.appendChild(mk); wrap.appendChild(mir);
  var x=mk.offsetLeft||0, y=mk.offsetTop||0, lh=22;
  if(cs){ var p=parseFloat(cs.lineHeight); if(p>0) lh=p; }
  wrap.removeChild(mir);
  var maxX=(wrap.clientWidth||600)-190;
  return {x: Math.max(0, Math.min(x, maxX)), y: y+lh+2};
}
function hide(){ if(box) box.hidden=true; items=[]; lastC=null; }
function render(ta, c){
  ensureBox(ta);
  lastC=c; items=c.list; sel=0;
  box.innerHTML='';
  items.forEach(function(n, i){
    var d=document.createElement('div');
    d.className='citem'+(i===sel?' sel':''); d.textContent=n;
    d.addEventListener('pointerdown', function(ev){ if(ev&&ev.preventDefault) ev.preventDefault(); accept(ta, n, c); });
    box.appendChild(d);
  });
  var p=caretXY(ta);
  box.style.left=p.x+'px'; box.style.top=p.y+'px';
  box.hidden=false;
}
function paintSel(){
  if(!box||!box.childNodes) return;
  for(var i=0;i<box.childNodes.length;i++){
    var d=box.childNodes[i];
    if(d.className!==undefined) d.className='citem'+(i===sel?' sel':'');
  }
}
function accept(ta, n, c){
  var s=(c?c.start:(currentWord(ta)||{start: ta.selectionStart}).start);
  var e=ta.selectionEnd;
  setText(ta, n, s, e, s+n.length);
  hide();
  var c2=candidates(ta);
  if(c2&&c2.list.length) render(ta, c2);
}
function onInput(){
  var ta=ed(); if(!ta) return;
  var c=candidates(ta);
  if(!c||!c.list.length){ hide(); return; }
  render(ta, c);
}
function tabIndent(ta, un){
  var v=ta.value, s=ta.selectionStart, e=ta.selectionEnd;
  if(s===e){
    if(!un){ setText(ta, '    ', s, e, s+4); return; }
    var got=v.slice(v.lastIndexOf('\n', s-1)+1, s).match(/ {1,4}$/);
    if(got){ setText(ta, '', s-got[0].length, s, s-got[0].length); }
    return;
  }
  var ls=v.lastIndexOf('\n', s-1)+1, le=v.indexOf('\n', e);
  if(le<0) le=v.length;
  var lines=v.slice(ls, le).split('\n'), d=0, ds=0;
  for(var i=0;i<lines.length;i++){
    if(!un){ lines[i]='    '+lines[i]; if(i===0) ds=4; d+=4; }
    else{ var m=lines[i].match(/^ {1,4}/); if(m){ lines[i]=lines[i].slice(m[0].length); d-=m[0].length; if(i===0) ds=-m[0].length; } }
  }
  setText(ta, lines.join('\n'), ls, le);
  ta.selectionStart=s+ds; ta.selectionEnd=e+d;
  fireInput(ta);
}
function smartEnter(ta){
  var v=ta.value, s=ta.selectionStart;
  var ls=v.lastIndexOf('\n', s-1)+1;
  var indent=(v.slice(ls, s).match(/^ */)||[''])[0];
  var prev=v[s-1], next=v[s];
  if(prev===':') indent+='    ';
  if('([{'.indexOf(prev)>=0 && ')]}'.indexOf(next)>=0){
    setText(ta, '\n'+indent+'    \n'+indent, s, ta.selectionEnd, s+1+indent.length+4);
  }else{
    setText(ta, '\n'+indent, s, ta.selectionEnd, s+1+indent.length);
  }
}
function onKey(e){
  var ta=ed(); if(!ta||e.target!==ta) return;
  if(e.ctrlKey||e.metaKey) return;
  var open=box&&!box.hidden&&items.length;
  if(open){
    if(e.key==='ArrowDown'){ sel=(sel+1)%items.length; paintSel(); e.preventDefault(); return; }
    if(e.key==='ArrowUp'){ sel=(sel-1+items.length)%items.length; paintSel(); e.preventDefault(); return; }
    if(e.key==='Escape'){ hide(); e.preventDefault(); return; }
    if(e.key==='Enter'||e.key==='Tab'){ accept(ta, items[sel], lastC); e.preventDefault(); return; }
  }
  if(e.key==='Tab'){ tabIndent(ta, e.shiftKey); e.preventDefault(); return; }
  if(e.key==='Enter'){ smartEnter(ta); e.preventDefault(); return; }
  var v=ta.value, s=ta.selectionStart, en=ta.selectionEnd;
  if(e.key==='Backspace'&&s===en&&s>0){
    var pair=v[s-1]+v[s];
    if(pair==='()'||pair==='[]'||pair==='{}'||pair==='""'||pair==="''"){
      setText(ta, '', s-1, s+1, s-1); e.preventDefault(); return;
    }
    return;
  }
  if(PAIRS[e.key]){
    var close=PAIRS[e.key];
    if(en>s){
      var sel2=v.slice(s, en);
      setText(ta, e.key+sel2+close, s, en, s+1);
      ta.selectionEnd=en+1;
      e.preventDefault(); return;
    }
    if((e.key==='"'||e.key==="'")&&v[s]===e.key){ ta.selectionStart=ta.selectionEnd=s+1; e.preventDefault(); return; }
    setText(ta, e.key+close, s, en, s+1);
    e.preventDefault(); return;
  }
  if(CLOSERS[e.key]&&s===en&&v[s]===e.key){ ta.selectionStart=ta.selectionEnd=s+1; e.preventDefault(); return; }
}
function init(){
  var ta=ed(); if(!ta) return;
  ta.addEventListener('input', onInput);
  ta.addEventListener('keydown', onKey);
  ta.addEventListener('blur', hide);
  ta.addEventListener('scroll', hide);
}
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded', init);
window.Complete={candidates: candidates, collect: collect, onInput: onInput, onKey: onKey, hide: hide};
})();
