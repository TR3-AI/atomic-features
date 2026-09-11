# Dynamic stop loss — atomic features
Source: feature "dynamic stop loss" (pasted feature, no idea-slicer link)
Updated: 2026-09-11
Atoms: 7

## Price feed intake
From: Dynamic stop loss
Build:
1. `subscribe(symbol) -> stream of {symbol, price, ts}` that connects the injected market-data client to one symbol.
2. Hold the latest tick as `lastPrice(symbol)` and push every new tick to subscribers.
Contract: In: symbol + injected market-data client. Out: a push stream of `{symbol, price, ts}` and a synchronous `lastPrice(symbol)`. Touches only the feed — never reads stop state or the venue.
Verify:
1. Inject a fake client, push ticks 100 then 101, read `lastPrice("X")` and assert it returns 101 and that a subscriber received both ticks.
Success: With a stubbed data client, every pushed tick is observable on the stream and `lastPrice` returns the most recent price.
Failure: `lastPrice` returns a stale value, or a pushed tick never reaches a subscriber.

## Trigger-price calculator
From: Dynamic stop loss
Build:
1. Pure function `nextTrigger({price, currentTrigger, side, config}) -> newTrigger`; `config` picks the rule — trail-by-distance (`price - distance` for a long) or volatility-band (`price - k*atr`).
2. Never loosen the stop: clamp so a long's `newTrigger >= currentTrigger` (mirror for a short).
Contract: In: flat primitives `{price, currentTrigger, side, config}`. Out: one `newTrigger` number. Pure — no I/O, no clock, no venue, no state writes.
Verify:
1. Call with long, currentTrigger 90, price 100, distance 5 → assert 95; then call price 96 → assert it stays 95 (never loosens).
Success: For known inputs the function returns the documented trigger and never moves a stop against the position.
Failure: The returned trigger loosens the stop, or differs from the rule for known inputs.

## Trailing update loop
From: Dynamic stop loss
Build:
1. On each tick from Price feed intake, call `nextTrigger` with the current persisted trigger.
2. If the returned trigger differs, emit `stopMoved({symbol, from, to})`; otherwise emit nothing.
Contract: In: injected feed stream + injected `nextTrigger` + a current-trigger reader. Out: `stopMoved` events, at most one in-flight move per symbol. Never calls the venue directly.
Verify:
1. Feed rising prices 100,101,102 through a stub calculator that trails by 5 → assert exactly the moves 95→96→97 are emitted, and that a repeated flat price emits nothing.
Success: Rising prices produce monotonically rising `stopMoved` events; an unchanged trigger emits no event.
Failure: A move fires when the trigger did not change, or a real change fires no move.

## Resting order sync
From: Dynamic stop loss
Build:
1. `syncOrder({symbol, side, trigger})` that guarantees exactly one resting stop order sits at `trigger` on the injected venue client.
2. Place if none exists; cancel-replace if one exists at a different price; no-op if it already matches.
Contract: In: `{symbol, side, trigger}` + injected venue client. Out: the live venue order id. Idempotent for the same trigger; touches only this symbol's stop order.
Verify:
1. With a fake venue client, call `syncOrder` at 95 then 96 → assert the client saw one place at 95 then one cancel-replace to 96, and a repeat call at 96 issues no new venue call.
Success: After any sequence of triggers the venue holds exactly one stop order, at the latest trigger.
Failure: Duplicate resting orders, a stale price left on the venue, or a redundant cancel-replace on an unchanged trigger.

## Cancel / teardown
From: Dynamic stop loss
Build:
1. `cancelStop(symbol)` that cancels the resting stop order on the venue and marks the stop inactive.
2. Make it safe when no order exists — no-op, still marks inactive.
Contract: In: symbol + injected venue client + state writer. Out: no resting order for that symbol and an inactive stop record. Touches only this symbol.
Verify:
1. Place a stop, call `cancelStop`, assert the fake venue shows no resting order for the symbol and state reads `active=false`; call it again and assert no error.
Success: After cancel the venue holds no stop for the symbol and the persisted stop is inactive, even if called twice.
Failure: A resting order survives the cancel, or a second cancel throws.

## Persisted stop state
From: Dynamic stop loss
Build:
1. Record `{symbol, side, trigger, config, venueOrderId, active}` with `saveStop` / `loadStop(symbol)` against the injected store.
2. Write on every trigger move and on activate/cancel so the loop can resume after a restart.
Contract: In: the stop record + injected key-value store. Out: durable read-back of the same record by symbol. Touches only the store — no venue, no feed.
Verify:
1. Save a record with trigger 96, build a fresh instance against the same store (simulating a restart), `loadStop` and assert trigger 96 and `active=true` come back.
Success: A saved stop survives a process restart and reloads with the identical trigger, config and active flag.
Failure: A reloaded stop is missing, or its trigger/active flag differs from what was saved.

## Stop status display
From: Dynamic stop loss
Build:
1. `renderStop(state, lastPrice) -> {trigger, distance, active}` with `distance = lastPrice - trigger` (mirror for a short).
2. Expose it read-only at the status endpoint the user watches.
Contract: In: a stop record + a last price (both flat primitives). Out: a display object `{trigger, distance, active}`. Pure and read-only — never writes state or touches the venue.
Verify:
1. Call `renderStop({trigger:95, active:true}, 100)` → assert it returns `{trigger:95, distance:5, active:true}`.
Success: The displayed trigger and distance-to-price match the persisted stop and the latest price for any input.
Failure: The shown trigger or distance disagrees with the stored stop and the last price.
