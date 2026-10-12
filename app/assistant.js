// assistant.js — rule-based helper for tiny-py mistakes
window.Assistant={
rules:[
{re:/^\s*(if|elif|for|while|def)\s+[^\n]*[^:\s]\s*$/m,msg:'That line needs a : at the end. Python blocks always end with a colon.'},
{re:/^\s*print\s+[^( \t]/m,msg:'print is a function here: write print(...) with brackets.'},
{re:/^\s*if\s+[^=<>!\n]*=[^=]/m,msg:'Comparing? Use == (two). One = saves a value.'},
{re:/\b(true|false|null)\b/,msg:'Python spells them True, False, None — capital first letter.'},
{re:/f["']/,msg:'f-strings are not in tiny-py yet — use "text " + str(x) instead.'},
 {re:/^\s*(import|from)\s+(?!tiny|ursina|math|tkinter)/m,msg:'Offline tiny-py has four modules: tiny, ursina, math, tkinter — try import math.'},
],
scan(){
const code=document.getElementById('editor')?.value||'';
let tip=null;
for(const r of this.rules){if(r.re.test(code)){tip='Hint: '+r.msg;break;}}
const el=document.getElementById('assistant');
if(el){ if(tip){ el.textContent=tip; el.hidden=false; } else { el.textContent=''; el.hidden=true; } }
return tip||'';}
};
