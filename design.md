# tiny-html design.md

Visual language for the playground (`index.html`) and the docs page (`learn.html`).
Goal: a clean learning tool that looks designed, not generated.

> Rebrand note (tiny-py): the framework language changed from HTML tags to a
> Python subset (see README). Visual language is unchanged — same tokens,
> same rules. Editor highlight tokens are VS Code-scoped in house colors:
> `.tok-kw` keywords gold, `.tok-fn` functions warm yellow, `.tok-cls`
> classes muted teal, `.tok-str` strings green, `.tok-com` comments gray,
> `.tok-num` numbers soft blue. Learn demos share the same painter. The CONSOLE
> panel reuses editor surfaces (charcoal + cream) so output feels like part
> of the same machine.
>
> Pages (2026-10): `index.html` is a clean home with two doors.
> `play.html` is the full playground. `learn.html` is the full-screen course:
> theory hero, animated trace (code + output + mini stage), task card linking
> to the playground with starter code via `#c=` hash. Same tokens everywhere.

## The one idea

Warm paper, dark ink, one accent. Flat surfaces separated by hairlines,
not shadows. It should feel like a well-printed workbook that happens to run code.

## Tokens

| Token      | Value     | Use                          |
|------------|-----------|------------------------------|
| `--paper`  | `#f7f3ea` | page background (warm)       |
| `--panel`  | `#fffdf8` | editor/preview/doc panels    |
| `--ink`    | `#22201b` | text, editor background base |
| `--muted`  | `#6f6a5e` | secondary text, labels       |
| `--line`   | `#e3dccb` | 1px hairline borders         |
| `--accent` | `#d9481f` | primary actions, focus, logo |
| `--accent-dk` | `#b93a15` | accent hover/active       |
| `--moss`   | `#4d7c0f` | success / "LIVE" dot         |
| `--amber`  | `#fdf3d7` | coach hint wash              |
| `--amber-line` | `#e3bd55` | coach hint border        |
| `--code-bg`| `#1e1b16` | editor background (warm charcoal) |
| `--code-fg`| `#f3ead8` | editor text (cream)        |

Radius: 10px panels, 8px controls. One radius scale, no bubbles.

Type (system stacks only — must work offline from `file://`):
- Wordmark / headings: `Georgia, 'Times New Roman', serif`
- UI: `system-ui, -apple-system, 'Segoe UI', sans-serif`
- Code: `ui-monospace, 'Cascadia Mono', Consolas, monospace`

## Hard rules (the no-slop list)

1. **No gradients.** Especially no purple/blue. Flat color only.
2. **No glassmorphism, no stock shadows.** Separation = 1px `--line` borders.
   One restrained header underline is enough.
3. **One accent.** `--accent` is the only loud color. Moss = status only,
   amber = coach hints only.
4. **No emoji as iconography.** The logo is three CSS squares
   (accent / moss / amber). The LIVE indicator is a CSS dot.
5. **No dead placeholder text.** Every string on screen earns its place;
   labels are small-caps microcopy, not lorem ipsum.
6. **No framework look.** No rounded-everything pills, no Inter-on-slate,
   no hero section, no feature grid. This is a tool, it dresses like one.
7. **Dark editor, light page.** The editor is the single dark surface;
   contrast draws the eye to where typing happens.
8. **IDs are contract.** `#editor #preview #assistant #lessons #toolbar
   #btn-run #btn-reset #btn-share #btn-save #file-list #btn-file-save #btn-file-del
   #images-panel #img-list #btn-img-add #img-file #btn-undo #btn-redo
   #btn-max-code #btn-max-preview`
   must survive any redesign — `app/*.js` depends on them. `#assistant` must stay a plain-text node:
   `assistant.js` overwrites `textContent`, so no child markup inside it.

## Components

- **Header:** paper background, hairline bottom border. Logo squares +
  serif wordmark + muted tagline left; "Learn" ghost button right.
- **Panels:** `--panel` surface, 1px `--line`, 10px radius. Panel head:
  11px letterspaced small-caps muted label. Preview head carries a moss
  LIVE dot (CSS pulse, no JS).
- **Toolbar:** Run = solid accent; Reset/Share/Download = ghost
  (transparent, hairline border, ink text). `Ctrl+Enter` hint in `<kbd>`.
- **Editor:** warm charcoal, cream text, accent caret, 14px/1.6 mono,
  comfortable padding. `:focus-visible` ring in accent.
- **Coach strip (`#assistant`):** amber wash, amber left border, dark text.
  Short plain sentences, never more than two lines of worry.
- **Lessons:** numbered chips — hairline border, hover fills accent-soft,
  active state tracked in `localStorage`, not in CSS.
- **Docs (`learn.html`):** same tokens via `app/app.css`, max-width 720px
  measure, real `<table>` styling (hairline rows, no `border="1"`),
  code samples in charcoal blocks.
