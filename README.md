# atomic-features

Atomic Features breaks a feature into its smallest independently-buildable, independently-verifiable pieces (atoms), so a group of workers can build them in parallel. It's a variant of Feature Map with behaviour and lifecycle removed — see `AGENTS.md` for the full rules and the exact map format, and `SKILL.md` for the step-by-step authoring procedure.

## Add a new map

Write `maps/<slug>.md` in the format documented in `AGENTS.md`: a header (`# <Title> — atomic features`, `Source:`, `Updated:`, `Atoms:`) followed by one `## ` block per atom (`From:`, `Build:`, `Contract:`, `Verify:`, `Success:`, `Failure:`).

## Render it

From the repo root:

```
node render.js <slug>
```

This writes `<slug>.html` and upserts the matching entry in `pages.json`. The page then shows up on `index.html`.

## Branches

`staging` is where work happens. `main` is protected — changes land only through a pull request from `staging`, approved by the owner.
