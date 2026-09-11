# Atomic Features

Break a feature into the smallest pieces a group of workers can build in parallel, each piece checkable on its own.

## When to use this

Use it when a feature is about to be split across more than one worker (human or agent) and each worker needs a piece they can build and prove works without waiting on the others. This is not Feature Map — there is no behaviour section, no lifecycle section, and no tester kit here. If you need to document states, triggers, and variants for a feature, that's Feature Map, not this.

## Procedure

1. **Take the feature.** Pasted text, a description, a ticket — whatever names the thing to build.
2. **Split it into atoms.** Keep splitting until every piece is the smallest thing that still does one concrete, checkable job. Stop before you lose anything observable.
3. **Run the anti-over-split check on every pair of neighbouring pieces.** If two pieces can never be built, tested, or fail independently of each other, they are one atom — merge them back.
4. **Run the independence check on every atom you kept:**
   - **Independently buildable** — can you write one line (the `Contract`) that says what this atom takes in and what it gives out, such that a worker could build it with every other atom stubbed? If not, the split is wrong.
   - **Independently verifiable** — can `Verify` + `Success` + `Failure` be checked without any other atom being built first? If not, the split is wrong.
5. **Write each atom** with the exact fields: `From:`, `Build:` (numbered steps), `Contract:` (one line), `Verify:` (numbered checks), `Success:` (one line), `Failure:` (one line). See `AGENTS.md` for the full template.
6. **Write the file** at `maps/<slug>.md` with the header (`# <Title> — atomic features`, `Source:`, `Updated:`, `Atoms:`) above the atom blocks.
7. **Render it.** From the repo root: `node render.js <slug>`. This writes `<slug>.html` and adds or updates the entry for it in `pages.json`.
8. **Confirm it worked.** Open `<slug>.html` and check the atom count on the page matches the `Atoms:` line, and that the page is listed on `index.html`.

## Anti-over-split, in practice

Before you finalize a split, ask of every pair of adjacent atoms: "could I hand these to two different people right now, today, with nothing else built, and would each of them have something they could finish and prove works?" If the answer is no for either one, they're one atom, not two.

A tell you split too far: one atom's `Contract` says it needs data that only exists after another atom is built. That's not independent — merge them, or rewrite the contract so the dependency is stubbed instead of real.

A tell you didn't split far enough: an atom's `Build` list mixes two unrelated concerns (say, a data field and an entire endpoint that reads it) and its `Verify` needs both working before anything can be checked. Split it so each piece has its own checkable end state.

## Independence checks, in practice

- **Buildable:** read the `Contract` line alone. If a worker who has never seen the rest of the map could start coding against it — stubbing whatever it depends on — the contract is good.
- **Verifiable:** read `Verify`, `Success`, and `Failure` alone. If you can run the check and get a real pass/fail without any other atom existing yet, it's good. If the check secretly needs another atom's output, either stub that output explicitly in the `Contract`, or the atoms aren't actually independent — merge them.
