# Task 3 Report — Soften L13 wall + give L19 visible payoff

## Status: DONE (uncommitted, copy-only in app/course-data.js)

## TDD checks
- `node check-hard.js` BEFORE: `L13 mentions Send: true`, `L13 warns 5 inputs: false`, `L19 tells where to look: false` (L19 false proves the gap).
- `node check-hard.js` AFTER: all three `true`.
- `node verify-board.js` (TinyPy Board-step run): `{"output":"X| | ","error":"","update":null}` — output `X| |` with no error.
- Throwaway scripts deleted (`check-hard.js`, `verify-board.js`); nothing committed.

## Edits (exact plan copy, verbatim)
- L13 Step Play prompt → `No code to change — just play. Press Run, then when the console asks "X moves"/"O moves": type 0 + Send, 3 + Send, 1 + Send, 4 + Send, 2 + Send (5 Sends total). Watch X fill the top row.`
- L13 Step Referee prompt appended → ` Same 5 Sends as Play (0, 3, 1, 4, 2). If it says "asked for more input", you missed a Send — press Run again.`
- L13 top task prompt appended → ` Tip: each Send = one number. 5 numbers total.`
- L19 theory → `import tkinter opens real windows (here: a white card in the PREVIEW stage). Tk() is the window, Label shows words, pack() puts things in.`
- L19 prompt → `root.title("Hi"), a Label with text "Hello!", .pack(), and root.mainloop(). Press Run and look in PREVIEW for a white card titled Hi with Hello! inside (CONSOLE stays empty — that is normal).`
- L19 hint appended → ` Look right in PREVIEW for the card.`

## Preserved
- No changes to `expected`/`must`/`answers`/starter code, engine, or Tasks 1–2 copy (diff confirms Tasks 1–2 edits intact).
- `git diff -U5 app/course-data.js` shows only Task 3 prompt/theory/hint lines plus pre-existing Task 1–2 lines.
