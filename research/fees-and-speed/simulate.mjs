import { pathToFileURL } from "node:url";

// Synthetic queue model, not an Ethereum client or a consensus simulator.
export const scenarios = [
  { name: "baseline", slotSeconds: 12, gasLimit: 60_000_000 },
  { name: "10s-equal-capacity", slotSeconds: 10, gasLimit: 50_000_000 },
  { name: "6s-equal-capacity", slotSeconds: 6, gasLimit: 30_000_000 },
  { name: "12s-plus25pct", slotSeconds: 12, gasLimit: 75_000_000 },
  { name: "10s-plus25pct", slotSeconds: 10, gasLimit: 62_500_000 },
  { name: "6s-plus25pct", slotSeconds: 6, gasLimit: 37_500_000 },
];

export function nextBaseFee(base, used, limit) {
  const target = BigInt(Math.floor(limit / 2));
  const delta = BigInt(used) - target;
  if (delta === 0n) return base;
  const change = (base * (delta < 0n ? -delta : delta)) / target / 8n;
  return delta > 0n ? base + (change > 0n ? change : 1n) : base - change;
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + 0.5) / 4294967296;
  };
}

export function makeTrace(workload, duration = 600, seed = 42) {
  const rng = random(seed);
  const trace = [];
  for (let second = 0; second < duration; second++) {
    const rate = workload === "low" ? 12 : workload === "steady" ? 35 :
      (second >= 200 && second < 400 ? 80 : 20);
    // Poisson arrivals, uniform within each one-second demand interval.
    let offset = 0;
    while ((offset += -Math.log(1 - rng()) / rate) < 1) {
      const gas = [21_000, 65_000, 150_000][Math.floor(rng() * 3)];
      trace.push({ id: trace.length, arrival: second + offset, gas,
        maxFee: BigInt(15 + Math.floor(rng() * 86)) * 1_000_000_000n,
        tip: BigInt(1 + Math.floor(rng() * 3)) * 1_000_000_000n });
    }
  }
  return trace;
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

export function simulate(trace, scenario, duration = 600) {
  if (!Number.isInteger(duration) || duration <= 0 ||
      !Number.isInteger(scenario.slotSeconds) || scenario.slotSeconds <= 0 ||
      !Number.isSafeInteger(scenario.gasLimit) || scenario.gasLimit < 2) {
    throw new Error("Positive integer timing and gas limit >= 2 required");
  }
  if (trace.some((tx, i) => tx.arrival < 0 || tx.arrival >= duration ||
      (i > 0 && tx.arrival < trace[i - 1].arrival) ||
      !Number.isSafeInteger(tx.gas) || tx.gas <= 0 || tx.maxFee < 0n || tx.tip < 0n)) {
    throw new Error("Invalid or unsorted trace");
  }
  let base = 10_000_000_000n;
  let cursor = 0;
  let queue = [];
  let gasIncluded = 0;
  const included = [];
  for (let time = scenario.slotSeconds; time <= duration; time += scenario.slotSeconds) {
    while (cursor < trace.length && trace[cursor].arrival <= time) queue.push(trace[cursor++]);
    const effectiveTip = tx => tx.maxFee < base ? -1n :
      (tx.tip < tx.maxFee - base ? tx.tip : tx.maxFee - base);
    queue.sort((a, b) => {
      const aTip = effectiveTip(a), bTip = effectiveTip(b);
      return aTip === bTip ? a.arrival - b.arrival : aTip > bTip ? -1 : 1;
    });
    let used = 0;
    const pending = [];
    for (const tx of queue) {
      if (tx.maxFee < base || used + tx.gas > scenario.gasLimit) {
        pending.push(tx);
        continue;
      }
      const price = base + effectiveTip(tx);
      included.push({ id: tx.id, gas: tx.gas, wait: time - tx.arrival,
        priceGwei: Number(price) / 1e9, feeEth: Number(price * BigInt(tx.gas)) / 1e18 });
      used += tx.gas;
    }
    queue = pending;
    gasIncluded += used;
    base = nextBaseFee(base, used, scenario.gasLimit);
  }
  const pending = [...queue, ...trace.slice(cursor)];
  return {
    scenario: scenario.name, slotSeconds: scenario.slotSeconds, gasLimit: scenario.gasLimit,
    targetGasPerSecond: scenario.gasLimit / 2 / scenario.slotSeconds,
    submitted: trace.length, included: included.length, pending: pending.length,
    completionPct: trace.length ? included.length / trace.length * 100 : 100,
    includedGasPerSecond: gasIncluded / duration,
    p50WaitSeconds: percentile(included.map(tx => tx.wait), 0.5),
    p95WaitSeconds: percentile(included.map(tx => tx.wait), 0.95),
    p50PriceGwei: percentile(included.map(tx => tx.priceGwei), 0.5),
    p50FeeEth: percentile(included.map(tx => tx.feeEth), 0.5),
    p95PendingAgeSeconds: percentile(pending.map(tx => duration - tx.arrival), 0.95),
    finalBaseFeeGwei: Number(base) / 1e9,
  };
}

export function runExperiment() {
  const rows = [];
  for (const workload of ["low", "steady", "burst"]) {
    for (const seed of [42, 2026, 8198]) {
      const trace = makeTrace(workload, 600, seed);
      for (const scenario of scenarios) rows.push({ workload, seed, ...simulate(trace, scenario) });
    }
  }
  return { model: "synthetic-queue-v1", durationSeconds: 600,
    assumptions: "No missed slots, propagation, execution timing, nonces, MEV, blobs or finality. Fixed bids; EIP-1559 per-block fee update unchanged.", rows };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(JSON.stringify(runExperiment(), null, 2) + "\n");
}
