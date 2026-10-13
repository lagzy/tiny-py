// tinypy.js — tiny Python-subset that runs offline. Zero deps.
//
// What it is: real Python *syntax* for the basics (print, vars, if/elif/else,
// while, for, def, lists, strings) compiled to JS and run locally.
// What it is NOT: full CPython. Imports work for tiny, ursina, math and
// tkinter (small offline subsets); no other modules, no kwargs except
// Entity(...) and Tk widgets, no f-strings, no negative indexes.
(function(){

// --- string protection: swap literals for placeholders so later
// --- regexes never see inside quotes.
// NUL() builds the string-placeholder sentinel programmatically so no
// invisible character ever has to appear literally in this source.
function NUL(){ return String.fromCharCode(0); }
function protect(line){
  var kept = [];
  var out = line.replace(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g, function(m){
    kept.push(m);
    return NUL() + (kept.length - 1) + NUL();
  });
  return {text: out, kept: kept};
}
function restore(text, kept){
  return text.replace(new RegExp(NUL() + '(\\d+)' + NUL(), 'g'), function(m, i){ return kept[+i]; });
}

// --- split top-level commas (depth-aware, strings already protected).
function splitArgs(inner){
  var parts = [], depth = 0, cur = '';
  for(var i = 0; i < inner.length; i++){
    var ch = inner[i];
    if(ch === '(' || ch === '[' || ch === '{') depth++;
    if(ch === ')' || ch === ']' || ch === '}') depth--;
    if(ch === ',' && depth === 0){ parts.push(cur); cur = ''; }
    else cur += ch;
  }
  parts.push(cur);
  return parts;
}

// --- Python-style imports, offline edition.
// --- Known modules: tiny, ursina (game API, already global), math, tkinter.
// --- `import x` exposes the module object; `from x import a, b` binds names;
// --- unknown modules throw a friendly error instead of a JS SyntaxError.
var MODULES = {tiny: 1, ursina: 1, math: 1, tkinter: 1};
var STAR_NAMES = {
  math: ['pi', 'e', 'tau', 'inf', 'nan', 'sqrt', 'cbrt', 'floor', 'ceil', 'trunc', 'fabs', 'factorial', 'gcd', 'comb', 'perm', 'pow', 'exp', 'log', 'log10', 'log2', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'hypot', 'degrees', 'radians', 'copysign', 'isclose', 'isfinite', 'isinf', 'isnan'],
  tkinter: ['Tk', 'Label', 'Button', 'Entry']
};
function importErr(li, name){
  return {text: '__line(' + li + ');throw new Error("No module named \'' + name + '\' (offline tiny-py has: math, tkinter, tiny, ursina).");'};
}
function importLine(code, li){
  var m = code.match(/^import\s+([A-Za-z_]\w*)(?:\s+as\s+([A-Za-z_]\w*))?$/);
  if(m){
    if(!MODULES[m[1]]) return importErr(li, m[1]);
    if(m[2]) return {text: '__line(' + li + ');var ' + m[2] + ' = ' + m[1] + ';'};
    return {text: ''};
  }
  m = code.match(/^from\s+([A-Za-z_]\w*)\s+import\s+(.+)$/);
  if(m){
    if(!MODULES[m[1]]) return importErr(li, m[1]);
    var parts = splitArgs(m[2]);
    if(parts.length === 1 && parts[0].trim() === '*'){
      if(m[1] === 'tiny' || m[1] === 'ursina') return {text: ''};
      return {text: '__line(' + li + ');' + STAR_NAMES[m[1]].map(function(n){ return 'var ' + n + ' = ' + m[1] + '.' + n + ';'; }).join('')};
    }
    var js = '';
    for(var i = 0; i < parts.length; i++){
      var kv = parts[i].split(/\s+as\s+/);
      var orig = (kv[0] || '').trim(), al = ((kv[1] || kv[0]) || '').trim();
      if(!/^[A-Za-z_]\w*$/.test(orig) || !/^[A-Za-z_]\w*$/.test(al)) return null;
      js += 'var ' + al + ' = ' + m[1] + '.' + orig + ';';
    }
    return {text: '__line(' + li + ');' + js};
  }
  return null;
}

// --- Tkinter-style kwargs: Label(root, text="Hi") -> Label(root, {text:"Hi"}).
// --- Only Tk/Label/Button/Entry calls; first arg stays positional.
// --- Runs on protected text (strings hidden), handles nested parens.
function tkKwargs(line){
  var out = '', last = 0;
  var re = /\b(Tk|Label|Button|Entry)\s*\(/g, m;
  while((m = re.exec(line))){
    var open = m.index + m[0].length, depth = 1, j = open;
    while(j < line.length && depth > 0){
      var ch = line[j];
      if(ch === '(') depth++;
      else if(ch === ')') depth--;
      j++;
    }
    if(depth !== 0) continue;
    var inner = line.slice(open, j - 1);
    if(inner.trim() === '') continue;
    var parts = splitArgs(inner);
    if(parts.length < 2) continue;
    var rest = [], ok = true;
    for(var k = 1; k < parts.length; k++){
      if(!/^\s*[A-Za-z_]\w*\s*=(?!=)/.test(parts[k])){ ok = false; break; }
      rest.push(parts[k].replace(/=(?!=)/, ':'));
    }
    if(!ok) continue;
    out += line.slice(last, m.index) + m[1] + '(' + parts[0] + ',{' + rest.join(',') + '})';
    last = j;
  }
  return out + line.slice(last);
}
// --- Entity(color="blue", x=10) -> Entity({color:"blue", x:10}).
// --- Only Entity gets kwargs; everything else is positional.
// --- Runs on restored text (real quotes), called before final restore
// --- (a second restore pass is then a harmless no-op).
function entityKwargs(line, kept){
  var NUL = String.fromCharCode(0);
  var chunks = line.split(NUL), plain = '';
  for(var k = 0; k < chunks.length; k++){
    plain += (k % 2 === 1) ? kept[+chunks[k]] : chunks[k];
  }
  return plain.replace(/Entity\s*\(([^()]*)\)/g, function(m, inner){
    var parts = splitArgs(inner);
    var obj = [];
    for(var i = 0; i < parts.length; i++){
      var kv = parts[i].match(/^\s*([A-Za-z_]\w*)\s*=(?!=)/);
      if(!kv) return m; // not pure kwargs: leave for a runtime error
      obj.push(parts[i].replace(/=(?!=)/, ':'));
    }
    return 'Entity({' + obj.join(',') + '})';
  });
}

// --- expression rewrites, shared by statements and conditions.
function expr(t){
  return t
    .replace(/\bprint\s*\(/g, '__print(')
    .replace(/\brange\s*\(/g, '__range(')
    .replace(/\blen\s*\(/g, '__len(')
    .replace(/\bstr\s*\(/g, 'String(')
    .replace(/\bint\s*\(/g, '__int(')
    .replace(/\binput\s*\(/g, '__input(')
    .replace(/\.append\s*\(/g, '.push(')
    .replace(/\bis\s+not\b/g, '!==')
    .replace(/\bis\b/g, '===')
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/(\S+)\s+not\s+in\s+(\S+)/g, '!__contains($2, $1)')
    .replace(/\bnot\b/g, '!')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/(\S+?)\s*\/\/\s*(\S+)/g, 'Math.floor($1 / $2)')
    .replace(/(\S+)\s+in\s+(\S+)/g, '__contains($2, $1)');
}

// --- one logical line of Python -> JS (strings protected).
function transform(code, kept, li){
  if(/^pass\s*$/.test(code)) return {text: ';'};
  var im = importLine(code, li);
  if(im) return im;
  var m;
  // NOTE: __line() must never sit between '}' and 'else' (dangling else),
  // so elif/else carry it inside their own braces/condition.
  if((m = code.match(/^def\s+([A-Za-z_]\w*)\s*\((.*)\)\s*:$/))) return {text: '__line(' + li + ');function ' + m[1] + '(' + m[2] + '){', block: 1};
  if((m = code.match(/^if\s+(.+)\s*:$/))) return {text: '__line(' + li + ');if(' + expr(m[1]) + '){', block: 1};
  if((m = code.match(/^elif\s+(.+)\s*:$/))) return {text: 'else if(__line(' + li + ')&&(' + expr(m[1]) + ')){', block: 1};
  if(/^else\s*:$/.test(code)) return {text: 'else{__line(' + li + ');', block: 1};
  if((m = code.match(/^while\s+(.+)\s*:$/))) return {text: '__line(' + li + ');while(__guard(), ' + expr(m[1]) + '){', block: 1};
  if((m = code.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+)\s*:$/))) return {text: '__line(' + li + ');for(let ' + m[1] + ' of (' + expr(m[2]) + ')){', block: 1};
  return {text: '__line(' + li + ');' + entityKwargs(tkKwargs(expr(code)), kept)};
}

function transpile(src){
  var out = [], stack = [0];
  // Top-level `name = ...` bindings become real vars, so user variables
  // shadow window properties (window.name coerces objects to strings!)
  // instead of leaking onto window. Function bodies keep working: they
  // resolve through to these bindings like globals.
  var seen = {}, vars = [];
  src.replace(/\t/g, '    ').split('\n').forEach(function(raw){
    var p = protect(raw), line = p.text;
    var cut = line.indexOf('#');
    if(cut >= 0) line = line.slice(0, cut);
    if(/^\s/.test(line) || line.trim() === '') return;
    var m = line.trim().match(/^([A-Za-z_]\w*)\s*=(?!=)/);
    if(m && !seen[m[1]] && m[1].indexOf('__') !== 0 && m[1] !== 'arguments'){ seen[m[1]] = 1; vars.push(m[1]); }
  });
  if(vars.length) out.push('var ' + vars.join(', ') + ';');
  src.replace(/\t/g, '    ').split('\n').forEach(function(raw, li){
    var p = protect(raw), line = p.text;
    var cut = line.indexOf('#');
    if(cut >= 0) line = line.slice(0, cut); // # starts a comment (strings are hidden)
    var indent = (line.match(/^ */) || [''])[0].length;
    var code = line.trim();
    if(code === '') return; // blank / comment-only: stack untouched
    while(indent < stack[stack.length - 1]){ stack.pop(); out.push('}'); }
    if(indent > stack[stack.length - 1]) stack.push(indent); // entered a ':' block
    var t = transform(code, p.kept, li + 1);
    if(t.text) out.push(restore(t.text, p.kept));
  });
  while(stack.length > 1){ stack.pop(); out.push('}'); }
  return out.join('\n');
}

// --- prelude: runs before user code. Mini-stdlib + Ursina-style game API.
var PRELUDE = [
'var __out = [], __steps = 0, __pyline = 0;',
'function __line(n){ __pyline = n;',
'  if(typeof window !== "undefined"){ try{ window.__pyline = n; }catch(e){} } return 1; }',
'function __guard(){ if(++__steps > 1000000) throw new Error("Loop ran too long — check your while condition."); return 1; }',
'function __emit(line){ __out.push(line); if(__out.length > 200) __out.shift();',
'  if(typeof window !== "undefined"){ try{ window.__pyout = __out.slice(); }catch(e){} }',
'  if(typeof parent !== "undefined" && typeof window !== "undefined" && parent !== window){ try{ parent.postMessage({tiny:"print", line: line}, "*"); }catch(e){} }',
'  if(typeof document !== "undefined"){ var c = document.getElementById("console"); if(c) c.textContent = __out.join("\\n"); } }',
'function __show(v){ if(typeof v === "function") return "<function " + (v.name || "?") + ">";',
'  return (v && typeof v === "object") ? JSON.stringify(v) : String(v); }',
'function __print(){ if(arguments.length === 0){ __emit(""); return; }',
'  __emit([].map.call(arguments, __show).join(" ")); }',
'function __range(a, b, s){ if(b === undefined){ b = a; a = 0; } s = (s === undefined) ? 1 : s;',
'  var r = []; if(s > 0){ for(var i = a; i < b; i += s) r.push(i); } else { for(var j = a; j > b; j += s) r.push(j); } return r; }',
'function __len(x){ return x.length; }',
'function __int(x){ return Math.trunc(Number(x)); }',
'function __input(msg){ if(typeof __answers !== "undefined" && __answers.length) return __answers.shift(); throw {__needInput: (msg === undefined ? "" : String(msg))}; }',
'function __contains(box, item){',
'  if(typeof box === "string") return box.indexOf(item) >= 0;',
'  if(box && typeof box.length === "number") return box.indexOf(item) >= 0;',
'  return item in Object(box); }',
'function __stage(){ if(typeof document === "undefined") return null;',
'  return document.getElementById("stage") || null; }',
'function __num(v, d){ v = Number(v); return isNaN(v) ? d : v; }',
'function lerp(a, b, t){ a = Number(a); b = Number(b); t = Number(t); return a + (b - a) * t; }',
'var __tweens = [], __delayed = [];',
'var time = {dt: 0};',
'function __tween(e, prop, to, seconds){',
'  if(!e || e.dead) return;',
'  seconds = Number(seconds); if(!(seconds > 0)) seconds = 0;',
'  for(var i = __tweens.length - 1; i >= 0; i--){ if(__tweens[i].e === e && __tweens[i].prop === prop) __tweens.splice(i, 1); }',
'  var from = (prop === "sc") ? e.sc : e[prop];',
'  __tweens.push({e: e, prop: prop, from: from, to: Number(to), seconds: seconds, el: 0});',
'  if(seconds === 0) __stepTween(__tweens[__tweens.length - 1], 1); }',
'function __stepTween(tw, dt){',
'  if(tw.e.dead) return true;',
'  tw.el += dt;',
'  var k = (tw.seconds <= 0) ? 1 : Math.min(1, tw.el / tw.seconds);',
'  var v = tw.from + (tw.to - tw.from) * k;',
'  if(tw.prop === "sc") tw.e.sc = v; else tw.e[tw.prop] = v;',
'  if(tw.e.__sync) tw.e.__sync();',
'  return k >= 1; }',
'function __frame(dt){ dt = Number(dt); if(!(dt > 0)) dt = 0; time.dt = dt;',
'  for(var i = __tweens.length - 1; i >= 0; i--){ if(__stepTween(__tweens[i], dt)) __tweens.splice(i, 1); }',
'  for(var j = __delayed.length - 1; j >= 0; j--){ __delayed[j].t -= dt;',
'    if(__delayed[j].t <= 0){ var f = __delayed[j].fn; __delayed.splice(j, 1); f(); } }',
'  return 1; }',
'function destroy(e){ if(!e) return;',
'  e.dead = true;',
'  for(var i = __tweens.length - 1; i >= 0; i--){ if(__tweens[i].e === e) __tweens.splice(i, 1); }',
'  try{ if(e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el); }catch(x){} }',
'function invoke(fn, delay){ if(typeof fn !== "function") throw new Error("invoke needs a function, e.g. invoke(wave, 1).");',
'  __delayed.push({fn: fn, t: Number(delay) || 0}); }',
'function __mk(color, x, y, size, round){ var st = __stage(); if(!st) return null;',
'  var d = document.createElement("div");',
'  d.style.cssText = "position:absolute;left:" + x + "px;top:" + y + "px;width:" + size + "px;height:" + size + "px;background:" + color + ";" + (round ? "border-radius:50%;" : "border-radius:8px;");',
'  st.appendChild(d); return d; }',
'var color = {red:"red", blue:"blue", green:"green", yellow:"gold", orange:"orange", purple:"purple", pink:"pink", white:"white", black:"black", gray:"gray", cyan:"cyan"};',
'function __ent(d, ix, iy){ var sx = __num(ix, 0), sy = __num(iy, 0);',
'  function place(){ if(d){ d.style.left = sx + "px"; d.style.top = sy + "px"; } }',
'  place();',
'  var e = { el: d, dead: false, rot: 0, sc: 1,',
'    get x(){ return sx; }, set x(v){ sx = __num(v, sx); place(); },',
'    get y(){ return sy; }, set y(v){ sy = __num(v, sy); place(); },',
'    set color(v){ if(d) d.style.background = v; },',
'    animate_x: function(t, s){ __tween(e, "x", t, s); },',
'    animate_y: function(t, s){ __tween(e, "y", t, s); },',
'    animate_scale: function(t, s){ __tween(e, "sc", t, s); },',
'    __sync: function(){ if(d && !e.dead) d.style.transform = "rotate(" + e.rot + "deg) scale(" + e.sc + ")"; } };',
'  return e; }',
'function Entity(o){ o = o || {};',
'  return __ent(__mk(typeof o.color === "string" ? o.color : "blue", __num(o.x, 60), __num(o.y, 60), __num(o.size, 40), false), __num(o.x, 60), __num(o.y, 60)); }',
'function box(c, x, y){ x = __num(x, 50); y = __num(y, 50); return __ent(__mk(c || "red", x, y, 40, false), x, y); }',
'function circle(c, x, y){ x = __num(x, 50); y = __num(y, 50); return __ent(__mk(c || "gold", x, y, 30, true), x, y); }',
'function player(){ return __ent(__mk("blue", 100, 100, 40, false), 100, 100); }',
'function coin(x, y){ x = __num(x, 200); y = __num(y, 80); return __ent(__mk("gold", x, y, 24, true), x, y); }',
'function image(nm, x, y, w, h){ var st = __stage(); var src = null;',
'  try{ src = (typeof window !== "undefined" && window.__images) ? window.__images[nm] : null; }catch(e){ src = null; }',
  '  if(!st || !src) return __ent(null, __num(x, 60), __num(y, 60));',
'  var im = document.createElement("img"); im.src = src; im.alt = String(nm);',
'  im.style.cssText = "position:absolute;left:" + __num(x, 60) + "px;top:" + __num(y, 60) + "px;" + ((w !== undefined) ? "width:" + __num(w, 40) + "px;" : "") + ((h !== undefined) ? "height:" + __num(h, 40) + "px;" : "max-width:120px;");',
'  st.appendChild(im); return __ent(im, __num(x, 60), __num(y, 60)); }',
'function on_click(fn){ if(typeof document !== "undefined"){ var st = __stage(); if(st) st.addEventListener("click", function(){ fn(); }); } }',
'function text(t){ var st = __stage(); if(!st) return null;',
'  var e = document.createElement("div"); e.textContent = __show(t); st.appendChild(e); return e; }',
'var __score = 0;',
'function score(n){ if(typeof n === "number") __score = n; else __score += 1;',
'  if(typeof document !== "undefined"){ var s = document.getElementById("score");',
'    if(!s){ var st = __stage(); if(st){ s = document.createElement("div"); s.id = "score"; st.appendChild(s); } }',
'    if(s) s.textContent = "Score: " + __score; } return __score; }',
'function on_key(key, fn){ if(typeof document !== "undefined" && __stage()) document.addEventListener("keydown", function(e){ if(e.key === key) fn(); }); }',
'function say(t){ __emit(String(t)); if(typeof alert !== "undefined"){ try{ alert(t); }catch(e){} } }',
'function clear(){ var st = __stage(); if(st) st.innerHTML = ""; __score = 0; }',
'function bg(c){ if(typeof document !== "undefined" && __stage()) document.body.style.background = c; }',
'var math = {',
'  pi: Math.PI, e: Math.E, tau: Math.PI * 2, inf: Infinity, nan: NaN,',
'  sqrt: function(x){ return Math.sqrt(Number(x)); },',
'  cbrt: function(x){ return Math.cbrt(Number(x)); },',
'  floor: function(x){ return Math.floor(Number(x)); },',
'  ceil: function(x){ return Math.ceil(Number(x)); },',
'  trunc: function(x){ return Math.trunc(Number(x)); },',
'  fabs: function(x){ return Math.abs(Number(x)); },',
'  factorial: function(n){ n = Math.floor(Number(n)); if(!(n >= 0)) return NaN; var r = 1; for(var i = 2; i <= n; i++) r *= i; return r; },',
'  gcd: function(a, b){ a = Math.abs(Math.trunc(Number(a))); b = Math.abs(Math.trunc(Number(b))); while(b){ var t = a % b; a = b; b = t; } return a; },',
'  comb: function(n, k){ n = Math.trunc(Number(n)); k = Math.trunc(Number(k)); if(k < 0 || k > n) return 0; if(k > n - k) k = n - k; var r = 1; for(var i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); },',
'  perm: function(n, k){ n = Math.trunc(Number(n)); k = (k === undefined) ? n : Math.trunc(Number(k)); if(k < 0 || k > n) return 0; var r = 1; for(var i = 0; i < k; i++) r *= (n - i); return r; },',
'  pow: function(x, y){ return Math.pow(Number(x), Number(y)); },',
'  exp: function(x){ return Math.exp(Number(x)); },',
'  log: function(x, base){ x = Number(x); if(base === undefined) return Math.log(x); return Math.log(x) / Math.log(Number(base)); },',
'  log10: function(x){ return Math.log10(Number(x)); },',
'  log2: function(x){ return Math.log2(Number(x)); },',
'  sin: function(x){ return Math.sin(Number(x)); },',
'  cos: function(x){ return Math.cos(Number(x)); },',
'  tan: function(x){ return Math.tan(Number(x)); },',
'  asin: function(x){ return Math.asin(Number(x)); },',
'  acos: function(x){ return Math.acos(Number(x)); },',
'  atan: function(x){ return Math.atan(Number(x)); },',
'  atan2: function(y, x){ return Math.atan2(Number(y), Number(x)); },',
'  hypot: function(x, y){ return Math.hypot(Number(x), Number(y)); },',
'  lerp: function(a, b, t){ return lerp(a, b, t); },',
'  degrees: function(x){ return Number(x) * 180 / Math.PI; },',
'  radians: function(x){ return Number(x) * Math.PI / 180; },',
'  copysign: function(x, y){ x = Math.abs(Number(x)); return Number(y) < 0 ? -x : x; },',
'  isclose: function(a, b, rt, at){ a = Number(a); b = Number(b); rt = (rt === undefined) ? 1e-9 : Number(rt); at = (at === undefined) ? 0 : Number(at); return Math.abs(a - b) <= Math.max(rt * Math.max(Math.abs(a), Math.abs(b)), at); },',
'  isfinite: function(x){ return isFinite(Number(x)); },',
'  isinf: function(x){ x = Number(x); return x === Infinity || x === -Infinity; },',
'  isnan: function(x){ return isNaN(Number(x)); }',
'};',
'var ursina = {Entity: Entity, box: box, circle: circle, player: player, coin: coin, text: text, score: score, on_click: on_click, on_key: on_key, say: say, clear: clear, bg: bg, color: color};',
'var tiny = ursina;',
'var tkinter = (function(){',
'  var NODOC = (typeof document === "undefined");',
'  function opts(o){ return (typeof o === "string") ? {text: o} : (o || {}); }',
'  function stageBox(){ if(NODOC) return null; var st = __stage(); if(st) return st;',
'    return document.createElement("div"); }',
'  function Tk(){',
'    if(NODOC) return {title: function(){}, geometry: function(){}, mainloop: function(){}};',
'    var win = document.createElement("div");',
'    win.style.cssText = "border:2px solid #888;border-radius:8px;background:#fff;max-width:320px;margin:6px 0;overflow:hidden;";',
'    var bar = document.createElement("div");',
'    bar.style.cssText = "background:#eee;padding:4px 10px;font-size:12px;"; bar.textContent = "tk";',
'    var body = document.createElement("div"); body.style.cssText = "padding:10px;";',
'    win.appendChild(bar); win.appendChild(body);',
'    var st = __stage(); if(st) st.appendChild(win);',
'    return {_body: body,',
'      title: function(t){ bar.textContent = String(t); },',
'      geometry: function(g){ var m = String(g).match(/(\\d+)x(\\d+)/); if(m){ win.style.width = m[1] + "px"; } },',
'      mainloop: function(){} };',
'  }',
'  function place(e, parent){ var box = (parent && parent._body) ? parent._body : stageBox(); if(e && box) box.appendChild(e); }',
'  function Label(parent, o){ o = opts(o); var e = NODOC ? null : document.createElement("div");',
'    if(e && o.text !== undefined) e.textContent = String(o.text); place(e, parent);',
'    var w = {el: e, pack: function(){ return w; }, grid: function(){ return w; }, place: function(){ return w; },',
'      config: function(n){ n = opts(n); if(e && n.text !== undefined) e.textContent = String(n.text); } };',
'    return w; }',
'  function Button(parent, o){ o = opts(o); var e = NODOC ? null : document.createElement("button");',
'    function apply(n){ if(e && n.text !== undefined) e.textContent = String(n.text);',
'      if(typeof n.command === "function"){ o.command = n.command; if(e) e.onclick = function(){ o.command(); }; } }',
'    var w = {el: e, pack: function(){ return w; }, grid: function(){ return w; }, place: function(){ return w; },',
'      config: function(n){ apply(opts(n)); },',
'      invoke: function(){ if(typeof o.command === "function") o.command(); } };',
'    apply(o); place(e, parent); return w; }',
'  function Entry(parent, o){ o = opts(o); var e = NODOC ? null : document.createElement("input"); var val = "";',
'    if(e && o.width !== undefined) e.size = Number(o.width) || 20;',
'    var w = {el: e, pack: function(){ return w; }, grid: function(){ return w; }, place: function(){ return w; },',
'      get: function(){ return e ? e.value : val; },',
'      delete: function(){ val = ""; if(e) e.value = ""; },',
'      insert: function(i, t){ val = String(t); if(e) e.value = val; } };',
'    place(e, parent); return w; }',
'  return {Tk: Tk, Label: Label, Button: Button, Entry: Entry};',
'})();'
].join('\n');

function friendly(err){
  var msg = String((err && err.message) || err);
  var undef = msg.match(/^([^ ]+) is not defined$/);
  if(undef) return "'" + undef[1] + "' is not available in tiny-py yet (offline subset: print, len, range, str, int, input, basics + game API. Importable: math, tkinter, tiny, ursina).";
  return msg;
}

function pyLine(){ try{ if(typeof window !== 'undefined' && window.__pyline) return window.__pyline; }catch(e){} return 0; }
function pyOut(){ try{ if(typeof window !== 'undefined' && window.__pyout) return window.__pyout.join('\n'); }catch(e){} return ''; }
function withLine(err){
  var ln = pyLine(), msg = friendly(err);
  return ln ? ('line ' + ln + ': ' + msg) : msg;
}

function run(code, answers){
  try{ if(typeof window !== 'undefined'){ window.__pyline = 0; window.__pyout = []; } }catch(e){}
  var js;
  try{ js = transpile(code); }
  catch(e){ return {output: '', error: 'Could not read that: ' + e.message}; }
  var fn;
  try{ fn = new Function(PRELUDE + '\nvar __answers = ' + JSON.stringify(answers || []) + ';\n' + js + '\n;return {updateFn: (typeof update === "function") ? update : null, frameFn: (typeof __frame === "function") ? __frame : null, out: __out.join("\\n")};'); }
  catch(e){ return {output: pyOut(), error: withLine(e)}; }
  var res;
  try{ res = fn(); }
  catch(e){
    if(e && e.__needInput !== undefined) return {output: pyOut(), error: '', needInput: String(e.__needInput)};
    return {output: pyOut(), error: withLine(e)};
  }
  // NOTE: no auto game-loop here. The caller owns updateFn (browser runner
  // restarts it per run so stale loops die; node just reads output).
  return {output: res.out, error: '', update: res.updateFn, frame: res.frameFn};
}

// bundle(): the whole engine as one embeddable source string, so sandboxed
// previews can inline it instead of loading a file (file:// blocks that).
// Every helper below is self-contained; only sibling names are referenced,
// so re-evaluating the bundle rebuilds a working TinyPy in any realm.
function bundle(){
  var names=['NUL','protect','restore','splitArgs','entityKwargs','tkKwargs','importErr','importLine','expr','transform','transpile','friendly','pyLine','pyOut','withLine','run'];
  var here={NUL:NUL,protect:protect,restore:restore,splitArgs:splitArgs,entityKwargs:entityKwargs,tkKwargs:tkKwargs,importErr:importErr,importLine:importLine,expr:expr,transform:transform,transpile:transpile,friendly:friendly,pyLine:pyLine,pyOut:pyOut,withLine:withLine,run:run};
  var src='var PRELUDE='+JSON.stringify(PRELUDE)+';\n';
  src+='var MODULES='+JSON.stringify(MODULES)+';\n';
  src+='var STAR_NAMES='+JSON.stringify(STAR_NAMES)+';\n';
  names.forEach(function(n){ src+='var '+n+'='+here[n].toString()+';\n'; });
  return src+'window.TinyPy={transpile:transpile,run:run};';
}

var api = {transpile: transpile, run: run, bundle: bundle};
if(typeof window !== 'undefined') window.TinyPy = api;
if(typeof module !== 'undefined' && module.exports) module.exports = api;
})();
