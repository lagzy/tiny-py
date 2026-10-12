// lessons.js — JetBrains-style course player. Renders into #lessons.
// Theory -> animated trace -> task in the editor, auto-checked after Run.
// Data lives in app/course-data.js (window.LESSONS).
// norm is file-scope (not a method): checkTask is also called detached.
function courseNorm(s){ return String(s == null ? '' : s).replace(/[ \t]+$/gm, '').replace(/\n+$/, ''); }
window.Course={
idx:0, done:[], lastCode:null, tracing:false,
lessons(){ return window.LESSONS || []; },
esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },

checkTask(code, task){
const T=(typeof window!=='undefined')?window.TinyPy:null;
if(!T) return {pass:false,msg:'Engine not loaded yet.'};
let r;
try{ r=T.run(code,(task&&(task.answers||[]))||[]); }
catch(e){ return {pass:false,msg:'Error: '+String((e&&e.message)||e)}; }
if(r.needInput!==undefined&&r.needInput!==null)
return {pass:false,msg:'It asked for more input than the task provides. Keep input() only where the lesson says.'};
if(r.error) return {pass:false,msg:'Error: '+r.error};
task=task||{};
if(task.expected!==undefined&&courseNorm(r.output)!==courseNorm(task.expected))
return {pass:false,msg:'Console shows "'+r.output+'", need "'+task.expected+'". '+(task.hint||'')};
const must=task.must||[];
for(let i=0;i<must.length;i++) if(code.indexOf(must[i])<0)
return {pass:false,msg:'Missing '+must[i]+'. '+(task.hint||'')};
return {pass:true,msg:'Correct! Next lesson unlocked.'};
},

save(){ try{ localStorage.setItem('tiny-py-course',JSON.stringify({idx:this.idx,done:this.done})); }catch(e){} },
restore(){ try{ const s=JSON.parse(localStorage.getItem('tiny-py-course')||'null'); if(s&&typeof s.idx==='number'){ this.idx=Math.min(s.idx,this.lessons().length-1); this.done=s.done||[]; } }catch(e){} },

load(i,intoEditor){
const L=this.lessons();
if(!L.length) return;
this.idx=Math.max(0,Math.min(i,L.length-1));
this.tracing=false;
this.render();
if(intoEditor!==false&&window.Editor){ this.lastCode=L[this.idx].starter; window.Editor.set(L[this.idx].starter); }
this.save();
},

exampleHtml(code){
return this.esc(code).split('\n').map((ln,n)=>'<span class="cl" data-l="'+(n+1)+'">'+(ln||' ')+'</span>').join('\n');
},

render(){
const el=document.getElementById('lessons'); if(!el) return;
const L=this.lessons(), lesson=L[this.idx]; if(!lesson) return;
const nDone=this.done.filter(Boolean).length;
el.innerHTML='<div class="course">'
+'<div class="cnav"><button class="btn" id="c-prev">← Prev</button>'
+'<span class="ctitle">'+this.esc(lesson.title)+' · '+nDone+'/'+L.length+'</span>'
+'<button class="btn primary" id="c-next">Next →</button></div>'
+'<p class="ctheory">'+this.esc(lesson.theory)+'</p>'
+'<pre class="cexample" aria-label="Example">'+this.exampleHtml(lesson.example)+'</pre>'
+'<div class="crow"><button class="btn" id="c-play">▶ Play trace</button></div>'
+'<pre class="cout-mini" aria-live="polite"></pre><p class="cnote"></p>'
+'<div class="ctask"><b>Your turn:</b> '+this.esc(lesson.task.prompt)
+'<span class="cstatus" id="c-status"> — type in the editor, press Run.</span></div>'
+'</div>';
document.getElementById('c-prev')?.addEventListener('click',()=>this.load(this.idx-1));
document.getElementById('c-next')?.addEventListener('click',()=>this.load(this.idx+1));
document.getElementById('c-play')?.addEventListener('click',()=>this.playTrace());
},

playTrace(){
if(this.tracing) return;
const lesson=this.lessons()[this.idx]; if(!lesson||!lesson.trace) return;
this.tracing=true;
const steps=lesson.trace;
const outEl=document.querySelector('.cout-mini'), noteEl=document.querySelector('.cnote');
document.querySelectorAll('.cexample .cl').forEach(s=>s.classList.remove('cl-hl'));
if(outEl)outEl.textContent=''; if(noteEl)noteEl.textContent='';
let i=0;
const step=()=>{
if(!this.tracing) return;
if(i>=steps.length){ this.tracing=false; return; }
const st=steps[i];
document.querySelectorAll('.cexample .cl').forEach(s=>s.classList.remove('cl-hl'));
(st.lines||[]).forEach(n=>{ const s=document.querySelector('.cexample .cl[data-l="'+n+'"]'); if(s)s.classList.add('cl-hl'); });
if(st.out&&outEl) outEl.textContent+=(outEl.textContent?'\n':'')+st.out;
if(noteEl) noteEl.textContent=st.note||'';
i++;
setTimeout(step,900);
};
step();
},

afterRun(){
const lesson=this.lessons()[this.idx]; if(!lesson||!window.Editor) return;
const code=window.Editor.get();
if(code==null||code===''||code===this.lastCode) return;
this.lastCode=code;
const res=this.checkTask(code,lesson.task);
const st=document.getElementById('c-status'); if(!st) return;
if(res.pass){
st.textContent=' ✓ '+res.msg; st.className='cstatus cpass';
this.done[this.idx]=true; this.save();
document.getElementById('c-next')?.classList.add('cnext-hi');
}else{
st.textContent=' — '+res.msg; st.className='cstatus cfail';
}
},

init(){
this.restore();
// learn.html reuses checkTask/save but renders its own UI: no #lessons, no auto-load.
if(typeof document!=='undefined'&&!document.getElementById('lessons')) return;
if(window.Editor&&window.Editor.get()==='') this.load(this.idx);
else { this.render(); this.lastCode=(window.Editor&&window.Editor.get())||null; }
}
};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{ if(window.Course) window.Course.init(); });
