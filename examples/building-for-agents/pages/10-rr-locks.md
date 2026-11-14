<!--
SLIDE 10 · RR LOCKS: each rr call is a process that locks a host before it runs tests there
-->

<RrLocksStage />

<!--
ABOUT THIS SLIDE
The diagram is a schematic. It is the simulation of rr's lock rules from rr's own site, and its agents, host names and timings are made up. The strip on the last beat is a recording of the result event from one rr test run in OpenData on November 2.
The simulation's hosts are m4-mini, m1-linux and m1-mini. OpenData's config lists mbp, m4-mini and m1-mini and sets worktree_isolation to false, so the card on beat 3 describes rr's default.
Source: data-sources.md, Slide 10.

SAY (opening)
rr is written in Go. My agents use it all day to run tests. It copies the working tree to another machine with rsync and runs a command there over SSH. This diagram is the simulation from rr's own site, with four agents on one laptop and three hosts. Each rr call is a separate process. rr has no server, and the only state those processes share is a lock directory on each host.

[click] Agent 1 runs rr test, which is a parallel task. I define each shard as a task in the config and list them under parallel in the parent task, because rr does not split a suite on its own. In OpenData, rr test runs eight of those tasks. A parallel run locks every host, copies the files to each one with rsync, and runs the tasks across them.

[click] Agents 2 and 3 start their own runs while agent 1 holds all three locks. A plain run tries the hosts in the order the config lists them and takes the first one it can lock. When every host is locked it waits on the laptop and tries again every two seconds. Before it waits, it prints one JSON event with the status waiting and the command that holds each lock, so an agent reading the output can see its run is queued behind rr test.

[click] When agent 1's run ends, all three locks are released. Agent 2 retries first and locks m4-mini. Agent 3 finds m4-mini locked and takes the next host, m1-linux. Agent 4 starts later, finds the first two hosts locked, and takes m1-mini without waiting. I usually have two to four agents running at once. By default rr syncs each git worktree to its own directory on the host, so two agents' files stay apart.

[click] This is the result event from an rr test run in OpenData on November 2. Five of the eight tasks passed and three failed. rr parses the output of pytest, Go test, Jest and Vitest, and for each failed test it reports the file, the line and the error message. The highlighted line is a Vitest failure at charts-json.test.ts, line 74, and the message under it says a tooltip field named share is missing from the chart's data.

IF ASKED
Is it faster? I have not measured a speedup. rr runs one job per host at a time, so two agents' suites do not compete for the same CPU and ports.
Is this load balancing? rr takes the first host it can lock, in config order. It does not measure load.
Are those your hosts? The names are the simulation's. OpenData's config lists mbp, m4-mini and m1-mini, and it sets worktree_isolation to false so all worktrees share one remote copy.
-->
