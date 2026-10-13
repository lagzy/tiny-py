# Ursina Animation & Movement — Design Spec

Date: 2026-10-13 | Status: approved, awaiting implementation plan
Project: tiny-py (offline static Python-subset playground + Learn course)

## Goal

Expand the `ursina`/`tiny` module toward real Ursina beginner workflows, starting
with animation & movement. Success = two new course lessons (20–21) that teach
animation step-by-step with passing traces — NOT 100% Ursina parity (3D engine
concepts stay out; see non-goals).

## Context

- Engine: `app/tinypy.js` — Python subset transpiled to JS, run inside sandboxed
  `srcdoc` iframes. Frame loop already calls user `update()` every frame.
- Current game API (~15 fns): `Entity box circle player coin image text score
  on_click on_key say clear bg color update`. Entities are opaque handles.
- Lessons use `Course.checkTask` (output-first + `must[]`) with deterministic
  traces; platformer/tictactoe lessons already use multi-step traces.

## 1. Engine architecture

- Entities become objects with numeric `x, y, rotation, scale` props.
- New internal tween list: `animate_*` pushes
  `{entity, prop, from, to, seconds, elapsed}`. Each frame, BEFORE user
  `update()`, the engine advances tweens by elapsed time and writes values.
- Play mode uses real elapsed (wall-clock) time; lesson-trace mode uses fixed
  virtual steps so expected outputs are reproducible.
- `time.dt` (seconds since last frame) exposed for frame-rate-independent motion.

## 2. API surface (faithful Ursina names, 2D-adapted)

- `entity.animate_x(target, seconds)` / `animate_y` — linear glide, one axis.
- `entity.animate_scale(target, seconds)` — grow/shrink.
- `lerp(a, b, t)` — `a + (b-a)*t`; also available as `math.lerp`.
- `destroy(entity)` — remove from stage; later tweens on it are no-ops.
- `invoke(func, delay)` — call `func` after `delay` seconds via frame loop
  (no `setTimeout` inside the sandbox); delay ≤ 0 runs next frame.
- `entity.rotation/scale/x/y` — readable + writable numeric props.

Non-goals (loud friendly error, never silent): `camera.*`, `Vec3`, shaders,
`Audio`/music (next round: sound), 3D models. Error style follows existing
`friendly()` pattern, e.g. `'camera' is real Ursina but needs 3D — not in
tiny-py yet`.

## 3. Lessons 20–21 (steps style, virtual-time traces)

- Lesson 20 "Smooth moves": (1) Frame steps — `update()` + `x = x + 1`;
  (2) Smooth glide — `animate_x(5, 2)`; (3) Gentle landing — `lerp` + `time.dt`.
- Lesson 21 "Chase": (1) Follow — coin lerps toward player each frame;
  (2) Catch — distance check → `destroy(coin)` + `score`;
  (3) Encore — `invoke(spawn_coin, 1)` respawn.
- Traces resolve tweens in virtual time → exact expected-output strings.

## 4. Testing

- New `verify-anim.js`: tween math, lerp, destroy, invoke ordering, `dt`
  exposure, determinism (same run twice → same output).
- Extend `verify-course-full.js` with lessons 20–21 solutions; bump
  `verify-tiny.js` script count; update `complete.js` keyword lists +
  `verify-complete.js`.
- Full 15-suite re-run + browser proof (run a glide in playground, solve both
  lessons in-page, console clean). Update `index.html` copy (21 lessons),
  `tests/test-lessons.html`, and spec/iteration notes.

## Open follow-ups (out of scope)

Sound/music round, collisions/physics round, Tkinter widget expansion.
