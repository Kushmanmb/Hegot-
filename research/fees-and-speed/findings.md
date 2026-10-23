# First synthetic findings

These are model outputs, not observations of Ethereum or recommendations for
mainnet. See README.md for assumptions, limitations, and all experiment inputs.

For the burst workload with seed 42, over the same 600-second observation window:

| Scenario | Included (%) | Included wait p95 (seconds) | Included median gas price (gwei) |
| --- | ---: | ---: | ---: |
| 12s baseline | 93.9 | 109.62 | 15.977 |
| 10s equal capacity | 92.4 | 106.88 | 16.163 |
| 6s equal capacity | 88.6 | 129.57 | 18.347 |
| 12s, 25% more capacity | 100.0 | 17.27 | 11.174 |
| 10s, 25% more capacity | 100.0 | 16.30 | 11.087 |
| 6s, 25% more capacity | 100.0 | 16.02 | 10.825 |

This is one illustrative seed, not an aggregate or a statistically established
effect. All three seeds and all workloads are preserved in results.json.

With low demand and seed 42, every transaction was included; p95 wait fell from
11.43 seconds at 12s slots to 5.68 seconds at 6s slots with equal capacity. Under
burst demand, however, shortening slots with the same capacity per second did
not consistently improve included-transaction waiting time or fees.

The model retains EIP-1559's per-block adjustment rate. Shorter slots therefore
change the fee market's response per second. With fixed fee caps, some transactions
become unaffordable and remain pending. Included-only quantiles can hide this.
Warm-up effects also matter because each run begins at the same arbitrary base fee.

The larger-capacity scenarios admit all transactions in this particular burst
run and reduce waiting time. That demonstrates a queue-model response to added
capacity, not whether a real node can safely process that capacity on time.
The model assumes zero missed slots and cannot determine hardware feasibility.

## Next experiment

Before selecting parameters, add controls for fee adjustment per unit time,
warm-up periods, responsive bids, longer windows, and multiple demand intensities.
Investigate existing EIP discussions for any unresolved question these experiments
could help answer. Follow with real-client devnet and network measurements.

No new protocol mechanism or safe activation schedule has been established.
