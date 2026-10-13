# Task 5 Report — Images lesson (20 Pictures)

## Scope
- ONLY `app/course-data.js` (append images lesson), `tests/test-lessons.html` (19→20), `index.html` lede (19-lesson→20-lesson).
- Did NOT touch engine, other lessons, Learn door copy, did NOT commit.

## TDD
1. Throwaway RED `red-images.js`: `LESSONS.length=19 hasImages=false` → NEEDS FIX confirmed (exit 2).
2. Minimal edits per spec verbatim, then GREEN.

## Changes
- `app/course-data.js` — appended after tkinter entry (spec verbatim):
  - `{id:'images',title:'20 Pictures', ... task must:['image(','"cat"','100'] ...}`
- `tests/test-lessons.html` — `=== 19` → `=== 20`, `19 lessons` → `20 lessons`.
- `index.html:17` — lede `19-lesson course` → `20-lesson course` (Learn door `19 guided lessons` untouched per scope).

## Verification
- `node red-images.js` → `LESSONS.length=20 hasImages=true` FIXED.
- `node verify-images.js` → ALL GREEN:
  - solved `from tiny import *\nimage("cat", 100, 100)` via `TinyPy.run`: output "", error "", needInput null → no error, no needInput.
  - `Course.checkTask(solved)` → pass:true.
  - `Course.checkTask(starter)` → pass:false (`Error: Unexpected token ','` — placeholder `...` is not valid code, so it fails before must; still correctly rejected).
  - `LESSONS.length === 20`.
- `node --check app/course-data.js` → clean (exit 0).
- `git diff` inspected for the 3 files; working tree has pre-existing unrelated diffs (Tasks 1–4); no commit made.

## Status
Done — no commit.
