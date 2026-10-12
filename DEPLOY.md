# Deploy tiny-html to GitHub Pages

Static only — no build step.

1. Push `main` branch with these files at repo root (ensure `.nojekyll` exists).
2. GitHub repo → Settings → Pages → Deploy from branch → `main` / `(root)` → Save.
3. Open `https://<user>.github.io/<repo>/` (wait ~1 min).

Local check: `python -m http.server 8000` → open `http://localhost:8000/index.html`.
Must work from both `file://` and `https://` — all paths are relative.
