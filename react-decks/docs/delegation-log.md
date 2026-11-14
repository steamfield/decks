# Delegation log

What each Codex run taught us, and the guidance change it led to. The orchestrator appends
an entry after reviewing a run. Guidance itself lives in `../AGENTS.md`; this file is the
evidence behind it, so a rule can be traced to what went wrong and dropped if it stops
earning its place.

| Run | What came back | Guidance change |
| --- | --- | --- |
| `rd-scaffold` | Asked for a simple boundary check; built a 500-line test on TypeScript's unstable compiler API and a 576-line Biome config. Its own review then sent it closing more bypasses. | Proportion: stop at the acceptance; 150-line stop-and-ask; never import an unstable API; review findings beyond the contract go to the orchestrator. |
| `rd-core-nav` | Spec-faithful, clean code. 73 tests for a hash codec, including a `BigInt` path and round-trips for slide `1e21`. | Tests not to write: impossible inputs; dozens of near-identical cases. |
| `rd-core-sync` | Implemented a flawed join protocol faithfully; its Codex reviewer found no defect. Tests asserted `vi.getTimerCount()` and cleared an array before asserting on it. The synchronous test hub could not express the race. | Tests not to write: scheduler internals, clearing evidence, orderly-only scenarios. Contract gained "Before you code" and a reviewer instruction to attack the spec. An independent Claude review stays on every phase. |
| `rd-node` | Asked for missing libraries instead of hand-writing a markdown renderer. Proposed `typescript` as a dependency for export enumeration and a resolver workaround for `@mdx-js/react`; both were design smells with simpler answers. Asked three separate questions. | Proportion: a workaround means ask; ask once, completely. |
| `rd-runtime` | 53 passing tests. Blocked on the boundary check rejecting a type import from `mdx/types`: a fault in the check. Its reviewer found a real spec gap (overview and print cannot hold position). | Boundary check to accept a declared `@types/<name>`. Reviewer spec pass is working; keep it. |
| `rd-core-fix` | Hand QA of four named presenter situations found two more holes in the revised sync spec and asked before changing anything. | Contract QA must name concrete situations to replay; that, not a general instruction to be skeptical, is what surfaces spec flaws. |
| `rd-boundaries` | Asked about `URLSearchParams` under the stricter core config, and proposed `noResolve` to block a type import the boundary test already covers. | Enforce each rule at one layer: imports in the boundary test, globals in the type checker. |
