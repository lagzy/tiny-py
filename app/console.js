// console.js — the separate print() console with a type-in row.
// The game iframe streams lines here and asks for input via postMessage
// (sandboxed iframes can post out, but not touch parent DOM or prompt()).
window.Csl={
el(){return document.getElementById('cout');},
row(){return document.getElementById('cinrow');},
line(t){const e=this.el();if(!e)return;e.textContent+=(e.textContent?'\n':'')+t;e.scrollTop=e.scrollHeight;},
clear(){const e=this.el();if(e)e.textContent='';this.done();},
ask(prompt){const r=this.row();if(!r)return;r.hidden=false;
const p=document.getElementById('cprompt');if(p)p.textContent=prompt||'input:';
const i=document.getElementById('cin');if(!i)return;i.value='';
i.placeholder='type answer + Send (Enter works too)';
// Never yank focus out of the editor (or any typing spot): the user is
// mid-thought. Focus only when nothing editable has it.
const ae=document.activeElement;
if(!(ae&&/TEXTAREA|INPUT|SELECT/.test(ae.tagName||''))) i.focus();},
done(){const r=this.row();if(r)r.hidden=true;},
send(){const i=document.getElementById('cin');if(!i)return;
const f=document.getElementById('preview');
if(f&&f.contentWindow)try{f.contentWindow.postMessage({tiny:'answer',value:i.value},'*');}catch(e){}
i.value='';}
};
window.addEventListener('message',function(ev){
const d=ev.data||{};
if(d.tiny==='print')window.Csl.line(d.line);
if(d.tiny==='clear')window.Csl.clear();
if(d.tiny==='error')window.Csl.line('Error: '+d.message);
if(d.tiny==='need-input')window.Csl.ask(d.prompt);
if(d.tiny==='done')window.Csl.done();
});
document.addEventListener('DOMContentLoaded',function(){
document.getElementById('btn-clear')?.addEventListener('click',()=>window.Csl.clear());
document.getElementById('btn-send')?.addEventListener('click',()=>window.Csl.send());
document.getElementById('cin')?.addEventListener('keydown',e=>{if(e.key==='Enter')window.Csl.send();});
});
