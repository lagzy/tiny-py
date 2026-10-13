// max.js — maximize the CODE / PREVIEW panels into viewport overlays.
// Buttons #btn-max-code #btn-max-preview toggle .max on their own panel;
// maximizing one unmaximizes the other; Escape closes all.
window.Max={
ICON_MAX:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
ICON_MIN:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
panelOf(btn){ return (btn&&btn.closest) ? btn.closest('.panel') : null; },
toggle(btn){
const p=this.panelOf(btn);
if(!p) return;
const was=p.classList.contains('max');
this.unmaxAll();
if(!was){ p.classList.add('max'); }
this.sync();
const ed=p.querySelector&&p.querySelector('#editor');
if(!was&&ed&&ed.focus) ed.focus();
},
unmaxAll(){
if(typeof document==='undefined'||!document.querySelectorAll) return;
document.querySelectorAll('.panel.max').forEach(p=>p.classList.remove('max'));
this.sync();
},
sync(){
['btn-max-code','btn-max-preview'].forEach(id=>{
const b=(typeof document==='undefined')?null:document.getElementById(id);
if(!b) return;
const p=this.panelOf(b);
const min=p&&p.classList.contains('max');
b.innerHTML=min?this.ICON_MIN:this.ICON_MAX;
if(b.setAttribute) b.setAttribute('aria-label',min?'Minimize':'Maximize');
});
},
init(){
['btn-max-code','btn-max-preview'].forEach(id=>{
const b=document.getElementById(id);
if(b) b.addEventListener('click',()=>this.toggle(b));
});
document.addEventListener('keydown',e=>{
if(e.key==='Escape') this.unmaxAll();
});
this.sync();
}
};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{ if(window.Max) window.Max.init(); });
