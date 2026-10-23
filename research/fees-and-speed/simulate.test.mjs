import test from "node:test";
import assert from "node:assert/strict";
import { makeTrace, nextBaseFee, scenarios, simulate } from "./simulate.mjs";

test("EIP-1559 target, full, empty and minimum upward adjustment", () => {
  assert.equal(nextBaseFee(1_000_000_000n, 30_000_000, 60_000_000), 1_000_000_000n);
  assert.equal(nextBaseFee(1_000_000_000n, 60_000_000, 60_000_000), 1_125_000_000n);
  assert.equal(nextBaseFee(1_000_000_000n, 0, 60_000_000), 875_000_000n);
  assert.equal(nextBaseFee(1n, 30_000_001, 60_000_000), 2n);
});

test("equal-capacity controls have equal target gas per second", () => {
  assert.deepEqual(scenarios.slice(0, 3).map(s => s.gasLimit / 2 / s.slotSeconds), [2_500_000, 2_500_000, 2_500_000]);
  assert.deepEqual(scenarios.slice(3).map(s => s.gasLimit / 2 / s.slotSeconds), [3_125_000, 3_125_000, 3_125_000]);
});

const tx = (id, arrival = 1, gas = 21_000, maxFee = 100_000_000_000n) =>
  ({ id, arrival, gas, maxFee, tip: 1_000_000_000n });

test("known arrival is included at next slot, not treated as finality", () => {
  assert.equal(simulate([tx(0)], scenarios[0], 12).p50WaitSeconds, 11);
  assert.equal(simulate([tx(0)], scenarios[2], 12).p50WaitSeconds, 5);
});

test("capacity and unaffordable bids leave transactions pending", () => {
  const result = simulate([tx(0), tx(1), tx(2, 1, 21_000, 0n)],
    { name: "tiny", slotSeconds: 12, gasLimit: 21_000 }, 12);
  assert.equal(result.included, 1);
  assert.equal(result.pending, 2);
  assert.equal(result.p50PriceGwei, 11);
  assert.equal(result.p95PendingAgeSeconds, 11);
});

test("trace is reproducible and accounting includes arrivals after final slot", () => {
  const trace = makeTrace("burst", 25, 42);
  assert.deepEqual(trace, makeTrace("burst", 25, 42));
  const arrivals = [...trace, tx(trace.length, 24.9)].sort((a, b) => a.arrival - b.arrival);
  const result = simulate(arrivals, scenarios[0], 25);
  assert.equal(result.included + result.pending, trace.length + 1);
  assert.ok(result.pending >= 1);
});

test("reject invalid configuration and arrival order; empty trace has null quantiles", () => {
  assert.throws(() => simulate([], { slotSeconds: 0, gasLimit: 100 }));
  assert.throws(() => simulate([tx(0, 2), tx(1, 1)], scenarios[0]));
  assert.equal(simulate([], scenarios[0]).p95WaitSeconds, null);
});
