# tiny-py

Learn Python the simple way — tiny programs + tiny games, Ursina-style.
Fully offline: a hand-written Python subset that runs in the page. No internet needed.

Open `index.html` (home) and pick a door: `play.html` is the playground
(left = Python code, right = stage + separate print console, coach tips
appear only when they spot a mistake), `learn.html` is the full-screen
course (theory + animated traces + tasks).

The editor helps like a big one: autocomplete (`pr` → `print`, arrows +
Enter), auto-closing `()` `[]` `{}` `""`, Tab to indent (Shift+Tab to
unindent), smart Enter after `:`.

## Learner code (real Python syntax)
```python
print("Hello tiny-py!")

player = Entity(color="blue", x=100, y=100)

score(0)

def update():
    player.x = player.x + 1
```

## Supported subset
`print len range str int input` · vars · `if/elif/else` · `while` · `for x in ...` ·
`def/return` · lists + `.append` · `and/or/not/in/is` · `Entity(box/circle/...)` ·
`score on_key on_click update` · `input()` (console type-in row) · `#` comments ·
`image(name, x, y)` sprites from your image library ·
imports that actually work: `math`, `tkinter` (Tk/Label/Button/Entry subset),
`tiny`, `ursina` — as `import x`, `import x as y`, or `from x import y`.

Not supported (errors politely): other modules, f-strings, kwargs except
`Entity(...)` and Tk widgets, negative indexes.

Everything stays in the browser (localStorage): named files + draft autosave
in the playground, course progress + resume in the course, and the image
library. `print()` of a function shows `<function name>`, like Python.

## Folders
- `app/tinypy.js`: transpiler + prelude + run. Sandboxed `file://` iframes
  can't load subresources, so the preview embeds the engine via
  `TinyPy.bundle()` (self-serializing; no mirror copy to drift)
- `app/` playground: editor, preview, highlighter, assistant, lessons, examples
- `tiny/` legacy HTML engine (kept, unused by preview)
- `tests/` open-in-browser checks + node harnesses

## Deploy to GitHub Pages (static, 3 steps)
1. Push `main` branch with these files at root.
2. GitHub repo → Settings → Pages → Deploy from branch → `main` / root.
3. Open `https://<user>.github.io/<repo>/`.

No build, no backend, no CDN. Works from file:// too.
