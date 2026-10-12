// tiny-game.js — Ursina-style helpers, max simple
window.tiny=(()=>{
let sc=0;
const stage=()=>document.getElementById('stage')||document.body;
function mk(color,x=50,y=50,size=40){
const d=document.createElement('div');
d.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};border-radius:8px`;
stage().appendChild(d);return d;}
return{
box:(c,x,y)=>mk(c,x,y,40),
player:()=>{const p=mk('blue',100,100,40);p.id='player';return p;},
coin:(x=200,y=80)=>mk('gold',x,y,24),
text:(t)=>{const e=document.createElement('div');e.textContent=t;stage().appendChild(e);return e;},
score:(n)=>{if(typeof n==='number')sc=n;else sc+=1;
let s=document.getElementById('score')||(()=>{const e=document.createElement('div');e.id='score';stage().appendChild(e);return e;})();
s.textContent='Score: '+sc;return sc;},
onKey:(k,fn)=>document.addEventListener('keydown',e=>{if(e.key===k)fn();}),
onTouch:(fn)=>document.addEventListener('click',fn),
say:(t)=>{const el=document.getElementById('assistant');if(el)el.textContent=t;try{alert(t);}catch(e){}},
clear:()=>{stage().innerHTML='';sc=0;},
bg:(c)=>{document.body.style.background=c;}
};})();
