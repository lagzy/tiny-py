// tiny-tags.js — custom tags for tiny-html, maps 1:1 to real HTML
(function(){
const boxPaint=(el)=>{el.style.background=el.getAttribute('color')||'#f1f5f9';};
['t-text','t-title','t-button','t-img','t-box','t-row','t-center'].forEach(n=>{
if(customElements.get(n))return;
customElements.define(n,class extends HTMLElement{
connectedCallback(){if(n==='t-box')boxPaint(this);}
static get observedAttributes(){return['color'];}
attributeChangedCallback(){if(n==='t-box')boxPaint(this);}
});});
window.explainTag=function(tag){return{'t-text':'<p> paragraph','t-title':'<h1> heading','t-button':'<button>','t-box':'<div> colored box','t-img':'<img>','t-row':'flex <div> row','t-center':'centered <div>'}[tag]||tag;};
})();
