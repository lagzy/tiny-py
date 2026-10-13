# Ursina Animation & Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Ursina-style animation & movement (`animate_x/y/scale`, `lerp`, `destroy`, `invoke`, `time.dt`) to the offline engine plus course lessons 21–22, all verified by harnesses + browser.

**Architecture:** Tween list + invoke queue live in the `tinypy.js` prelude and advance via a new `__frame(dt)` closure returned from `run()`; the preview runner calls it with real wall-clock dt each rAF, node harnesses call it with fixed virtual dt for deterministic traces.

**Tech Stack:** Vanilla JS (no deps), node harnesses in `C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\`, Playwright browser proof via `http://127.0.0.1:8123` (dev server `python -m http.server 8123` from repo root; `file://` cannot be used).

## Global Constraints

- Static only: no backend, no CDN, no build step; engine reaches the sandboxed preview iframe only via `TinyPy.bundle()` inlined into `srcdoc` (`app/preview.js`).
- Entities must work headless (node has no `document`): numeric x/y state, never crash when `__stage()` is `null`.
- Lesson tasks follow the lesson-10 pattern: `must[]` substring checks, no `expected` output needed for stage-only code; every lesson's `starter` MUST fail its own task.
- IDs/design contract untouched (`design.md`): no new element IDs, paper `#f7f3ea` / accent `#d9481f` theme only if UI changes (none planned).
- TDD: failing harness first, then minimal implementation, then green; commit per task.
- Browser proof must prime the cache first (`fetch(f,{cache:'reload'})` for touched files) — the MCP browser caches JS aggressively.

**Repo root:** `C:\Users\Vladyslav.Khomenko\OneDrive - schuleroot\Desktop\tiny-html`

---

### Task 1: Numeric entity state + `lerp`

**Files:**
- Modify: `app/tinypy.js` lines 229–250 (prelude: `__mk`, `__ent`, factories)
- Create: `C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js` (skeleton, grows in Tasks 2–4)

**Interfaces:**
- Consumes: existing `__num(v, d)`, `__stage()`, `__mk(color, x, y, size, round)`.
- Produces: `__ent(d, ix, iy)` with numeric `x/y` (headless-safe), global `lerp(a,b,t)`, `math.lerp`.

- [ ] **Step 1: Write the failing test** — create `verify-anim.js`:

```js
// verify-anim.js — animation & movement checks (headless, virtual time).
global.window = {};
const fs = require('fs');
const base = 'C:/Users/Vladyslav.Khomenko/OneDrive - schuleroot/Desktop/tiny-html';
eval(fs.readFileSync(base + '/app/tinypy.js', 'utf8'));
let fails = 0;
function check(n, c, extra) { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' -> ' + extra)); if (!c) fails++; }
let r = TinyPy.run('print(lerp(0, 100, 0.5))\nprint(lerp(0, 100, 0.25))\n');
check('lerp halfway', r.output === '50\n25', JSON.stringify(r.output));
r = TinyPy.run('import math\nprint(math.lerp(10, 20, 0.5))\n');
check('math.lerp', r.output === '15', JSON.stringify(r.output));
r = TinyPy.run('b = box("red", 0, 0)\nprint(b.x)\nb.x = 30\nprint(b.x)\n');
check('headless numeric x', r.output === '0\n30', JSON.stringify(r.output));
console.log(fails === 0 ? 'ALL ANIM CHECKS PASS' : 'FAILURES: ' + fails);
process.exit(fails ? 1 : 0);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js"`
Expected: FAIL `lerp halfway` (-> `lerp is not available...`), FAIL `math.lerp`, FAIL `headless numeric x` (-> `0\n0`).

- [ ] **Step 3: Write minimal implementation** — in `app/tinypy.js` prelude, after the `__num` line add:

```js
'function lerp(a, b, t){ a = Number(a); b = Number(b); t = Number(t); return a + (b - a) * t; }',
```

Replace the `__ent` line (line 235–238) with numeric-state version:

```js
'function __ent(d, ix, iy){ var sx = __num(ix, 0), sy = __num(iy, 0);',
'  function place(){ if(d){ d.style.left = sx + "px"; d.style.top = sy + "px"; } }',
'  place();',
'  var e = { el: d, dead: false, rot: 0, sc: 1,',
'    get x(){ return sx; }, set x(v){ sx = __num(v, sx); place(); },',
'    get y(){ return sy; }, set y(v){ sy = __num(v, sy); place(); },',
'    set color(v){ if(d) d.style.background = v; },',
'    __sync: function(){ if(d && !e.dead) d.style.transform = "rotate(" + e.rot + "deg) scale(" + e.sc + ")"; } };',
'  return e; }',
```

Pass positions through in every factory (`Entity`, `box`, `circle`, `player`, `coin`, `image`), e.g.:

```js
'function box(c, x, y){ x = __num(x, 50); y = __num(y, 50); return __ent(__mk(c || "red", x, y, 40, false), x, y); }',
'function circle(c, x, y){ x = __num(x, 50); y = __num(y, 50); return __ent(__mk(c || "gold", x, y, 30, true), x, y); }',
'function player(){ return __ent(__mk("blue", 100, 100, 40, false), 100, 100); }',
'function coin(x, y){ x = __num(x, 200); y = __num(y, 80); return __ent(__mk("gold", x, y, 24, true), x, y); }',
```

`Entity`: `return __ent(__mk(..., __num(o.x, 60), __num(o.y, 60), ...), __num(o.x, 60), __num(o.y, 60));`
`image`: pass `__num(x, 60), __num(y, 60)`.

In the `math` object add (after the `hypot` line):

```js
'  lerp: function(a, b, t){ return lerp(a, b, t); },',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js"`
Expected: 3 PASS, `ALL ANIM CHECKS PASS`.

- [ ] **Step 5: Regression check**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-tiny.js"` and `verify-stage.js` — expect 0 FAIL (entity behavior in DOM unchanged: numbers are source of truth, DOM synced).

- [ ] **Step 6: Commit**

```bash
git add app/tinypy.js
git commit -m "feat: numeric entity state + lerp/math.lerp"
```

---

### Task 2: Tween engine (`animate_x/y/scale` + `__frame`)

**Files:**
- Modify: `app/tinypy.js` (prelude: add `__tweens`, `__tween`, `__stepTween`, `__frame`; add `animate_*` methods to `__ent`; `run()` returns `frame`)
- Modify: `C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js` (append tests)

**Interfaces:**
- Consumes: Task 1 `__ent` with `__sync`, numeric `x/y`, `sc`/`rot` props.
- Produces: `__frame(dt)` closure (via `run()` return field `frame`), entity methods `animate_x(t,s)`, `animate_y(t,s)`, `animate_scale(t,s)`.

- [ ] **Step 1: Write the failing tests** — append before the final `console.log`/`process.exit` lines of `verify-anim.js`:

```js
r = TinyPy.run('b = box("red", 0, 0)\nb.animate_x(100, 2)\n\ndef update():\n    print(b.x)\n');
r.frame(1.0); r.update();
check('tween halfway', window.__pyout.join('\n') === '50', JSON.stringify(window.__pyout));
r.frame(1.0); r.update();
check('tween arrived', window.__pyout.join('\n') === '50\n100', JSON.stringify(window.__pyout));
r = TinyPy.run('b = box("red", 0, 0)\nb.animate_x(100, 2)\nb.animate_x(0, 2)\n\ndef update():\n    print(b.x)\n');
r.frame(2.0); r.update();
check('latest tween wins', window.__pyout.join('\n') === '0', JSON.stringify(window.__pyout));
r = TinyPy.run('b = box("red", 1, 2)\nb.animate_scale(3, 1)\n');
r.frame(1.0);
check('scale tween runs', r.error === '', JSON.stringify(r.error));
```

NOTE: `window.__pyout` accumulates across runs in one process (`__emit` pushes, `run()` resets `window.__pyout = []` at start) — each `TinyPy.run` resets it, so per-test reads are isolated. `r.update` is the user's `update` function; calling it directly appends via `print` -> `__emit` -> `window.__pyout`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js"`
Expected: `TypeError: r.frame is not a function` (crash) or FAILs on the new checks. Task-1 checks still PASS.

- [ ] **Step 3: Write minimal implementation** — prelude additions (place right after the `lerp` line from Task 1):

```js
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
```

Add methods to the `__ent` literal (after `set color...` line, before `__sync`):

```js
'    animate_x: function(t, s){ __tween(e, "x", t, s); },',
'    animate_y: function(t, s){ __tween(e, "y", t, s); },',
'    animate_scale: function(t, s){ __tween(e, "sc", t, s); },',
```

Expose the frame stepper from `run()`: change the `new Function` template tail to

```js
js + '\n;return {updateFn: (typeof update === "function") ? update : null, frameFn: (typeof __frame === "function") ? __frame : null, out: __out.join("\\n")};'
```

and the return to

```js
return {output: res.out, error: '', update: res.updateFn, frame: res.frameFn};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js"`
Expected: all PASS (3 old + 4 new), `ALL ANIM CHECKS PASS`.

- [ ] **Step 5: Regression check** — run `verify-tiny.js`, `verify-stage.js`, `verify-course-full.js`, `verify-learn-play.js`: 0 FAIL (additive change; `run()` gains a field, nothing removed).

- [ ] **Step 6: Commit**

```bash
git add app/tinypy.js
git commit -m "feat: tween engine animate_x/y/scale + __frame(dt)"
```

---

### Task 3: `destroy`, `invoke`, `time.dt`

**Files:**
- Modify: `app/tinypy.js` (prelude: two functions; `time` object already added in Task 2)
- Modify: `C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js` (append tests)

**Interfaces:**
- Consumes: Task 2 `__tweens`, `__delayed`, `__frame`, `time`, entity `dead` flag.
- Produces: globals `destroy(entity)`, `invoke(func, delay)`; `time.dt` set by every `__frame`.

- [ ] **Step 1: Write the failing tests** — append before final summary lines:

```js
r = TinyPy.run('b = box("red", 0, 0)\nb.animate_x(100, 2)\ndestroy(b)\n\ndef update():\n    print(b.x)\n');
r.frame(2.0); r.update();
check('destroy drops tween', window.__pyout.join('\n') === '0', JSON.stringify(window.__pyout));
r = TinyPy.run('def wave():\n    print("hi")\ninvoke(wave, 1)\n');
r.frame(0.5);
check('invoke waits', (window.__pyout || []).join('\n') === '', JSON.stringify(window.__pyout));
r.frame(0.5);
check('invoke fires', (window.__pyout || []).join('\n') === 'hi', JSON.stringify(window.__pyout));
r = TinyPy.run('def update():\n    print(time.dt)\n');
r.frame(0.25); r.update();
check('time.dt', window.__pyout.join('\n') === '0.25', JSON.stringify(window.__pyout));
r = TinyPy.run('print(lerp(0, 10, 0.5))\n');
const r2 = TinyPy.run('print(lerp(0, 10, 0.5))\n');
check('deterministic replay', r.output === r2.output && r.output === '5', r.output + ' vs ' + r2.output);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js"`
Expected: FAIL on the 5 new checks (`destroy is not available...`, `invoke is not available...`, `time is not available...`).

- [ ] **Step 3: Write minimal implementation** — prelude, after `__frame`:

```js
'function destroy(e){ if(!e) return;',
'  e.dead = true;',
'  for(var i = __tweens.length - 1; i >= 0; i--){ if(__tweens[i].e === e) __tweens.splice(i, 1); }',
'  try{ if(e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el); }catch(x){} }',
'function invoke(fn, delay){ if(typeof fn !== "function") throw new Error("invoke needs a function, e.g. invoke(wave, 1).");',
'  __delayed.push({fn: fn, t: Number(delay) || 0}); }',
```

(`time = {dt: 0}` and `time.dt = dt` in `__frame` already exist from Task 2 — no change needed.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js"`
Expected: all PASS, `ALL ANIM CHECKS PASS`.

- [ ] **Step 5: Commit**

```bash
git add app/tinypy.js
git commit -m "feat: destroy + invoke + time.dt"
```

---

### Task 4: Friendly 3D errors + namespace + autocomplete

**Files:**
- Modify: `app/tinypy.js` (`friendly()` + `ursina` namespace line)
- Modify: `app/complete.js` (WORDS line 8, MEMBERS lines 14–15)
- Modify: `C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js` (append error tests)

**Interfaces:**
- Consumes: Task 1–3 globals (`lerp`, `destroy`, `invoke`, `time`).
- Produces: `ursina.lerp/destroy/invoke/time`; `friendly()` 3D guidance; autocomplete entries.

- [ ] **Step 1: Write the failing tests** — append before final summary lines:

```js
r = TinyPy.run('camera.follow(player)\n');
check('camera error guides', /not in tiny-py yet/.test(r.error || ''), JSON.stringify(r.error));
r = TinyPy.run('from ursina import lerp\nprint(lerp(0, 4, 0.5))\n');
check('ursina.lerp import', r.output === '2', JSON.stringify(r.output));
r = TinyPy.run('import ursina\nprint(ursina.time.dt)\n');
check('ursina.time reachable', r.output === '0', JSON.stringify(r.output));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js"`
Expected: FAIL `camera error guides` (generic "not available" message), FAIL `ursina.lerp import` (`undefined` -> `var lerp = ursina.lerp` is undefined -> print crashes? Actually `from ursina import lerp` binds `var lerp = ursina.lerp;` = undefined, then `lerp(...)` throws "lerp is not a function" — still FAIL, good).

- [ ] **Step 3: Write minimal implementation**

In `friendly()` (after `var msg = ...`, before the generic `undef` check):

```js
  var no3d = msg.match(/^([^ ]+) is not defined$/);
  if(no3d && {camera: 1, Vec3: 1, Vec2: 1, Audio: 1, Shader: 1, Mesh: 1}[no3d[1]])
    return "'" + no3d[1] + "' is real Ursina but needs 3D/sound — not in tiny-py yet (offline 2D subset: animate_x, lerp, destroy, invoke + game API).";
```

Extend the `ursina` namespace line:

```js
'var ursina = {Entity: Entity, box: box, circle: circle, player: player, coin: coin, text: text, score: score, on_click: on_click, on_key: on_key, say: say, clear: clear, bg: bg, color: color, lerp: lerp, destroy: destroy, invoke: invoke, time: time};',
```

(`tiny = ursina` follows automatically.)

In `app/complete.js`: WORDS game-API line becomes

```js
'Entity box circle player coin image text score on_click on_key say clear bg color update lerp destroy invoke time animate_x animate_y animate_scale '+
```

MEMBERS `ursina`/`tiny` lines become

```js
ursina:'Entity box circle player coin image text score on_click on_key say clear bg color update lerp destroy invoke time'.split(' '),
tiny:'Entity box circle player coin image text score on_click on_key say clear bg color update lerp destroy invoke time'.split(' '),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-anim.js"` (all PASS) and `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-complete.js"` (still green).

- [ ] **Step 5: Commit**

```bash
git add app/tinypy.js app/complete.js
git commit -m "feat: 3D guidance errors + ursina namespace + autocomplete"
```

---

### Task 5: Real-time dt in the preview runner

**Files:**
- Modify: `app/preview.js` (`runnerSrc`: `startLoop` signature + call site)

**Interfaces:**
- Consumes: Task 2 `run()` field `frame`.
- Produces: every animation frame calls `frame(dt)` with clamped wall-clock dt before `update()`.

- [ ] **Step 1: Make the change** — replace the `startLoop` block in `runnerSrc()`:

```js
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
```

And the call site: `if(r.update)startLoop(r.update,r.frame||null,my);`

Rationale (no node test possible — rAF lives in the iframe): `dt` defaults to 0.05 on the first frame, clamps tab-switch gaps to 0.25s, and `fr` is null-safe for old bundles.

- [ ] **Step 2: Syntax check**

Run: `node --check "C:\Users\Vladyslav.Khomenko\OneDrive - schuleroot\Desktop\tiny-html\app\preview.js"`
Expected: exit 0, no output. (Note: PowerShell prints `True` for `--check` success via this toolchain — exit code 0 is the signal.)

- [ ] **Step 3: Browser proof** — serve repo root on 8123 if needed; in Playwright: goto `http://127.0.0.1:8123/play.html`, cache-bust `play.html` + `app/tinypy.js` + `app/preview.js` via `fetch(f,{cache:'reload'})`, reload, set editor to `from tiny import *\nb = box("tomato", 20, 100)\nb.animate_x(200, 1)\n`, click Run, wait 1500ms, read `#preview` iframe `#stage div` `style.left` — expect `>=150px` (glide in progress/done). Console: no pageerrors.

- [ ] **Step 4: Commit**

```bash
git add app/preview.js
git commit -m "feat: preview runner drives tweens with wall-clock dt"
```

---

### Task 6: Lessons 21–22 (Smooth moves + Chase)

**Files:**
- Modify: `app/course-data.js` (append two lessons after the `images` entry)
- Modify: `C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-course-full.js` (add `smooth` + `chase` solutions)

**Interfaces:**
- Consumes: Tasks 1–4 engine API; lesson shape `{id,title,theory,example,trace,starter,steps:[{starter,task}],task}` (see platformer entry, lines 128–149 of `course-data.js`).
- Produces: `LESSONS` length 22; solutions that pass `checkTask`, starters that fail.

- [ ] **Step 1: Write the failing solutions first** — append to the `solved` object in `verify-course-full.js`:

```js
solved.smooth = L.find(l => l.id === 'smooth').steps[2].starter.replace('# TODO: make it smooth: b.x = b.x + 60 * time.dt',
  'b.x = b.x + 60 * time.dt');
solved.chase = L.find(l => l.id === 'chase').steps[2].starter + '\ninvoke(wave, 1)\n';
```

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-course-full.js"`
Expected: crash (`Cannot read properties of undefined` on `.steps`) — lessons don't exist yet.

- [ ] **Step 2: Add the lessons** — append after the images lesson entry in `app/course-data.js`:

```js
,{id:'smooth',title:'21 Smooth moves',
theory:'Choppy motion teleports. Smooth motion glides: animate_x moves over seconds, lerp blends between numbers, time.dt keeps speed steady on any screen.',
example:'from tiny import *\nprint(lerp(0, 100, 0.5))\nprint(lerp(0, 100, 0.25))',
trace:[{lines:[1],note:'lerp blends: first import the game side.'},{lines:[2],note:'Halfway between 0 and 100.',out:'50'},{lines:[3],note:'A quarter of the way.',out:'50\n25'}],
starter:'from tiny import *\nb = box("tomato", 20, 100)\n# TODO: glide b to x=200 over 2 seconds: b.animate_x(200, 2)',
steps:[
{starter:'from tiny import *\nb = box("tomato", 20, 100)\n# TODO: glide b to x=200 over 2 seconds: b.animate_x(200, 2)',
task:{prompt:'Add b.animate_x(200, 2) on its own line. Run and watch the tomato glide in PREVIEW.',must:['box(','animate_x(200, 2)'],hint:'Copy the TODO line without the #.'}},
{starter:'from tiny import *\nb = box("tomato", 20, 100)\nb.animate_x(200, 2)\n# TODO: grow b to double size over 1 second: b.animate_scale(2, 1)',
task:{prompt:'Add b.animate_scale(2, 1). Run and watch it glide AND grow.',must:['animate_x(200, 2)','animate_scale(2, 1)'],hint:'Same pattern as the glide, one new line.'}},
{starter:'from tiny import *\nb = box("tomato", 20, 100)\nb.animate_x(200, 2)\nb.animate_scale(2, 1)\n\ndef update():\n    b.x = b.x + 60\n# TODO: make it smooth: b.x = b.x + 60 * time.dt',
task:{prompt:'Multiply by time.dt so speed is per-second, not per-frame. Run and watch steady drift.',must:['def update','time.dt'],hint:'Change the last line to b.x = b.x + 60 * time.dt'}}],
task:{prompt:'Three steps: glide with animate_x, grow with animate_scale, steady drift with time.dt. Follow the steps — each one checks itself.',must:['animate_x(200, 2)','animate_scale(2, 1)','time.dt'],hint:'Do the three steps in order.'}}
```

```js
,{id:'chase',title:'22 Chase',
theory:'A chase is three tricks: follow smoothly with lerp, catch with destroy + score, encore with invoke. The coin never teleports — it hurries.',
example:'from tiny import *\nc = coin(200, 80)\nprint(c.x)\ndestroy(c)\nprint("gone")',
trace:[{lines:[1,2],note:'A coin appears.',spawn:{color:'gold',x:60,y:40}},{lines:[3],note:'Coins remember their x.',out:'200'},{lines:[4,5],note:'destroy removes it from the stage.',out:'200\ngone'}],
starter:'from tiny import *\np = player()\nc = coin(200, 80)\n\ndef update():\n    c.x = p.x\n# TODO: follow smoothly: c.x = lerp(c.x, p.x, 0.05)',
steps:[
{starter:'from tiny import *\np = player()\nc = coin(200, 80)\n\ndef update():\n    c.x = p.x\n# TODO: follow smoothly: c.x = lerp(c.x, p.x, 0.05)',
task:{prompt:'Replace the teleport with c.x = lerp(c.x, p.x, 0.05). Run: the coin now hurries instead of jumping.',must:['def update','lerp(c.x, p.x, 0.05)'],hint:'Swap the c.x = p.x line for the lerp line.'}},
{starter:'from tiny import *\np = player()\nc = coin(200, 80)\n\ndef update():\n    c.x = lerp(c.x, p.x, 0.05)\n# TODO: catch it — inside update add score() and destroy(c)',
task:{prompt:'After the lerp line, add score() and destroy(c) (indented, inside update). Run: caught on the first frame.',must:['lerp(c.x, p.x, 0.05)','score()','destroy(c)'],hint:'Two new lines at the end, each starting with 4 spaces.'}},
{starter:'from tiny import *\np = player()\nc = coin(200, 80)\n\ndef update():\n    c.x = lerp(c.x, p.x, 0.05)\n    score()\n    destroy(c)\n\ndef wave():\n    score()\n# TODO: encore after 1 second: invoke(wave, 1)',
task:{prompt:'Add invoke(wave, 1) at the end. Run: one more point lands a second later.',must:['destroy(c)','def wave','invoke(wave, 1)'],hint:'Last line: invoke(wave, 1)'}}],
task:{prompt:'Three steps: hurry with lerp, catch with destroy, encore with invoke. Follow the steps — each one checks itself.',must:['lerp(c.x, p.x, 0.05)','destroy(c)','invoke(wave, 1)'],hint:'Do the three steps in order.'}}
```

Wait — chase step-2 starter already contains `score()` + `destroy(c)` indented inside update, so its own task passes trivially? The step task checks the CURRENT editor content: when the learner opens step 2, the starter already satisfies `must` → step auto-passes without doing the TODO. Check the platformer pattern: step starters are cumulative (each contains previous solutions) — e.g. Hop starter contains `gravity = 2` (Fall's answer) and its task only checks the NEW part (`vy = -12` inside jump... starter has `vy = 0`). So each step starter must LACK its own new must-items: chase step-2 starter above contains score()/destroy(c) but its task must is `['destroy(c)','def wave','invoke(wave, 1)']` — starter lacks `invoke(wave, 1)` ✓ fails until TODO done. Step-1 task must `['lerp...','score()','destroy(c)']` — starter has lerp but lacks score()/destroy(c) ✓. Step-0 must `['def update','lerp(c.x, p.x, 0.05)']` — starter has update, lacks lerp ✓. Top-level chase starter (lesson starter) = step-0 starter: lacks lerp ✓ fails. Smooth: step-1 task must includes animate_x (present in starter!) + animate_scale (missing ✓ fails overall — checkTask requires ALL must? Platformer Fall task must... lesson 10 entity task must has 4 items all present only in solution. checkTask presumably requires every must substring — one missing = fail ✓). Smooth step-1 starter contains `animate_x(200, 2)` but task also needs `animate_scale(2, 1)` → fails ✓ good. Top smooth starter lacks animate_x ✓.

Chase step-2 solved = starter + `\ninvoke(wave, 1)\n` → top must `['lerp(c.x, p.x, 0.05)','destroy(c)','invoke(wave, 1)']` all present ✓. NOTE: solved chase RUNS `destroy(c)` at top level of... no — destroy(c) is INSIDE update (indented), never runs in node. Top-level runs: player(), coin(), def update, def wave, invoke(wave,1) → no output, no error ✓ (invoke just queues).

Smooth solved: step-2 starter with `b.x = b.x + 60` replaced by `b.x = b.x + 60 * time.dt` — top must `['animate_x(200, 2)','animate_scale(2, 1)','time.dt']` ✓. Runs: box(), animate calls (headless fine), def update — no output ✓.

- [ ] **Step 3: Run to verify green**

Run: `node "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode\verify-course-full.js"`
Expected: `solved passes: smooth`, `starter fails: smooth`, `solved passes: chase`, `starter fails: chase`, `ALL LESSONS PLAYABLE`.

- [ ] **Step 4: Commit**

```bash
git add app/course-data.js
git commit -m "feat: lessons 21-22 smooth moves + chase"
```

---

### Task 7: Counts, full suite, browser proof, ship

**Files:**
- Modify: `index.html` (line 17 lede, line 20 Learn door), `tests/test-lessons.html` (count assertion + message)

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: all-green suites, in-browser proof, pushed commit(s).

- [ ] **Step 1: Update counts** — `index.html` line 17: `20-lesson course` → `22-lesson course`; line 20: `20 guided lessons` → `22 guided lessons`. `tests/test-lessons.html`: `window.LESSONS.length === 20` → `=== 22`, `course OK (20 lessons)` → `course OK (22 lessons)`. Then sweep for strays:

Run: `grep -rn "20-lesson\|20 lessons\|20 guided" index.html tests/ app/ README.md`
Expected: no hits (except historical spec docs under `docs/`, which stay as records).

- [ ] **Step 2: Full suite re-run** — run all 15 harnesses (`verify-tiny`, `verify-course-full`, `verify-learn-play`, `verify-stage`, `verify-files`, `verify-notice`, `verify-imports`, `verify-assets`, `verify-physics`, `verify-complete`, `verify-anim`, `verify-undo`, `verify-max`, `verify-focus`, `verify-audit`):

Run: `$t = "C:\Users\Vladyslav.Khomenko\AppData\Local\Temp\opencode"; foreach ($f in @("verify-tiny.js","verify-course-full.js","verify-learn-play.js","verify-stage.js","verify-files.js","verify-notice.js","verify-imports.js","verify-assets.js","verify-physics.js","verify-complete.js","verify-anim.js","verify-undo.js","verify-max.js","verify-focus.js","verify-audit.js")) { $o = node "$t\$f" 2>&1 | Out-String; $fails = ([regex]::Matches($o, "FAIL")).Count; $pass = ([regex]::Matches($o, "PASS")).Count; Write-Output "$f pass=$pass fail=$fails" }`
Expected: every line `fail=0` (anim ≥ 15 pass, course-full 42 pass).

- [ ] **Step 3: Browser proof** — `http://127.0.0.1:8123/learn.html` (prime `learn.html` + `app/course-data.js` + `app/tinypy.js` with cache-bust, clear localStorage, reload): open Map → 21 items... expect **22** `.lmap-item`s; click item 21 → title contains `Smooth`; paste step-0 solution (`b.animate_x(200, 2)` line) → check passes; next step → `animate_scale` line → passes. `play.html`: run `camera.follow(player)` → console shows the `not in tiny-py yet` guidance. Zero pageerrors throughout.

- [ ] **Step 4: Commit + push**

```bash
git add index.html tests/test-lessons.html
git commit -m "chore: course is now 22 lessons"
git push origin main
```

Report the final tally (per-harness pass/fail) and the pushed commit hashes.
