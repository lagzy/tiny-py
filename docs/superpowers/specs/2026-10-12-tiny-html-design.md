# tiny-html Design Spec — 2026-10-12

## Purpose
Ultra-simple HTML learning framework + playground for tiny pages and simple games, Ursina-style. Static-only for GitHub Pages. Split view: left editor, right live preview, bottom assistant.

## Decisions (user-approved)
- API: Both combined — custom tags `<t-*>` for pages + `tiny.*` JS for games
- Assistant: Both full — inline rule-based tips + guided lessons/challenges
- Layout: Split editor+preview

## Architecture (Approach B: modular static, no build)
```
tiny-html/
  index.html
  tiny/tiny.js, tiny-tags.js, tiny-game.js, tiny.css
  app/editor.js, preview.js, assistant.js, lessons.js, examples.js
  docs/superpowers/specs/
  .nojekyll, README.md, 404.html
```
No npm, no backend, localStorage only. Open index.html = works. GitHub Pages via main branch root.

## Components
### Framework (learner API, max simplicity)
- Tags (map 1:1 to HTML): t-text, t-title, t-button, t-img, t-box, t-row, t-center. Auto-styled, forgiving parser.
- Game JS (~15 fns): tiny.box(color,x,y), tiny.player(), tiny.coin(), tiny.text(), tiny.score(), tiny.onKey(), tiny.onTouch(), tiny.say(), tiny.clear(), tiny.bg(). Built-in loop, collision helper.
- Example learner code:
```html
<t-title>My game</t-title>
<t-box red>Hello</t-box>
<script>tiny.player(); tiny.coin(); tiny.onKey('space', ()=>tiny.say('jump!'))</script>
```

### Playground
- editor.js: textarea + lightweight highlight, Run/Reset/Share (URL hash #c=), 5 starter templates.
- preview.js: debounced 300ms render into sandboxed iframe via srcdoc, wraps user code with tiny.js. Shows friendly error overlay, never blank.
- assistant.js: regex rules — unclosed t-*, missing quotes, tny. typo, missing <script> close. Explain button with plain-English mapping to real HTML.
- lessons.js: 10 lessons (tags 1-5, JS 6-8, games 9-10) + progress in localStorage.
- examples.js: 5 games — clicker, catch, maze, pong-lite, guess.

## Data flow
Type → debounce → preview srcdoc rebuild + assistant scan → tips/lessons update. All client-side.

## Error handling
Sandboxed iframe, try/catch around user JS, friendly hints. Assistant never blocks preview.

## Testing
Each module ships `test-*.html` open-in-browser green/red checks. Manual checklist: type → preview <500ms, broken tag → hint, lessons progress persists, share link reloads, mobile stacks vertically.

## 20-subagent build plan
1 coordinator, 4 framework (tags, game, css, core bundle), 5 app (editor, preview, assistant-rules, lessons-content, examples-games), 3 pages (index layout, docs, 404+README), 3 QA (link check, lesson flow, game APIs), 2 polish (a11y/mobile, share/export), 2 deploy (Pages config, demo verify). Each owns 1-2 files.

## Self-review
- No TBDs. Scope is single static app. No contradictions: static constraint satisfied by rule-based assistant (no AI backend). Ambiguity resolved: Both combined API explicitly defined.
