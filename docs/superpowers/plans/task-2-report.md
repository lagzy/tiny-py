# Task 2 Report — L10 stage-vs-console + L14 example alignment

## Status: DONE (no commit)

## Scope
- ONLY `app/course-data.js` L10 (`id:'entity'`) theory/prompt/hint + L14 (`id:'platformer'`) theory/example/trace-note/steps prompts.
- Preserved Task 1 edits (L4 starter + L11 starter/hint still present in diff).
- Did NOT change `must`/`expected`/`answers`/starter code, engine, or commit.

## TDD (test-driven-development skill)
- RED: created throwaway `check-copy.js`, ran `node check-copy.js` → `false` / `false` (NEEDS FIX).
- Note: plan's literal L14 regex `/gravity/` returns `true` even BEFORE the fix (old example already contains `vy/gravity`), so the RED check used the AFTER-specific string `/speed grows by gravity each frame/` to prove the new copy was missing. Verified plan-literal version gave `false`/`true` before editing.
- GREEN: minimal verbatim copy edits, re-ran `node check-copy.js` → `true` / `true`.
- Entity run: `node check-entity.js` (runs `TinyPy.run('from tiny import *\nplayer = Entity(color="blue", x=100, y=100)')`) → `OK` (no error, no needInput).
- Throwaway scripts deleted after verification (do not commit).

## Edits (verbatim from plan)
L10:
- theory → `Entity() puts a square on the stage (right, PREVIEW). print() goes to the console (right, below). color= x= y= describe the square.`
- prompt → `Blue square at 100, 100 in the PREVIEW (print goes to CONSOLE — this lesson uses the stage)`
- hint → `Match the example: blue, 100, 100. Run and look right: blue square = PREVIEW, words = CONSOLE.`
L14:
- theory → `Games fake physics: each frame, gravity grows downward speed. Jump sets it negative. Three steps: fall, hop, treasure. After Run, click the stage once, then press space to play.`
- example → `vy = 0\ngravity = 2\nvy = vy + gravity  # speed grows by gravity each frame`
- trace note (lines [3]) → `Speed grows by gravity (2). In the game below this runs every frame.` (out stays `2`)
- Fall prompt append → ` (Look in PREVIEW: blue drops onto green.)`
- Hop prompt append → ` (Click the stage first so space reaches the game.)`
- Treasure prompt append → ` (Click the stage, hop with space into the gold.)`

## Verification
- `node check-copy.js` → `L10 mentions console-vs-stage: true`, `L14 example mentions gravity: true`
- `TinyPy Entity run` → `OK`
- `git diff -U5 app/course-data.js` shows only L10/L14 copy lines + pre-existing Task 1 L4/L11 lines; no `must`/starter/expected changes in L10/L14.
