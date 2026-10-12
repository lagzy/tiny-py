// highlight.js — overlay syntax coloring for the editor. Offline, zero deps.
// Technique: transparent <textarea> over a <pre> showing the same text,
// tokenized by Highlighter.paint(). VS Code scope fidelity, house palette:
// gold keywords, yellow functions, teal classes, green strings,
// gray comments, soft-blue numbers. Python mode.
//
// Single regex pass, ordered like VS Code: strings and comments match whole
// before anything inside them can fire; keywords beat call names (if()).
(function(){
function esc(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
var WORDS = 'and|or|not|if|elif|else|for|while|def|return|True|False|None|import|from|as|pass|break|continue|in|is|with|class|lambda';
var TOKEN = new RegExp(
  '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\')' + // strings
  '|(#[^\\n]*)' + // comments
  '|\\b(class)\\s+([A-Za-z_]\\w*)' + // class names
  '|(@[A-Za-z_][\\w.]*)' + // decorators
  '|\\b(' + WORDS + ')\\b' + // keywords
  '|([A-Za-z_]\\w*)(?=\\()' + // function + method calls
  '|\\b(\\d[\\d_]*(?:\\.\\d+)?)\\b', // numbers
  'g');
function paint(code){
  var html = esc(code).replace(TOKEN, function(m, str, com, clsKw, clsName, dec, kw, call, num){
    if(str) return '<span class="tok-str">' + str + '</span>';
    if(com) return '<span class="tok-com">' + com + '</span>';
    if(clsKw) return '<span class="tok-kw">' + clsKw + '</span> <span class="tok-cls">' + clsName + '</span>';
    if(dec) return '<span class="tok-fn">' + dec + '</span>';
    if(kw) return '<span class="tok-kw">' + kw + '</span>';
    if(call) return '<span class="tok-fn">' + call + '</span>';
    return '<span class="tok-num">' + num + '</span>';
  });
  return html + '\n';
}
function sync(){
  var ed = document.getElementById('editor'), hl = document.getElementById('highlight');
  if(!ed || !hl) return;
  hl.innerHTML = paint(ed.value);
  // Prove painting works before hiding the real text: if this line never
  // runs, the textarea keeps its own readable colors (see .hl-on in CSS).
  if(ed.parentNode && ed.parentNode.classList) ed.parentNode.classList.add('hl-on');
  hl.scrollTop = ed.scrollTop;
  hl.scrollLeft = ed.scrollLeft;
}
var api = {paint: paint, sync: sync};
if(typeof window !== 'undefined') window.Highlighter = api;
if(typeof document !== 'undefined'){
  document.addEventListener('DOMContentLoaded', function(){
    var ed = document.getElementById('editor');
    if(!ed) return;
    ed.addEventListener('input', sync);
    ed.addEventListener('scroll', sync);
    sync();
  });
}
})();
