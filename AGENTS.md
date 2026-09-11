# AGENTS.md — binding rules for any agent working in this repo

This repo runs **Atomic Features** — a variant of Feature Map. Feature Map breaks an idea into features, then documents each feature's behaviour (states, what can happen to it, variants) and lifecycle (every trigger point, progression, end state), verified by a tester agent. Atomic Features drops behaviour and lifecycle entirely. It answers one question only: **what is the smallest set of pieces this feature splits into that a group of workers can build in parallel, each piece checkable on its own?** There is no tester kit here — Verify is a short, direct check written into the map itself, not a driving recipe run by a separate agent.

`maps/<slug>.md` files are the source of truth. The HTML pages are rendered from them by `node render.js <slug>`. Everything below is mandatory.

## Layout

- `maps/<slug>.md` — one atomic map per feature, source of truth.
- `<slug>.html` — rendered from `maps/<slug>.md` via `node render.js <slug>`. Regenerate the whole file on every update — never patch in place.
- `pages.json` — manifest; `render.js` upserts one entry per rendered page.
- `index.html`, `nav.js`, `template.html`, `render.js` — shared shell + renderer.

## The map format

A map file lives at `maps/<slug>.md`. A header, then one `## ` block per atom. Field names below are exact — the renderer parses them literally.

```
# <Title> — atomic features
Source: <free text; e.g. feature "dynamic stop loss" (pasted feature, no idea-slicer link)>
Updated: <YYYY-MM-DD>
Atoms: <number of ## blocks>

## <atomic sub-feature name>
From: <parent feature>
Build:
1. <smallest concrete build step — a function, an endpoint, a field>
2. <next step>
Contract: <what it takes in and what it gives out — the interface a parallel worker builds to while everything else is stubbed. One line.>
Verify:
1. <one independent check at the consumer endpoint — run the real thing, read the real value>
Success: <observable proof this atom works ON ITS OWN>
Failure: <the observable gap that proves it does not>
```

- `Atoms:` is the count line (not "Features:"). The title always ends `— atomic features` (not `— feature map`).
- `Build:` and `Verify:` are numbered lists. `From:`, `Contract:`, `Success:`, `Failure:` are single lines each.
- No behaviour, no lifecycle, no tester kit anywhere in this repo. Those belong to Feature Map, not here.

## The rules

1. **Smallest useful feature.** Split a feature down as far as it goes without losing anything observable. A piece is still a feature when it does one concrete thing on its own.
2. **Anti-over-split.** If two candidate pieces can never be built, tested, or fail independently, they are ONE atom. Do not split past the point where a worker could actually take one piece and leave the other alone.
3. **Independently buildable.** Every atom carries a `Contract` — what it takes in, what it gives out. That line is the interface a separate worker builds against while every other atom is stubbed out. If you can't write a one-line contract for a piece, it isn't a real atom yet; merge it back or break it differently.
4. **Independently verifiable.** `Verify`, `Success`, and `Failure` must stand alone, with no dependency on any other atom being built first. The check runs the real thing and reads the real value — never a self-report, never "it compiles."
5. **Terse, plain English.** No jargon. Gloss any technical term the first time it shows up.

## The P-stack (5 principles, vendored, every map governed by them)

- **prove-it-works** — verification checks the real artifact (run it, read the real value), never a self-report.
- **fix-root-causes** — atoms name the real thing to build, not a symptom patch.
- **sequence-verifiable-units** — each atom ends in a checkable state on its own.
- **blast-radius** — the Contract makes clear what an atom touches so it can't silently break a sibling.
- **tdd** — the Verify is written as if the failing check comes first.

## Workflow

1. Take a feature (pasted text, a Feature Map map, or plain description).
2. Split it into the smallest atoms that pass rules 1–4 above.
3. Write `maps/<slug>.md` in the exact format above.
4. From the repo root, run `node render.js <slug>`. It writes `<slug>.html` and upserts the matching entry in `pages.json`.
5. Confirm the page renders and shows up on `index.html`.

## Branches

- `main` — protected. No direct commits. Every change lands through a pull request from `staging`, approved by the owner. No agent self-merges.
- `staging` — where work happens. Author maps and run the renderer here.

## Rules for rules

A new rule is not a rule until every agent working here can see and check it. Any change to the map format, the P-stack list, or the workflow gets written into this file, `SKILL.md`, and `README.md` together, in the same turn, so no copy drifts from the others.
