# QA checklist
- [x] All paths relative (no leading /)
- [x] index.html loads tiny/ + app/ scripts in order
- [x] learn.html backlink works
- [x] Preview uses iframe srcdoc sandboxed
- [x] Assistant never blocks preview
- [x] Lessons 10 count, progress in localStorage
- [x] Games 5 examples load
- [x] Mobile stacks under 700px
- [x] .nojekyll present for Pages

# Smoke
Open index.html → type → preview <500ms → assistant tip → lesson load → share link reload. PASS if no console errors.
