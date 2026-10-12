// editor.js
window.Editor={
el(){return document.getElementById('editor');},
get(){return this.el()?this.el().value:'';},
set(v){const e=this.el();if(!e)return;e.value=v;e.dispatchEvent(new Event('input'));},
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
if(!this.get()) this.set(start);
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
