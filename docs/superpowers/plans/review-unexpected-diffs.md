# Review: Unexpected Diffs vs Plan 2026-10-13-tiny-py-beginner-fixes

Plan: `docs/superpowers/plans/2026-10-13-tiny-py-beginner-fixes.md`
Allowed: `app/course-data.js` copy/starters, `app/assistant.js` 2 rules,
`app/preview.js` keyhint, `app/console.js` placeholder, `learn.html` comment-only.
Constraints: IDs `#editor #preview #assistant #cout #cinrow #cin #btn-run #btn-send #keyhint` must survive;
offline only (system fonts, no CDN, no backend); no commit.

Base: `e5033f2 feat: 5 more lessons`, `git diff --stat` shows 9 modified + 1 untracked.
This review covers only the 5 unexpected files + `app/max.js`. Read-only, no commit.

## 1. app/editor.js (77 +++---, M)

What changed:
- `set(v)` replaced with full Undo/Redo history: `hist[], fut[], lastVal, burstStart, burstT, suppress`.
- New methods: `commit()`, `noteInput()` (800ms burst debounce), `apply(v)`, `set(v)` with history push,
  `undo()`, `redo()`, `syncBtns()`.
- `init()` now wires `input` listener, `Ctrl/Cmd+Z / Shift+Z / Y` handler, `#btn-undo` / `#btn-redo` click handlers.
- Header comment changed to `textarea wrapper + own Undo/Redo history`.

Key hunks (`git diff -U10 -- app/editor.js`):
- `-set(v){...e.value=v;e.dispatchEvent...}` → `+hist:[], fut:[], ... +commit()+noteInput()+apply()+set()+undo()+redo()+syncBtns()`
- `+this.lastVal=this.get(); +this.hist=[]; ... +ed.addEventListener('input'...) +keydown Ctrl+Z/Y +btn-undo/btn-redo listeners`

In-plan or OUT-OF-SCOPE: OUT-OF-SCOPE. Plan says "No new files, no engine rewrite" and only copy/starters/hints.
Editor history is new behavior, not listed.

IDs contract / offline: Preserves `#editor`. Uses new `#btn-undo #btn-redo` (additive, no deletion).
No CDN/fetch/backend. Offline OK. No break of required 9 IDs.

Verdict: Revert (move to separate feature branch with learn.html/play.html/app.css/design.md/max.js).

## 2. learn.html (37 +++---, M)

What changed:
- Header: `+<button id="lmapbtn">Map</button>`, `+<div id="lmap">` overlay with `#lmapcount #lmapclose #lmapgrid`.
- CODE head: `+<button id="btn-max-code">` (svg expand icon).
- Toolbar: `+<button id="btn-undo" disabled> +<button id="btn-redo" disabled>`.
- PREVIEW head: `+<button id="btn-max-preview">`.
- Scripts: `+<script src="app/max.js">`.
- Inline script: `+renderMap()/openMap()/closeMap()/toggleMap()`, `+lmapbtn/lmapclose` listeners,
  `+Escape closes map`, `+// Arrow keys skip lessons — disabled while typing` comment,
  `window.Learn` now exports `openMap,closeMap`.

Key hunks:
- `CODE` → `CODE+btn-max-code`, `Run` toolbar + undo/redo, `keyhint` line + max-preview btn.
- `document.addEventListener('keydown'...)` + comment + `if(e.key==='Escape'){closeMap();}`.

In-plan or OUT-OF-SCOPE: OUT-OF-SCOPE. Plan allowed "learn.html:70 (cin hint) if needed" + "arrow handler: add one-line comment, ensure Map Esc closes" — only the 1-line comment + Esc guard for *existing* map would be in-plan. Everything else (roadmap overlay, max buttons, undo buttons, new script tag) violates "comment-only" and "No new files".

IDs contract / offline: All 9 required IDs still present (`#editor #preview #assistant #cout #cinrow #cin #btn-run #btn-send #keyhint` verified in diff context). New IDs additive. No CDN, only relative `app/max.js`. Offline OK.

Verdict: Revert (keep only the arrow-guard comment + Esc-close if map existed; split Map/Max/Undo into new plan).

## 3. play.html (6 +++--, M)

What changed:
- CODE head filerow: `+<button id="btn-max-code">` svg.
- Toolbar: `+<button id="btn-undo" disabled> +<button id="btn-redo" disabled>`.
- PREVIEW head: `+<button id="btn-max-preview">`.
- Foot: `+<script src="app/max.js">`.

In-plan or OUT-OF-SCOPE: OUT-OF-SCOPE. Plan never lists play.html. Same Max/Undo feature as learn.html.

IDs contract / offline: Preserves all required IDs. Additive only. No CDN. Offline OK.

Verdict: Revert (same branch as editor.js/learn.html).

## 4. app/app.css (22 ++++, M)

What changed:
- `.btn:disabled{opacity:.4}` (for undo/redo).
- `.panel-head .btn svg{vertical-align:-2px}`, `#btn-max-code/#btn-max-preview{margin-left:auto}`.
- `.panel.max` fixed overlay + `#editor`/`#preview` heights for maximized mode.
- `#lmap`, `.lmap-head`, `.lmap-grid`, `.lmap-item (.done/.on/.n)` roadmap styles.

In-plan or OUT-OF-SCOPE: OUT-OF-SCOPE. Plan says "No CSS redesign" and "one line, no CSS change" for console placeholder. This is 22 lines supporting Max/Map features.

IDs contract / offline: No ID deletion (CSS only). No webfonts/CDN — uses `inherit, Georgia, ui-monospace`. Offline OK.

Verdict: Revert (coupled to Max/Map/Undo; re-add with that feature).

## 5. design.md (3 +-, M)

What changed:
- IDs contract line: `-#images-panel #img-list #btn-img-add #img-file` → `+#images-panel #img-list #btn-img-add #img-file #btn-undo #btn-redo #btn-max-code #btn-max-preview`.

In-plan or OUT-OF-SCOPE: OUT-OF-SCOPE (file not listed in plan). But change is docs-only, additive, keeps docs truthful *if* code kept.

IDs contract / offline: Extends contract, does not break it (no required ID removed). N/A for offline.

Verdict: Revert (to restore plan scope; re-apply together if Max/Undo/Map feature is approved — docs must match code, so don't keep docs while reverting code).

## 6. app/max.js (untracked, 44 lines, NEW)

- `git status --short -- app/max.js`: `?? app/max.js`.
- `git log --oneline -3 -- app/max.js`: empty (no history).
- `git log --oneline -3`: `e5033f2, ee18a8e, 2060666` — none contain max.js.
- Content: `window.Max` with `ICON_MAX/ICON_MIN`, `panelOf/toggle/unmaxAll/sync/init`, `Escape` handler, `DOMContentLoaded` init. Toggles `.max` on own `.panel`, maximizing one unmaximizes other.

Conclusion: NEW code, not pre-existing. Violates "No new files".

IDs contract / offline: Requires `#btn-max-code #btn-max-preview`, uses `.panel.max`. Inline SVG, no CDN/fetch. Offline OK, but new-file violation stands.

Verdict: Revert (delete untracked file / `git clean -n app/max.js` preview only — do not delete without approval; keep only in feature branch).

## Cross-cutting

- Required IDs `#editor #preview #assistant #cout #cinrow #cin #btn-run #btn-send #keyhint`: all survive in learn.html/play.html diffs. No break.
- Offline rule: no new CDN/backend found in these 6 files. All scripts relative, fonts system. Pass.
- In-plan files (not verdicted here, for context): `app/course-data.js` copy/starters only, `app/assistant.js` 2 rules, `app/console.js` placeholder + focus guard (minor extra but in spirit), `app/preview.js` keyhint + `input()` auto-run guard (extra hunk, sensible, should be noted in plan Task 4 report).
- Coupling: editor.js ↔ learn.html/play.html (undo btns) ↔ app.css (disabled/max/map styles) ↔ design.md (IDs) ↔ max.js (max btns) must be kept/reverted atomically.

## Short verdicts

- app/editor.js: OUT-OF-SCOPE — Revert.
- learn.html: OUT-OF-SCOPE (except 1-line arrow comment) — Revert.
- play.html: OUT-OF-SCOPE — Revert.
- app/app.css: OUT-OF-SCOPE — Revert.
- design.md: OUT-OF-SCOPE docs extension — Revert (with code).
- app/max.js: NEW untracked file, violates No-new-files — Revert (remove from this plan).
