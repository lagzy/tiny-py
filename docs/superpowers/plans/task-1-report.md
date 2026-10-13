# Task 1 Report — Scaffold L4 Ask + L11 Clicks starters

status: DONE

## Exact edits (app/course-data.js only, 4 lines)

L4 (id 'input'):
- BEFORE `starter:'print("hi")',`
- AFTER `starter:'name = input("Name? ")\nprint("...")',`
- BEFORE `task:{prompt:'Ask the name with input() and print it, then Run and type Ada',expected:'Ada',answers:['Ada'],must:['input(','print('],hint:'name = input("Name? ") on line 1, print(name) on line 2.'}}`
- AFTER `task:{prompt:'Finish line 2 to print the name, then press Run and type Ada + Send',expected:'Ada',answers:['Ada'],must:['input(','print('],hint:'Line 1 is done. On line 2 replace ... with name — keep it as print(name).'}}`
- `expected`/`answers`/`must` unchanged.

L11 (id 'clicker'):
- BEFORE `starter:'...b.x = 20\n\n# TODO: connect clicks below — wire hit up, Run, then click the tomato',`
- AFTER `starter:'...b.x = 20\n\non_click(...)  # <-- replace ... with hit, press Run, then click the tomato',`
- BEFORE `hint:'Last line: on_click(hit)'`
- AFTER `hint:'Replace ... with hit so the last line reads on_click(hit)'`
- `task.prompt` and `task.must` (`['def hit','score()','on_click(hit)']`) unchanged, so the `on_click(...)` placeholder still fails the must-check until the learner replaces `...` with `hit`.

## Test commands + outputs

1. Failing check first (throwaway `check-starter.js`, deleted after):
   - `node check-starter.js`
   - Output BEFORE fix: `L4 scaffolded: true L11 placeholder: false / NEEDS FIX`
   - Note: `L4 scaffolded: true` even before the fix because the naive `src.includes('name = input(')` also matches the L4 *example* string; the actual L4 *starter* was `print("hi")`. Overall verdict was still correctly `NEEDS FIX`.
   - Output AFTER fix: `L4 scaffolded: true L11 placeholder: true / ALREADY FIXED`
2. TinyPy run (via throwaway `verify-t1.js`, deleted after — direct `node -e` failed on PowerShell quoting, so a temp file was used):
   - `node verify-t1.js` → `{"output":"Ada","error":"","update":null}`, `output is Ada: true`, `no needInput: true`, `no error: true`
3. Lesson count:
   - `LESSONS length: 19` (counted `id:'` occurrences in `app/course-data.js`; `tests/test-lessons.html` browser check not run — no browser in this environment)
4. Diff:
   - `git diff -U5 app/course-data.js` shows only the 4 L4/L11 starter/prompt/hint lines above.

## Concerns

- `git status --short` shows pre-existing uncommitted modifications to `app/app.css`, `app/console.js`, `app/editor.js`, `app/preview.js`, `design.md`, `learn.html`, `play.html` plus untracked `app/max.js` — none of these are mine; I touched only `app/course-data.js` and did not commit.
- L4's new starter contains `print("...")`, which passes the `must: ['input(','print(']` check but yields output `...` ≠ `expected: 'Ada'`, so the task still correctly requires the learner edit. Verified logic by inspection only, not via `Course.checkTask` (browser-only, `window.LESSONS`).
- Browser harnesses (`tests/test-lessons.html`, `tests/test-assistant.html`) were not opened — no browser tooling in this environment; node checks used instead per plan allowance.
