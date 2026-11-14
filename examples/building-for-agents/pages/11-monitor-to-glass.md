<!--
SLIDE 11 · MONITOR TO GLASS: rr monitor's host cards, then the same hosts as StatGlass cards
-->

<MonitorToGlassStage />

<!--
ABOUT THIS SLIDE
Beats 0 and 1 replay a recording of rr monitor snapshots for three hosts, taken on November 2 during one rr test run in OpenData and stopped at a frame where all three hosts hold a lock. The StatGlass cards on beat 2 are illustrative. They draw the same recording's readings in the app's layout, and StatGlass did not record them.
That StatGlass came from watching rr monitor is my own account, and no repo records it.
Source: data-sources.md, Slide 11.

SAY (opening)
rr monitor is a terminal dashboard that ships with rr. It shows one card per host with CPU, memory, latency and the command that holds the host's lock, and it reads all of that over SSH. This is a recording from November 2, taken during an rr test run in OpenData while all three hosts were running tasks. I added the monitor to rr as a debugging aid, and then I noticed it was always open.

[click] rr monitor keeps 600 samples per metric in a ring buffer. It samples once a second by default, so that is ten minutes, and the buffer is in memory, so it is gone when I close the terminal. The questions I kept asking were about earlier in the day, like why the fans were going at three.

[click] StatGlass is the app I built to answer those questions. It is a menu bar app for Apple Silicon Macs that monitors this Mac and other Macs over SSH and stores their history in SQLite. It keeps ten-second buckets for 24 hours, one-minute buckets through seven days and fifteen-minute buckets through 30 days, within a size limit. It used to be called Kelvo. It also reads rr's lock file and shows which job holds each host. The cards on screen are the rr recording drawn in StatGlass's layout.

IF ASKED
Is 30 days guaranteed? History has a size limit. When it is reached, the oldest per-process detail is removed first and the resource charts after that.
Does StatGlass need rr? It monitors any Apple Silicon Mac it can reach over SSH. The rr job is an extra reading on hosts that have an rr lock.
-->
