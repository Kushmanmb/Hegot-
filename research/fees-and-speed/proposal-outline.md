# Research concept: lower fees and inclusion latency

Author: Matthew Brace (@Kushmanmb)

Stage: pre-EIP research. This document is not an official EIP Draft and has no
assigned number. Working project branding is not an Ethereum upgrade name.

## Problem

Congestion can increase transaction costs and waiting times. We want to evaluate
improvements to Ethereum L1 execution capacity and inclusion latency while
preserving the ability of ordinary operators to validate the chain.

## Hypothesis to investigate

A carefully measured combination of shorter slots and increased gas throughput
may improve inclusion delays and fees under some demand conditions. Evidence is
required to establish any benefit, cost, or acceptable parameter choice.

## Scope

Study L1 transaction inclusion and fee-market behavior. Distinguish inclusion
from economic finality. Keep slot duration, gas throughput, and fee-response speed
as separate experimental dimensions. Avoid fixed-dollar fee promises, privileged
transaction classes, or adoption claims.

## Specification

Not yet defined. The six synthetic configurations in README.md are experimental
comparisons, not recommended consensus constants. Before drafting normative rules,
identify the gap left by existing EIPs and specify exact execution/consensus
changes, gas and blob parameter handling, fee response, activation behavior,
integer rounding, and client interoperability.

## Rationale and alternatives

Compare shorter slots alone at equal throughput, increased capacity alone, and
their combination. Evaluate contributing benchmarks to EIP-7782 or EIP-8198,
execution optimizations, and existing scaling research before creating a new EIP.
Layer 2 scaling is relevant context but outside this first L1 simulation.

## Backwards compatibility

Unknown until a mechanism is chosen. Investigate timestamp-sensitive contracts,
RPC assumptions, wallet fee estimation, gas voting, validator deadlines, consensus
economics, blob schedules, and the activation boundary. Do not assume that a
parameter change is compatible or deployable as an ordinary smart contract.

## Security considerations

Evaluate denial-of-service exposure, execution overruns, propagation tails,
state growth, missed attestations, reorg risk, builder concentration, and hardware
centralization. Shorter deadlines or larger workloads can disadvantage smaller
operators. The synthetic model cannot validate these properties.

## Tests and implementation

The accompanying harness tests queue accounting, fee arithmetic, affordability,
capacity controls, and reproducibility. It does not supply client conformance
tests, a fork implementation, or evidence of consensus safety. Those are later
requirements if a concrete protocol change is proposed.

## Next decision

Use the first results to identify limitations and select further experiments.
Seek technical feedback with a narrowly stated question and reproducible evidence.
Do not submit this outline as a finished EIP or request upgrade inclusion yet.
