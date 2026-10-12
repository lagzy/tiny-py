// images.js — playground image library. Upload pictures, see a small
// preview + name, rename/delete them, click one to drop it into code.
// Stored as (downscaled) data URLs in localStorage under tiny-py-images.
// Preview injects them into the game iframe as window.__images, so the
// engine's image("name", x, y) can draw them on the stage.
window.Images={
KEY:'tiny-py-images',
esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },
store(){ try{ return JSON.parse(localStorage.getItem(this.KEY)||'{}')||{}; }catch(e){ return {}; } },
write(all){ try{ localStorage.setItem(this.KEY,JSON.stringify(all)); return true; }catch(e){ return false; } },
list(){
const all=this.store();
return Object.keys(all).map(n=>({name:n,updated:(all[n]&&all[n].updated)||0}))
.sort((a,b)=>b.updated-a.updated);
},
data(){
const all=this.store(), out={};
Object.keys(all).forEach(n=>{ if(all[n]&&all[n].data) out[n]=all[n].data; });
return out;
},
clean(name){
name=String(name==null?'':name).replace(/\.[A-Za-z0-9]+$/,'').trim().replace(/[^\w\- ]+/g,'').replace(/\s+/g,'-').toLowerCase();
return name||'image';
},
unique(name){
const all=this.store();
if(!Object.prototype.hasOwnProperty.call(all,name)) return name;
let i=2;
while(Object.prototype.hasOwnProperty.call(all,name+'-'+i)) i++;
return name+'-'+i;
},
add(name,dataUrl){
name=this.unique(this.clean(name));
const all=this.store();
all[name]={data:String(dataUrl),updated:Date.now()};
if(!this.write(all)) return null;
this.refresh();
return name;
},
rename(oldName,newName){
newName=this.clean(newName);
const all=this.store();
if(!Object.prototype.hasOwnProperty.call(all,oldName)||!newName) return false;
if(newName!==oldName&&Object.prototype.hasOwnProperty.call(all,newName)) return false;
all[newName]=all[oldName];
all[newName].updated=Date.now();
delete all[oldName];
if(!this.write(all)) return false;
this.refresh();
return newName;
},
remove(name){
const all=this.store();
if(!Object.prototype.hasOwnProperty.call(all,name)) return false;
delete all[name];
this.write(all);
this.refresh();
return true;
},
status(msg){ const el=document.getElementById('assistant'); if(el){ el.textContent=msg; el.hidden=false; } },
shrink(dataUrl,done){
try{
const img=new Image();
img.onload=()=>{
let w=img.width||256, h=img.height||256;
const s=Math.min(1,256/Math.max(w,h));
const c=document.createElement('canvas');
c.width=Math.max(1,Math.round(w*s)); c.height=Math.max(1,Math.round(h*s));
c.getContext('2d').drawImage(img,0,0,c.width,c.height);
done(c.toDataURL('image/png'));
};
img.onerror=()=>done(dataUrl);
img.src=dataUrl;
}catch(e){ done(dataUrl); }
},
insert(name){
if(!window.Editor) return;
const line='image("'+name+'", 60, 60)';
window.Editor.set(window.Editor.get().replace(/\n+$/,'')+'\n'+line+'\n');
this.status('Added '+line+' — Run to see it on the stage.');
},
refresh(){
const box=document.getElementById('img-list'); if(!box) return;
const items=this.list();
if(!items.length){
box.innerHTML='<p class="img-empty">No images yet. Add one, then click it to drop it into your code.</p>';
return;
}
box.innerHTML='';
items.forEach(f=>{
const all=this.store(), rec=all[f.name]||{};
const row=document.createElement('div');
row.className='img-item';
const thumb=document.createElement('img');
thumb.src=rec.data||''; thumb.alt=f.name; thumb.title='Click to use in code';
thumb.addEventListener('click',()=>this.insert(f.name));
const nm=document.createElement('span');
nm.className='iname'; nm.textContent=f.name; nm.title=f.name;
const rn=document.createElement('button');
rn.className='btn'; rn.textContent='Rename';
rn.addEventListener('click',()=>{
const next=prompt('Rename to:',f.name);
if(next===null) return;
const res=this.rename(f.name,next);
this.status(res?('Renamed to "'+res+'".'):'Could not rename (empty or taken).');
});
const del=document.createElement('button');
del.className='btn'; del.textContent='Delete';
del.addEventListener('click',()=>{
if(confirm('Delete "'+f.name+'"?')){ this.remove(f.name); this.status('Deleted "'+f.name+'".'); }
});
row.appendChild(thumb); row.appendChild(nm); row.appendChild(rn); row.appendChild(del);
box.appendChild(row);
});
},
init(){
this.refresh();
document.getElementById('btn-img-add')?.addEventListener('click',()=>{
document.getElementById('img-file')?.click();
});
document.getElementById('img-file')?.addEventListener('change',e=>{
const f=(e.target.files||[])[0];
if(!f) return;
e.target.value='';
const rd=new FileReader();
rd.onload=()=>{
this.shrink(String(rd.result||''),small=>{
const saved=this.add(f.name,small);
this.status(saved?('Saved "'+saved+'". Click it to use in code.'):'Image is too big for local storage — try a smaller file.');
});
};
rd.readAsDataURL(f);
});
}
};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{ if(window.Images) window.Images.init(); });
