// preview.js — run Python in a sandboxed iframe (stage only).
// The engine is embedded INLINE (no <script src>): opaque-origin iframes
// on file:// cannot load subresources, but inline scripts run fine.
// print() lines stream to the separate console panel via postMessage.
// input() pauses with need-input; answers re-run the program with the
// recorded answers queued (deterministic replay). Stale update() loops
// die via the seq guard.
window.Preview={
engineSrc(){
const el=document.getElementById('tinyengine');
if(el&&el.textContent&&el.textContent.trim())return el.textContent;
const T=window.TinyPy;
return (T&&T.bundle)?T.bundle():'';
},
runnerSrc(){
return `(function(){
var code=document.getElementById("usersrc").textContent;
var answers=[];
var seq=0;
function post(m){try{parent.postMessage(m,"*");}catch(e){}}
function clearStage(){var st=document.getElementById("stage");if(st)st.innerHTML="";}
function startLoop(up,fr,my){
var last=null;
function step(now){
if(my!==seq)return;
var dt=0.05;
if(typeof now==="number"){ if(typeof last==="number"){ dt=(now-last)/1000; if(!(dt>0)||dt>0.25)dt=0.05; } last=now; }
try{ if(fr)fr(dt); }catch(e){post({tiny:"error",message:"Error in motion: "+String((e&&e.message)||e)});return;}
try{up();}catch(e){post({tiny:"error",message:"Error in update: "+String((e&&e.message)||e)});return;}
if(typeof requestAnimationFrame!=="undefined")requestAnimationFrame(step);
}
if(typeof requestAnimationFrame!=="undefined")requestAnimationFrame(step);
}
function execute(){
var my=++seq;
clearStage();
post({tiny:"clear"});
var r;
try{
if(typeof TinyPy==="undefined")throw new Error("Python engine did not start.");
r=TinyPy.run(code,answers.slice());
}catch(e){post({tiny:"error",message:String((e&&e.message)||e)});post({tiny:"done"});return;}
if(r.needInput!==undefined&&r.needInput!==null){post({tiny:"need-input",prompt:r.needInput});return;}
if(r.error)post({tiny:"error",message:r.error});
if(r.update||r.frame)startLoop(r.update||function(){},r.frame||null,my);
else post({tiny:"done"});
}
window.addEventListener("message",function(ev){
var d=ev.data||{};
if(d.tiny==="answer"){answers.push(String(d.value===undefined?"":d.value));execute();}
});
execute();
})();`;
},
render(){
const code=window.Editor?Editor.get():'';
const engine=this.engineSrc().replace(/<\/script/gi,'<\\/script');
const safe=code.replace(/<\/script/gi,'<\\/script');
let imgMap={};
try{ imgMap=(window.Images&&window.Images.data())||{}; }catch(e){ imgMap={}; }
const imgs=JSON.stringify(imgMap).replace(/<\/script/gi,'<\\/script');
let body;
if(!engine){
body='<pre>Error: Python engine missing from this page.</pre>';
}else{
body='<div id="stage"></div><script>window.__images='+imgs+'<\/script><script>'+engine+'<\/script><script type="text/plain" id="usersrc">'+safe+'<\/script><script>'+this.runnerSrc()+'<\/script>';
}
const doc='<!DOCTYPE html><html><head><style>body{font-family:system-ui,sans-serif;padding:8px;margin:0}#stage{position:relative;min-height:280px}</style></head><body>'+body+'</body></html>';
const f=document.getElementById('preview');if(f)f.srcdoc=doc;
const kh=document.getElementById('keyhint');
if(kh) kh.hidden = !/on_key\s*\(|on_click\s*\(/.test(code);
if(window.Csl)window.Csl.clear();},
init(){
let t;const ed=document.getElementById('editor');if(!ed)return;
ed.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{Preview.render();window.Assistant?.scan();window.Course?.afterRun();},300);});
document.getElementById('btn-run')?.addEventListener('click',()=>{Preview.render();window.Assistant?.scan();window.Course?.afterRun();});
Preview.render();}
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>window.Preview?.init(),100));
