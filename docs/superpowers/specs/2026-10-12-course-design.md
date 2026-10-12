# tiny-py Course Spec — 2026-10-12 (JetBrains-style interactive course)

## Decisions (user-approved)
- Checking: BOTH, output first — console-output match for print tasks,
  code-contains + runs-clean for visual game tasks.
- Player lives in the existing `#lessons` panel (no new page).
- 14-lesson arc: print → platformer capstone.

## Data model (app/course-data.js: LESSONS array)
Each lesson: `{id, title, theory, example, trace, starter, task}`.
- `theory`: 1–2 sentences.
- `example`: 2–6 lines of Python. `trace`: `[{lines:[n], note, out}]` —
  author-scripted steps; player highlights those lines, types `out`
  into a mini console, shows `note`. No engine changes.
- `starter`: code loaded into the editor for the task.
- `task`: `{prompt, expected?, answers?, must?, hint}`.
  `expected` = exact console transcript (normalized trailing whitespace).
  `answers` = canned inputs for the checker run. `must` = required
  substrings (the code-match half). `hint` shown on fail.

## Player (app/lessons.js rewrite: window.Course)
Renders into `#lessons`: nav (Prev/Next + progress) → theory → example
+ Play-trace → mini console + note → task card with live status.
`Course.afterRun()` runs silently after every preview render: executes
editor code via the parent engine mirror with canned answers, applies
checkTask, updates status. Pass → progress saved
(`localStorage tiny-py-course`), squares-burst, Next pulses.
Fail → hint text, never blocks.

## Checker (pure, testable in node)
1. run(code, answers) → needInput? fail('program asked for input').
2. error? fail('Error: ...').
3. expected set? compare normalized output → fail shows got vs need + hint.
4. must[] substrings present? else fail naming the missing piece + hint.
5. Else pass.

## The 14 lessons
1 print-hello · 2 print-math (output `123`) · 3 variables · 4 input ·
5 if/else · 6 for · 7 while · 8 lists · 9 functions · 10 first Entity
(visual) · 11 clicker+score (visual) · 12 guess game (canned answer) ·
13 tic-tac-toe 2-player (scripted X-wins transcript match) ·
14 platformer capstone (starter gaps: `gravity = 2`, jump `vy = -12`;
ground + land pre-written; code check + clean run).

## Non-goals
No new builtins (arc fits current engine), no engine changes,
no separate course page, no video/audio.

## Iteration notes
- Traces autoplay on lesson open (reduced-motion renders final state).
- Output types itself char-by-char; Play replays.
- Branching lessons carry `variants` (e.g. age 15/10, right/wrong guess);
  variant tabs swap demo code + trace, task unchanged.
- Big lessons carry `steps` (platformer: Fall/Hop/Treasure): each step has
  its own starter + task, passes advance automatically, `done` saves only
  on the final step. Stepless lessons behave as one silent step.
- Games are playable: preview shows "click the stage, then play" whenever
  code uses on_key/on_click; lesson arrow-keys ignore focus inside the
  preview iframe so playing never flips the lesson.
- Demo trace steps can carry `awaitClick`: the player pauses, the spawn
  pulses, and the trace continues only when the learner clicks the demo
  box — the click types its output (clicker: Score: 1, Score: 2).

## Self-review
- No TBDs. Every lesson maps to engine subset (verified while authoring
  by running each expected transcript through TinyPy.run).
- IDs contract untouched (`#lessons`, editor/preview/console IDs).
- Old chips UI replaced, not duplicated. `tiny-py-done` key retired.
