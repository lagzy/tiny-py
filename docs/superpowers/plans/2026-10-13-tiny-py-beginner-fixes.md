# Tiny-py Beginner Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make lessons 4, 10, 11, 13, 14, 19 and global assistant/input UX passable by a first-time computer user without changing engine semantics.

**Architecture:** Edit copy + starters in `app/course-data.js`, add 2 assistant rules in `app/assistant.js`, clarify input/stage hints in `learn.html` + `app/preview.js` + `app/console.js`. No new files, no engine rewrite, no CSS redesign.

**Tech Stack:** Vanilla JS, HTML textarea editor, TinyPy subset transpiler (`app/tinypy.js`), browser `tests/test-*.html` harnesses + `node` one-liners for verification.

## Global Constraints

- Do NOT change TinyPy language semantics in `app/tinypy.js` (only copy/starters/hints).
- All paths relative, no leading `/` (Pages + file:// must keep working).
- IDs are contract: `#editor #preview #assistant #cout #cinrow #cin #btn-run #btn-send #keyhint` must survive.
- `#assistant` stays plain-text node (`assistant.js` overwrites `textContent`).
- Offline only: system fonts, no CDN, no backend.
- Do NOT commit unless user explicitly asks (report diff only).
- Every behavior change needs a failing-then-passing check with `node` or open-in-browser test.

---

### Task 1: Scaffold L4 Ask + L11 Clicks starters

**Files:**
- Modify: `app/course-data.js:26-31` (L4 starter + hint)
- Modify: `app/course-data.js:79-84` (L11 starter comment)
- Test: `tests/test-lessons.html` (must still report 19 lessons) + node check below

**Interfaces:**
- Consumes: `window.LESSONS[i].starter`, `window.Course.checkTask(code, task)` from `app/lessons.js:11-27`
- Produces: New starter strings that still satisfy existing `must` + `expected`/`answers` checks

- [ ] **Step 1: Write the failing check (prove current starters are unscaffolded)**

```js
// check-starter.js (throwaway node script, do not commit)
const fs = require('fs');
const src = fs.readFileSync('app/course-data.js','utf8');
const hasL4Scaffold = src.includes('name = input(') && src.includes('print(name)');
const hasL11Placeholder = /on_click\(\.\.\.\)|on_click\(___\)|# THEN: on_click\(hit\)/.test(src);
console.log('L4 scaffolded:', hasL4Scaffold, 'L11 placeholder:', hasL11Placeholder);
if (hasL4Scaffold && hasL11Placeholder) console.log('ALREADY FIXED');
else console.log('NEEDS FIX');
```

Run: `node check-starter.js`
Expected: `NEEDS FIX` (current L4 starter is `print("hi")`, L11 starter ends with bare TODO comment)

- [ ] **Step 2: Run to verify it reports NEEDS FIX**

Run: `node check-starter.js`
Expected: prints `L4 scaffolded: false` (or true only because example contains it — must check starter block specifically; adjust to parse starter line if needed) and `NEEDS FIX`

- [ ] **Step 3: Minimal implementation — edit starters only**

In `app/course-data.js`, L4:
```js
// BEFORE:
starter:'print("hi")',
task:{prompt:'Ask the name with input() and print it, then Run and type Ada',...}
// AFTER:
starter:'name = input("Name? ")\nprint("...")',
task:{prompt:'Finish line 2 to print the name, then press Run and type Ada + Send',expected:'Ada',answers:['Ada'],must:['input(','print('],hint:'Line 1 is done. On line 2 replace ... with name — keep it as print(name).'},
```

In `app/course-data.js`, L11 starter:
```js
// BEFORE:
starter:'from tiny import *\nscore(0)\nb = box("tomato", 90, 90)\n\ndef hit():\n    score()\n    b.x = 20\n\n# TODO: connect clicks below — wire hit up, Run, then click the tomato',
// AFTER:
starter:'from tiny import *\nscore(0)\nb = box("tomato", 90, 90)\n\ndef hit():\n    score()\n    b.x = 20\n\non_click(...)  # <-- replace ... with hit, press Run, then click the tomato',
```
Keep `task.must` as `['def hit','score()','on_click(hit)']` so `on_click(...)` placeholder fails with `Missing on_click(hit). Last line: replace ... with hit` — update hint to `'Replace ... with hit so the last line reads on_click(hit)'`.

- [ ] **Step 4: Verify fix passes + old solutions still pass**

Run:
```js
node -e "const T=require('./app/tinypy.js'); let r=T.run('name = input(\"Name? \")\nprint(name)', ['Ada']); console.log(JSON.stringify(r));"
```
Expected: `{"output":"Ada","error":""}` no `needInput`.

Also open `tests/test-lessons.html` in browser (or `node -e` parsing LESSONS length) — must still say `course OK (19 lessons)`.

- [ ] **Step 5: Report diff (do not commit)**

Run: `git diff --stat` + `git diff -U5 app/course-data.js`
Expected: only starter/hint/prompt lines changed in L4 + L11.

---

### Task 2: L10 stage-vs-console + L14 example alignment

**Files:**
- Modify: `app/course-data.js:72-77` (L10 theory/prompt/hint)
- Modify: `app/course-data.js:128-151` (L14 example/theory/steps prompts)
- Test: node TinyPy run for L10 Entity (no error) + L14 gravity starter

**Interfaces:**
- Consumes: `TinyPy.run`, `Preview.render` keyhint regex `/on_key\s*\(|on_click\s*\(/` in `app/preview.js:67`
- Produces: Clearer theory strings; L14 example that matches starter vocabulary

- [ ] **Step 1: Write failing copy check**

```js
// check-copy.js
const fs=require('fs'); const s=fs.readFileSync('app/course-data.js','utf8');
console.log('L10 mentions console-vs-stage:', /CONSOLE|console.*stage|stage.*console/i.test(s.split("id:'entity'")[1].split("id:'clicker'")[0]));
console.log('L14 example mentions gravity:', /gravity/.test(s.split("id:'platformer'")[1].split("id:'strings'")[0].split("example:")[1].split("',")[0]));
```

Run: `node check-copy.js`
Expected: both `false` (current L10 theory has no console/stage split; L14 example is `vy/gravity/print` toy, starter is full game)

- [ ] **Step 2: Run to verify false/false**

Run: `node check-copy.js`
Expected: `L10 mentions console-vs-stage: false`, `L14 example mentions gravity: false`

- [ ] **Step 3: Minimal copy edits**

L10 in `app/course-data.js`:
```js
// BEFORE theory:'Entity() puts a square on the stage. color= x= y= describe it.',
// AFTER:
theory:'Entity() puts a square on the stage (right, PREVIEW). print() goes to the console (right, below). color= x= y= describe the square.',
// prompt BEFORE:'Blue square at 100, 100'
// prompt AFTER:'Blue square at 100, 100 in the PREVIEW (print goes to CONSOLE — this lesson uses the stage)'
// hint append: ' Run and look right: blue square = PREVIEW, words = CONSOLE.'
```

L14 in `app/course-data.js`:
```js
// theory BEFORE:'Games fake physics: each frame, gravity grows downward speed. Jump sets it negative. Three steps: fall, hop, treasure. Click the stage, then press space to play.',
// theory AFTER:'Games fake physics: each frame, gravity grows downward speed. Jump sets it negative. Three steps: fall, hop, treasure. After Run, click the stage once, then press space to play.',
// example BEFORE:'vy = 0\ngravity = 2\nvy = vy + gravity\nprint(vy)',
// example AFTER:'vy = 0\ngravity = 2\nvy = vy + gravity  # speed grows by gravity each frame',
// trace out stays '2' — update trace note 3 to 'Speed grows by gravity (2). In the game below this runs every frame.'
// Step Fall prompt append:' (Look in PREVIEW: blue drops onto green.)'
// Step Hop prompt append:' (Click the stage first so space reaches the game.)'
// Step Treasure prompt append:' (Click the stage, hop with space into the gold.)'
```
Do NOT change `must` arrays or step starter code (engine behavior unchanged).

- [ ] **Step 4: Verify**

Run: `node check-copy.js`
Expected: both `true`.

Run: `node -e "const T=require('./app/tinypy.js'); console.log(T.run('from tiny import *\nplayer = Entity(color=\"blue\", x=100, y=100)').error||'OK')"`
Expected: `OK` (no `needInput`, no error in node; stage null-safe).

- [ ] **Step 5: Report diff**

`git diff -U5 app/course-data.js` — copy-only.

---

### Task 3: Soften L13 wall + give L19 visible payoff

**Files:**
- Modify: `app/course-data.js:96-126` (L13 steps prompts/hints)
- Modify: `app/course-data.js:193-200` (L19 theory/prompt/hint)
- Test: node run of L13 Board step expected output + L19 must-check

**Interfaces:**
- Consumes: `Course.checkTask` norm (`courseNorm` trims trailing spaces/newlines) in `app/lessons.js:5`
- Produces: Same `expected`/`must` (no check loosening), but prompts tell exact Send-flow + L19 tells where to look

- [ ] **Step 1: Failing UX check**

```js
// check-hard.js
const fs=require('fs'); const s=fs.readFileSync('app/course-data.js','utf8');
const l13=s.split("id:'tictactoe'")[1].split("id:'platformer'")[0];
console.log('L13 mentions Send:', /Send/.test(l13));
console.log('L13 warns 5 inputs:', /5 times|five|0.*3.*1.*4.*2.*Send/i.test(l13));
const l19=s.split("id:'tkinter'")[1];
console.log('L19 tells where to look:', /PREVIEW|stage/i.test(l19));
```

Run: `node check-hard.js`
Expected: L13 Send maybe true once but not per-step; L19 `false` (current: `Windows print nothing.` with no stage pointer)

- [ ] **Step 2: Run to confirm**

Run: `node check-hard.js`
Expected: `L19 tells where to look: false`

- [ ] **Step 3: Minimal edits (no expected/must changes)**

L13 Step Play prompt BEFORE: `'No code to change — just play. Run, then type 0, 3, 1, 4, 2 into the console when it asks, and watch X fill the top row.'`
AFTER: `'No code to change — just play. Press Run, then when the console asks "X moves"/"O moves": type 0 + Send, 3 + Send, 1 + Send, 4 + Send, 2 + Send (5 Sends total). Watch X fill the top row.'`
L13 Step Referee prompt append: `' Same 5 Sends as Play (0, 3, 1, 4, 2). If it says "asked for more input", you missed a Send — press Run again.'`
L13 top task prompt append: `' Tip: each Send = one number. 5 numbers total.'`
L19:
```js
// theory BEFORE:'import tkinter opens real windows. Tk() is the window, Label shows words, pack() puts things in.',
// theory AFTER:'import tkinter opens real windows (here: a white card in the PREVIEW stage). Tk() is the window, Label shows words, pack() puts things in.',
// prompt BEFORE:'root.title("Hi"), a Label with text "Hello!", .pack(), and root.mainloop() to finish',
// prompt AFTER:'root.title("Hi"), a Label with text "Hello!", .pack(), and root.mainloop(). Press Run and look in PREVIEW for a white card titled Hi with Hello! inside (CONSOLE stays empty — that is normal).',
// hint append:' Look right in PREVIEW for the card.'
```

- [ ] **Step 4: Verify checks still pass**

Run:
```js
node -e "
const T=require('./app/tinypy.js');
let code='board = [\" \", \" \", \" \", \" \", \" \", \" \", \" \", \" \", \" \"]\nboard[0] = \"X\"\nboard[4] = \"O\"\nprint(board[0] + \"|\" + board[1] + \"|\" + board[2])';
console.log(JSON.stringify(T.run(code)));
"
```
Expected: `output:"X| | "` no error.

- [ ] **Step 5: Report diff**

`git diff -U5 app/course-data.js`

---

### Task 4: Assistant indent rule + input/arrow UX

**Files:**
- Modify: `app/assistant.js:3-10` (add 2 rules)
- Modify: `app/console.js:9-15` (input placeholder hint) + `learn.html:70` (cin hint) if needed
- Modify: `learn.html:259-264` (arrow-key guard: don't skip when Map open? keep simple: require no modifier + not typing — already there; add comment + ensure Map Esc closes)
- Modify: `app/preview.js:67` (keyhint copy: 'click the stage, then play' -> 'click the stage first, then press space/click')
- Test: `tests/test-assistant.html` + node regex checks

**Interfaces:**
- Consumes: `Assistant.scan()` reading `#editor` value, `Csl.ask(prompt)`, `Preview.render` keyhint
- Produces: New hint strings; no API change

- [ ] **Step 1: Write failing test**

```js
// check-assist.js
const fs=require('fs');
const a=fs.readFileSync('app/assistant.js','utf8');
console.log('has indent rule:', /indent|Indentation|leading spaces/i.test(a));
console.log('has quotes rule:', /quote|Quote/i.test(a));
const p=fs.readFileSync('app/preview.js','utf8');
console.log('keyhint clear:', /click the stage first/i.test(p));
```

Run: `node check-assist.js`
Expected: `has indent rule: false`, `keyhint clear: false`

- [ ] **Step 2: Run to verify false**

Run: `node check-assist.js`
Expected: false/false as above.

- [ ] **Step 3: Minimal implementation**

In `app/assistant.js` rules, append (before closing `]`):
```js
{re:/\n\s+\S/,msg:'Indentation matters: blocks after if/for/while/def need 4 spaces. Tab adds them.'},
{re:/["\'][^"\']*$/,msg:'Unclosed quote? Every " needs a closing " on the same line.'},
```
Note: first regex is broad — scope it to only fire when line starts with spaces AND previous line ends with `:`? Keep simple per YAGNI but avoid false positives on normal indented code: use `/:\n[^\s]/m` (colon then non-indented) as indent-missing rule instead:
```js
{re:/:\n[^\s#]/m,msg:'After a line ending with :, indent the next line by 4 spaces (Tab).'},
```
Pick the `:\n` version (less noisy). Add both quote + colon rules.

In `app/preview.js:67`:
```js
// BEFORE: kh.hidden = !/on_key\s*\(|on_click\s*\(/.test(code);
// + keyhint text in learn.html/play.html is static 'click the stage, then play'
// AFTER JS: keep regex, but set text:
if(kh){ kh.hidden = !/on_key\s*\(|on_click\s*\(/.test(code); kh.textContent = /on_key\s*\(/.test(code) ? 'click the stage first, then press space' : 'click the tomato in the stage'; }
```
In `app/console.js:9-15` `ask()`: after `i.value=''` add `i.placeholder='type answer + Send (Enter works too)'` (one line, no CSS change).
In `learn.html` arrow handler: no logic change (already guards TEXTAREA/INPUT/IFRAME); add one-line comment `// Arrow keys skip lessons — disabled while typing` if missing; ensure `Escape` closes map (already does). If handler already correct, no edit needed beyond comment — report as no-op.

- [ ] **Step 4: Verify**

Run: `node check-assist.js`
Expected: `has indent rule: true`, `keyhint clear: true`.

Open `tests/test-assistant.html` — must still show `assistant OK` for colon case, plus new: set editor to `if x:\nprint(1)` should hint indent (manual browser check or jsdom-less node regex test):
```js
node -e "const s=require('fs').readFileSync('app/assistant.js','utf8'); console.log(/After a line ending with/.test(s)?'indent-msg OK':'FAIL')"
```

- [ ] **Step 5: Report diff**

`git diff -U5 app/assistant.js app/preview.js app/console.js learn.html`

---

## Self-Review

- Spec coverage: L4 scaffold (T1), L11 placeholder (T1), L10 split (T2), L14 alignment (T2), L13 Sends (T3), L19 payoff (T3), indent/quote assistant + input placeholder + keyhint (T4). All 6 report findings mapped.
- Placeholder scan: no TBD/TODO in plan steps; every step has exact code + exact `node` command + expected output.
- Type consistency: starters remain Python strings, `must`/`expected`/`answers` unchanged except L4 hint/prompt copy; assistant rules are `{re,msg}`; preview keyhint is string assignment. No new APIs.
