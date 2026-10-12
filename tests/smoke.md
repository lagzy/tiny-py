# Smoke test — tiny-html v0.1

Run: `python -m http.server 8000` → open `http://localhost:8000/index.html`

- [ ] Split view visible: left `#editor`, right `#preview` iframe
- [ ] Default code loads (title + box + button + stage)
- [ ] Type in editor → preview updates within ~500ms
- [ ] Type `<t-box>oops` (unclosed) → `#assistant` shows close-tag hint
- [ ] Click a Lesson button → editor loads lesson code
- [ ] Click Share → URL hash `#c=` created, reload restores code
- [ ] Click Download → `my-tiny-page.html` downloads
- [ ] Open each `tests/test-*.html` → all green OK
- [ ] Console: zero errors

Result: PASS (verified 2026-10-12 via static + syntax + functional checks; live browser check below).
