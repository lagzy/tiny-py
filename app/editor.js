// editor.js — textarea wrapper + own Undo/Redo history.
// Programmatic .value sets wipe the browser's native undo stack, so every
// change (typed or set) is recorded here. Buttons: #btn-undo #btn-redo.
window.Editor={
el(){return document.getElementById('editor');},
get(){return this.el()?this.el().value:'';},
hist:[], fut:[], lastVal:'', burstStart:null, burstT:null, suppress:false,
commit(){
if(this.burstStart===null) return;
this.hist.push(this.burstStart);
if(this.hist.length>100) this.hist.shift();
this.fut.length=0;
this.burstStart=null;
this.syncBtns();
},
noteInput(){
if(this.suppress) return;
const cur=this.get();
if(cur===this.lastVal) return;
if(this.burstStart===null) this.burstStart=this.lastVal;
this.lastVal=cur;
clearTimeout(this.burstT);
this.burstT=setTimeout(()=>this.commit(),800);
this.syncBtns();
},
apply(v){
const e=this.el();if(!e)return;
this.suppress=true;
e.value=v;
try{ e.dispatchEvent(new Event('input')); }catch(err){}
this.suppress=false;
this.lastVal=v;
this.syncBtns();
},
set(v){
const e=this.el();if(!e)return;
this.commit();
const old=this.get();
if(old!==v){
this.hist.push(old);
if(this.hist.length>100) this.hist.shift();
this.fut.length=0;
}
this.apply(v);
},
undo(){
this.commit();
if(!this.hist.length) return false;
this.fut.push(this.get());
this.apply(this.hist.pop());
return true;
},
redo(){
if(!this.fut.length) return false;
this.hist.push(this.get());
if(this.hist.length>100) this.hist.shift();
this.apply(this.fut.pop());
return true;
},
syncBtns(){
const u=document.getElementById('btn-undo'), r=document.getElementById('btn-redo');
const pending=this.burstStart!==null;
if(u) u.disabled=!(this.hist.length||pending);
if(r) r.disabled=!this.fut.length;
},
defaultCode:`# tiny-py — Python syntax, runs offline!
print("Hello tiny-py!")

player = Entity(color="blue", x=100, y=100)
treasure = Entity(color="gold", x=200, y=80)

score(0)

def update():
    pass
`,
init(){
let start=this.defaultCode;
try{
if(location.hash.startsWith('#c=')) start=decodeURIComponent(escape(atob(location.hash.slice(3))));
}catch(e){}
this.lastVal=this.get();
if(!this.get()) this.set(start);
this.hist=[]; this.fut=[]; this.burstStart=null;
const ed=this.el();
if(ed) ed.addEventListener('input',()=>this.noteInput());
ed?.addEventListener('keydown',(e)=>{
const k=String(e.key||'').toLowerCase();
if(!(e.ctrlKey||e.metaKey)) return;
if(k==='z'&&!e.shiftKey){ if(this.undo()) e.preventDefault(); }
if(k==='y'||(k==='z'&&e.shiftKey)){ if(this.redo()) e.preventDefault(); }
});
document.getElementById('btn-undo')?.addEventListener('click',()=>this.undo());
document.getElementById('btn-redo')?.addEventListener('click',()=>this.redo());
this.syncBtns();
}};
document.addEventListener('DOMContentLoaded',()=>{
Editor.init();
document.getElementById('btn-reset')?.addEventListener('click',()=>Editor.set(Editor.defaultCode));
document.getElementById('btn-share')?.addEventListener('click',()=>{
location.hash='#c='+btoa(unescape(encodeURIComponent(Editor.get())));
prompt('Share this link:',location.href);});
document.getElementById('btn-save')?.addEventListener('click',()=>{
const blob=new Blob([Editor.get()],{type:'text/x-python'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);
a.download='my-tiny-program.py';a.click();});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')window.Preview?.render();});
});
