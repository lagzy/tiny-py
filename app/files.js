// files.js — playground "files": named programs + draft autosave, localStorage only.
// Keys: tiny-py-files ({name:{code,updated}}), tiny-py-draft (last typed code),
// tiny-py-open (name of the file currently in the editor).
// No UI framework: a <select id="file-list"> + Save/Delete buttons in #toolbar.
window.Files={
KEY:'tiny-py-files', DKEY:'tiny-py-draft', OKEY:'tiny-py-open',
openName:null,
esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },
store(){ try{ return JSON.parse(localStorage.getItem(this.KEY)||'{}')||{}; }catch(e){ return {}; } },
write(all){ try{ localStorage.setItem(this.KEY,JSON.stringify(all)); }catch(e){} },
list(){
const all=this.store();
return Object.keys(all).map(n=>({name:n,updated:(all[n]&&all[n].updated)||0}))
.sort((a,b)=>b.updated-a.updated);
},
save(name,code){
name=String(name==null?'':name).trim();
if(!name) return false;
const all=this.store();
all[name]={code:String(code==null?'':code),updated:Date.now()};
this.write(all);
this.openName=name;
try{ localStorage.setItem(this.OKEY,name); }catch(e){}
this.refresh();
return true;
},
open(name){
const all=this.store(), f=all[name];
if(!f) return null;
this.openName=name;
try{ localStorage.setItem(this.OKEY,name); }catch(e){}
if(window.Editor) window.Editor.set(f.code);
this.refresh();
return f.code;
},
remove(name){
const all=this.store();
if(!Object.prototype.hasOwnProperty.call(all,name)) return false;
delete all[name];
this.write(all);
if(this.openName===name){ this.openName=null; try{ localStorage.removeItem(this.OKEY); }catch(e){} }
this.refresh();
return true;
},
draft(code){ try{ localStorage.setItem(this.DKEY,String(code==null?'':code)); }catch(e){} },
draftCode(){ try{ return localStorage.getItem(this.DKEY); }catch(e){ return null; } },
hasShare(){ try{ return location.hash.indexOf('#c=')===0; }catch(e){ return false; } },
status(msg){ const el=document.getElementById('assistant'); if(el){ el.textContent=msg; el.hidden=false; } },
refresh(){
const sel=document.getElementById('file-list'); if(!sel) return;
sel.innerHTML='<option value="">My files…</option>'+this.list().map(f=>
'<option value="'+this.esc(f.name)+'"'+(f.name===this.openName?' selected':'')+'>'+this.esc(f.name)+'</option>').join('');
if(!this.openName) sel.value='';
},
init(){
try{ this.openName=localStorage.getItem(this.OKEY); }catch(e){ this.openName=null; }
if(this.openName&&!Object.prototype.hasOwnProperty.call(this.store(),this.openName)) this.openName=null;
// Shared links win; otherwise resume whatever was last typed.
if(!this.hasShare()){
const d=this.draftCode();
if(d&&window.Editor) window.Editor.set(d);
}
this.refresh();
let t;
document.getElementById('editor')?.addEventListener('input',()=>{
clearTimeout(t);
t=setTimeout(()=>{ if(window.Editor) this.draft(window.Editor.get()); },500);
});
document.getElementById('btn-file-save')?.addEventListener('click',()=>{
if(!window.Editor) return;
const next=prompt('Save as:',this.openName||'my-program');
if(next&&this.save(next,window.Editor.get())) this.status('Saved "'+next+'". Find it under My files.');
});
document.getElementById('file-list')?.addEventListener('change',e=>{
const name=e.target.value;
if(!name) return;
if(this.open(name)!==null) this.status('Opened "'+name+'".');
});
document.getElementById('btn-file-del')?.addEventListener('click',()=>{
const sel=document.getElementById('file-list');
const name=(sel&&sel.value)||this.openName;
if(!name) return;
if(confirm('Delete "'+name+'"?')){ this.remove(name); this.status('Deleted "'+name+'".'); }
});
}
};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{ if(window.Files) window.Files.init(); });
