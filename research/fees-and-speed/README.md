# Ethereum fees and inclusion latency research

Status: independent research concept, October 23, 2026. No assigned EIP number,
official Draft status, network-upgrade inclusion, or novel mechanism is claimed.

## Research question

Under identical synthetic transaction demand, how do shorter slots and increased
execution capacity separately affect fees, inclusion delay, and the pending queue?
The goal is to find evidence for a useful protocol proposal or contribute evidence
to existing proposals. Renaming this app or deploying its sample Solidity contract
does not change Ethereum's protocol.

## Run locally

Requires Node.js 20.18.3 or later. No packages, wallet, RPC, API keys, ETH, or network
access are required for this research harness. From the repository root:

```sh
node --test research/fees-and-speed/simulate.test.mjs
node research/fees-and-speed/simulate.mjs > research/fees-and-speed/results.json
```

The existing Scaffold-ETH application is retained as an optional app sandbox.
Its dependencies are not needed by these commands.

## Experiment design

All values are experiment inputs, not assertions about current mainnet settings.
The baseline is deliberately fixed for reproducibility.

| Scenario | Slot seconds | Block gas limit | Target gas/second |
| --- | ---: | ---: | ---: |
| Baseline | 12 | 60,000,000 | 2,500,000 |
| Equal capacity | 10 | 50,000,000 | 2,500,000 |
| Equal capacity | 6 | 30,000,000 | 2,500,000 |
| 25% more capacity | 12 | 75,000,000 | 3,125,000 |
| 25% more capacity | 10 | 62,500,000 | 3,125,000 |
| 25% more capacity | 6 | 37,500,000 | 3,125,000 |

Each run lasts 600 seconds, begins with an empty queue and 10 gwei base fee, and
reuses the same arrival trace across all six configurations. Three fixed seeds
(42, 2026, 8198) and three demand profiles produce 54 runs. Poisson arrivals are
generated at 12 transactions/second (low), 35 (steady), or 20 with an 80/second
burst from seconds 200 to 400. Gas demand is chosen uniformly from 21,000,
65,000, and 150,000. These represent synthetic fixed execution costs, not EVM
execution. Fee caps are uniformly chosen integer values from 15 to 100 gwei;
priority fee caps are from 1 to 3 gwei and never react to congestion.

Blocks occur at exact slot boundaries. Eligible transactions are selected by
effective tip, with arrival-time tie breaking, skipping any that do not fit.
Gas used equals the synthetic transaction gas demand. The base fee uses the
integer EIP-1559 parent-block update, target half the block gas limit, denominator
8, and minimum 1 wei upward adjustment. No fork-transition block is simulated.

## How to read results

`results.json` records each run independently. Compare matching workload and seed.
Wait quantiles and fee quantiles describe **included transactions only**. Always
read them alongside completion percentage, pending count, and pending-age p95:
excluding transactions that cannot afford inclusion can make a scenario look
artificially fast or cheap. There is no drain period after the observation window.
Gas price is reported in gwei and transaction cost in ETH, without an assumed
ETH/USD exchange rate. Mixed gas sizes also affect median transaction cost.

Shorter slots with the unchanged per-block base-fee rule also change fee
adjustment speed per wall-clock second. Equal throughput therefore does not
isolate pure latency from every fee-market effect. An eventual study should add
fee-response-normalized controls and document any resulting protocol rule change.

## Limits and decision gates

This is a queue and fee-market illustration, not a faithful Ethereum simulator.
It cannot measure missed slots, execution deadlines, propagation, attestation
performance, finality, reorgs, censorship, MEV, state growth, or hardware safety.
It omits account balances, nonces, replacement transactions, access lists, blobs,
L2 fees, and adaptive user/builder behavior. All blocks succeed by assumption.
Results cannot establish safe parameters or forecast mainnet fee savings.

Before proposing activation parameters:

1. Review existing work and identify a specific unresolved problem or mechanism.
2. Calibrate demand, bids, and gas usage against reproducible public-chain data;
   run multiple observation windows and report uncertainty and exclusion bias.
3. Run execution and consensus clients in a devnet with actual transition rules,
   realistic network delays, bursts, missing proposals, and resource measurements.
4. Measure execution/propagation percentiles, missed slots, CPU, RAM, bandwidth,
   state growth, and participation for ordinary home operators. Define acceptance
   thresholds with client maintainers before selecting a winning configuration.
5. Publish negative results and discuss whether to contribute to an existing EIP
   instead of creating a new one. Draft a technical specification only if justified.

## Prior work and authoritative sources

Reviewed October 23, 2026; proposals may change. Follow the specification text,
not just its introductory summary.

- [EIP-1](https://eips.ethereum.org/EIPS/eip-1): scope, community review,
  specifications, security analysis, and consensus-change test requirements.
- [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559): base fee, gas target,
  effective priority fees, and integer base-fee update.
- [EIP-7782](https://eips.ethereum.org/EIPS/eip-7782): Draft slot-time reduction.
  Its specification halves gas limits at the transition; equal-throughput controls
  are essential. This harness is not an implementation of that EIP.
- [EIP-8198](https://eips.ethereum.org/EIPS/eip-8198): Draft variable slot timing
  and an initial ten-second duration, coordinated to maintain throughput per time.
  This harness omits the actual consensus and transition changes.
- [EIP-7938](https://eips.ethereum.org/EIPS/eip-7938): gas-limit growth via default
  client voting, listed as Stagnant and Informational when reviewed. Not an active
  commitment or implemented here.

There is substantial prior work. Combining shorter slots with more capacity is
not, by itself, a novel proposal.
