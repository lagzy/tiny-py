# Lesson 20 Pictures — Design Spec (approved 2026-10-13)

**Goal:** Add a beginner-safe, string-checked course lesson teaching `image("name", x, y)`.

**Background:** `image()` draws an uploaded library picture on the stage (`app/images.js` + `app/tinypy.js` prelude). `learn.html` has no upload panel and does not load `images.js`, so `image()` there renders nothing. The lesson therefore checks code text (`must`), not stage pixels — same pattern as lessons 10, 14, 19.

**Lesson data** (append at end of `window.LESSONS` in `app/course-data.js`, after `tkinter` entry):

```js
{id:'images',title:'20 Pictures',
theory:'image() puts one of your uploaded pictures on the stage. Pictures are uploaded in the Playground IMAGES panel; here is a code demo — the check reads your code and the marker shows where it lands.',
example:'from tiny import *\nimage("cat", 100, 100)',
trace:[{lines:[2],note:'The picture called cat appears at 100, 100.',out:'',spawn:{color:'gold',x:60,y:40}}],
starter:'from tiny import *\nimage(..., 100, 100)  # <-- replace ... with "cat", press Run',
task:{prompt:'Show the picture called cat at 100, 100. Replace ... with "cat" and press Run.',must:['image(','"cat"','100'],hint:'The line should read image("cat", 100, 100) — quotes around cat.'}},
```

**Count updates (19 → 20):**
- `tests/test-lessons.html`: `LESSONS.length === 19` → `=== 20`, message `19 lessons` → `20 lessons`.
- `index.html` lede: `19-lesson course` → `20-lesson course`.

**Out of scope:** upload panel in `learn.html`, `qa-lessons.md` (already stale at 10), engine changes, commits.

**Acceptance:** solved code `image("cat", 100, 100)` runs via `TinyPy.run` with no error and no `needInput`; placeholder starter fails the `must` check; `LESSONS.length === 20`; `node --check` clean on touched files.
