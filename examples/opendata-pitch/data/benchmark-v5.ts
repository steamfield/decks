/**
 * Slide 6d: the Phase 1 app benchmark. Thirty questions against two arms of
 * Claude Sonnet 5 on claude.ai, 2026-09-19. Arm `app-web` is web search plus a
 * code sandbox and no connector; arm `app-mcp` is the same model with the
 * OpenData MCP connector attached. One fresh chat per question, one run per
 * arm. Provenance for every figure on the slide is in `data-sources.md` under
 * "Slide 6d: Benchmark".
 *
 * Sources, all committed in this repo:
 *
 * - `bench/results/phase1-v5-combined-review.csv` hand grades, bank v5, the grade of record
 * - `bench/results/phase1-v5-combined-results.jsonl` wall clock and tool calls, bank v5
 * - `bench/questions/phase1-v5.jsonl` difficulty, bank v5
 * - `bench/results/phase1-claude-1-review.csv` plus
 *   `bench/results/phase1-claude-1-superseded-v41-review.csv` hand grades, bank v4.1, 60 rows together
 * - `bench/results/phase1-claude-1-results.jsonl` plus
 *   `bench/results/phase1-claude-1-superseded-v41-results.jsonl` wall clock and tool calls, bank v4.1
 * - `bench/questions/phase1.jsonl` difficulty, bank v4.1
 * - the Phase 1 benchmark report (`BENCHMARK_URL`) sections 2, 5 and 9, for v5
 * - the v4.1 revision of the same report
 *
 * `V5_TABLE` was emitted with this, run from the repo root. `V41_TABLE` came
 * from the same command with the two `phase1-claude-1*` review CSVs, the two
 * matching `*-results.jsonl` files and `bench/questions/phase1.jsonl`
 * substituted in:
 *
 *   python3 -c "
 *   import csv, json
 *   NINE = {'p1-004','p1-007','p1-008','p1-013','p1-016','p1-017','p1-018','p1-020','p1-021'}
 *   CODE = {'CORRECT': 'C', 'INCORRECT': 'X', 'NOT_ATTEMPTED': 'N'}
 *   g = {(r['arm'], r['question_id']): r['hand_grade']
 *        for r in csv.DictReader(open('bench/results/phase1-v5-combined-review.csv'))}
 *   res = {(json.loads(l)['arm'], json.loads(l)['question_id']): json.loads(l)
 *          for l in open('bench/results/phase1-v5-combined-results.jsonl')}
 *   d = {json.loads(l)['id']: json.loads(l)['difficulty']
 *        for l in open('bench/questions/phase1-v5.jsonl')}
 *   for i in sorted({q for _, q in g}):
 *       w, m = res[('app-web', i)], res[('app-mcp', i)]
 *       ws = sum(1 for t in w['tool_calls'] if t['name'] == 'web_search')
 *       ms = sum(1 for t in m['tool_calls'] if t['name'] == 'web_search')
 *       print('%-8s %-7s %s  %s %s %8.1f %7.1f %4d %4d %4d %4d %4d %4d %4d' % (
 *             i, d[i], '*' if i in NINE else '.',
 *             CODE[g[('app-web', i)]], CODE[g[('app-mcp', i)]],
 *             w['wall_clock_s'], m['wall_clock_s'],
 *             len(w['tool_calls']), w['sandbox_calls'], ws,
 *             len(m['tool_calls']), m['opendata_tool_calls'],
 *             m['sandbox_calls'], ms))
 *   "
 *
 * Seconds are the only rounded field, to a tenth. Every constant below is
 * computed from the rows rather than typed, so a re-emit moves the slide.
 *
 * The `*` column marks the nine items rewritten for v5 to need what a data
 * catalog does, and tested against the web arm until they did (report section
 * 9): p1-004, 007, 008, 013, 016, 017, 018, 020 and 021. They keep their ids
 * on both banks. The slide does not tell that story, but the flag stays on the
 * rows so the counts that depend on it can be derived rather than typed.
 */

export type Grade = 'CORRECT' | 'INCORRECT' | 'NOT_ATTEMPTED'

export interface Outcome {
  id: string
  difficulty: 'easy' | 'medium' | 'hard'
  /** One of the nine rewritten for v5. */
  rewritten: boolean
  web: Grade
  mcp: Grade
  webS: number
  mcpS: number
  /** Tool calls the web arm made in that chat, and how many were sandbox commands. */
  webTools: number
  webSandbox: number
  webSearch: number
  /**
   * Tool calls the connector arm made, and the same three splits as the web
   * arm: OpenData calls, sandbox commands, web searches. The last two are zero
   * on every v5 row, which is the finding rather than an assumption, so they
   * are carried as columns and summed like the rest.
   */
  mcpTools: number
  mcpOpenData: number
  mcpSandbox: number
  mcpSearch: number
}

/**
 * Bank v5, the hardened bank. Columns:
 * `id difficulty nine web mcp webS mcpS webTools webSandbox webSearch mcpTools
 * mcpOpenData mcpSandbox mcpSearch`.
 */
const V5_TABLE = `
p1-001   easy    .  C C     65.5    20.3   11    6    4    5    3    0    0
p1-002   medium  .  X C    366.5    17.5   41   29    6    4    2    0    0
p1-003   medium  .  N C      8.9    18.2    0    0    0    4    3    0    0
p1-004   medium  *  N C     61.0   126.0    5    0    3   15   14    0    0
p1-005   easy    .  C C     32.2    17.0    4    4    0    4    3    0    0
p1-006   easy    .  N C     56.1    21.4    9    0    7    5    3    0    0
p1-007   medium  *  N X    500.5    65.4   45   37    3   10    9    0    0
p1-008   medium  *  N C     55.1    26.9    8    4    2    5    3    0    0
p1-009   medium  .  N X     10.6    25.3    1    0    1    4    3    0    0
p1-010   medium  .  N C    898.8    46.0   50   41    7    8    5    0    0
p1-011   hard    .  N C     10.3    64.2    1    0    1    7    6    0    0
p1-012   hard    .  N C     37.7    26.8    7    0    5    5    4    0    0
p1-013   hard    *  N X     54.7   227.2    5    0    1   22   21    0    0
p1-014   hard    .  X C   1211.0   173.5   27   21    3   12   11    0    0
p1-015   medium  .  N C    425.5    34.5   50   47    3    6    5    0    0
p1-016   medium  *  N C   1509.0    63.0   50   47    2   11   10    0    0
p1-017   hard    *  X C   1463.4    61.6   29   18    8    8    7    0    0
p1-018   hard    *  X C    540.1    49.9   41   23    8    5    4    0    0
p1-019   hard    .  N C      8.8    31.3    1    0    1    5    4    0    0
p1-020   hard    *  N C   1959.9   130.2   19   19    0   11   10    0    0
p1-021   hard    *  N X    335.9   185.1   26   22    2   22   21    0    0
p1-022   hard    .  X C    449.8    34.4   45   34    8    6    4    0    0
p1-023   hard    .  N C     14.9    54.5    2    0    1    7    6    0    0
p1-024   hard    .  C C    285.7    36.3   17   13    3    6    4    0    0
p1-025   hard    .  C C    108.2    41.3   12   12    0    5    4    0    0
p1-026   hard    .  X X    210.7    74.1   22   15    4   10    8    0    0
p1-027   medium  .  C C     32.2    17.2    4    0    4    3    2    0    0
p1-028   medium  .  X C     11.0    17.7    1    0    1    3    2    0    0
p1-029   easy    .  X C     39.9    32.6    7    0    5    6    1    0    3
p1-030   easy    .  C C     10.3    23.7    1    0    1    4    2    0    0
`

/**
 * Bank v4.1: the bank neither arm was iterated against, run before the hard
 * tier was rebuilt and with no ten minute cap in force. Same thirty ids, same
 * two arms, same columns as `V5_TABLE`.
 */
const V41_TABLE = `
p1-001   easy    .  C C     65.5    20.3   11    6    4    5    3    0    0
p1-002   medium  .  X C    366.5    17.5   41   29    6    4    2    0    0
p1-003   medium  .  N C      8.9    18.2    0    0    0    4    3    0    0
p1-004   medium  *  C C     48.9    23.2    8    4    3    5    4    0    0
p1-005   easy    .  C C     32.2    17.0    4    4    0    4    3    0    0
p1-006   easy    .  N C     56.1    21.4    9    0    7    5    3    0    0
p1-007   medium  *  C C     80.5    22.4   11    6    3    5    3    0    0
p1-008   medium  *  C C     83.4    23.8    9    4    3    4    3    0    0
p1-009   medium  .  N X     10.6    25.3    1    0    1    4    3    0    0
p1-010   medium  .  N C    898.8    46.0   50   41    7    8    5    0    0
p1-011   hard    .  N C     10.3    64.2    1    0    1    7    6    0    0
p1-012   hard    .  N C     37.7    26.8    7    0    5    5    4    0    0
p1-013   hard    *  C C    430.8    37.8   29   21    5    5    4    0    0
p1-014   hard    .  X C   1211.0   173.5   27   21    3   12   11    0    0
p1-015   medium  .  N C    425.5    34.5   50   47    3    6    5    0    0
p1-016   medium  *  C X     63.3    48.1    9    7    2    9    8    0    0
p1-017   hard    *  C C    441.3    51.5   22   17    3    7    6    0    0
p1-018   hard    *  C C    544.0    21.7   29   21    5    5    3    0    0
p1-019   hard    .  N C      8.8    31.3    1    0    1    5    4    0    0
p1-020   hard    *  C C     89.1    26.9   15    8    3    4    3    0    0
p1-021   hard    *  C C     81.0   144.7   13    4    6   23   19    0    3
p1-022   hard    .  X C    449.8    34.4   45   34    8    6    4    0    0
p1-023   hard    .  N C     14.9    54.5    2    0    1    7    6    0    0
p1-024   hard    .  C C    285.7    36.3   17   13    3    6    4    0    0
p1-025   hard    .  C C    108.2    41.3   12   12    0    5    4    0    0
p1-026   hard    .  X X    210.7    74.1   22   15    4   10    8    0    0
p1-027   medium  .  C C     32.2    17.2    4    0    4    3    2    0    0
p1-028   medium  .  X C     11.0    17.7    1    0    1    3    2    0    0
p1-029   easy    .  X C     39.9    32.6    7    0    5    6    1    0    3
p1-030   easy    .  C C     10.3    23.7    1    0    1    4    2    0    0
`

const GRADES: Record<string, Grade> = { C: 'CORRECT', X: 'INCORRECT', N: 'NOT_ATTEMPTED' }

function parse(table: string): Outcome[] {
  return table
    .trim()
    .split('\n')
    .map((line) => {
      const f = line.trim().split(/\s+/)
      return {
        id: f[0],
        difficulty: f[1] as Outcome['difficulty'],
        rewritten: f[2] === '*',
        web: GRADES[f[3]],
        mcp: GRADES[f[4]],
        webS: Number(f[5]),
        mcpS: Number(f[6]),
        webTools: Number(f[7]),
        webSandbox: Number(f[8]),
        webSearch: Number(f[9]),
        mcpTools: Number(f[10]),
        mcpOpenData: Number(f[11]),
        mcpSandbox: Number(f[12]),
        mcpSearch: Number(f[13]),
      }
    })
}

/** Thirty rows, bank v5. */
export const OUTCOMES: Outcome[] = parse(V5_TABLE)

/** Thirty rows, bank v4.1. */
export const V41_OUTCOMES: Outcome[] = parse(V41_TABLE)

/**
 * The v5 protocol cap: a chat was abandoned once it passed ten minutes. A few
 * capped chats carry a larger wall clock because the tab was left to finish,
 * so the cap is the threshold to count against, not the tail.
 */
export const CAP_S = 600

/* ── Derived figures. Nothing below is typed; every value is read off the rows. ── */

const correct = (rows: Outcome[], arm: 'web' | 'mcp') =>
  rows.filter((row) => row[arm] === 'CORRECT').length

const total = (rows: Outcome[], field: keyof Outcome) =>
  rows.reduce((sum, row) => sum + (row[field] as number), 0)

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Questions in the bank. */
export const N = OUTCOMES.length
export const WEB_CORRECT = correct(OUTCOMES, 'web')
export const MCP_CORRECT = correct(OUTCOMES, 'mcp')

/* ── Time: how long the thirty chats took, per arm ── */

/** Median seconds from the first human message to the last assistant block. */
export const WEB_MEDIAN_S = Math.round(median(OUTCOMES.map((row) => row.webS)))
export const MCP_MEDIAN_S = Math.round(median(OUTCOMES.map((row) => row.mcpS)))

/** Total chat time across all thirty, in whole minutes. */
export const WEB_TOTAL_MIN = Math.round(total(OUTCOMES, 'webS') / 60)
export const MCP_TOTAL_MIN = Math.round(total(OUTCOMES, 'mcpS') / 60)

/* ── Effort: what the two arms did with that time ── */

export const WEB_TOOL_CALLS = total(OUTCOMES, 'webTools')
export const MCP_TOOL_CALLS = total(OUTCOMES, 'mcpTools')
export const WEB_SANDBOX_CALLS = total(OUTCOMES, 'webSandbox')
export const MCP_SANDBOX_CALLS = total(OUTCOMES, 'mcpSandbox')
export const WEB_SEARCHES = total(OUTCOMES, 'webSearch')
export const MCP_SEARCHES = total(OUTCOMES, 'mcpSearch')
export const MCP_OPENDATA_CALLS = total(OUTCOMES, 'mcpOpenData')
/** Structural, not measured: the web arm ran with no connector attached. */
export const WEB_OPENDATA_CALLS = 0

/** Chats in which the web arm spun up a sandbox at all. */
export const WEB_SANDBOX_CHATS = OUTCOMES.filter((row) => row.webSandbox > 0).length

/** Chats the web arm ended without producing a figure at all. */
export const WEB_NO_ANSWER = OUTCOMES.filter((row) => row.web === 'NOT_ATTEMPTED').length

/** Web chats that ran past the ten minute cap. */
export const WEB_CAP_HITS = OUTCOMES.filter((row) => row.webS >= CAP_S).length
export const MCP_CAP_HITS = OUTCOMES.filter((row) => row.mcpS >= CAP_S).length

/* ── The nine rewritten for v5. Not on the slide; kept for the page and Q&A ── */

const NINE = OUTCOMES.filter((row) => row.rewritten)
export const NINE_N = NINE.length
export const NINE_WEB = correct(NINE, 'web')
export const NINE_MCP = correct(NINE, 'mcp')
export const NINE_MEDIAN_WEB_S = Math.round(median(NINE.map((row) => row.webS)))
export const NINE_MEDIAN_MCP_S = Math.round(median(NINE.map((row) => row.mcpS)))

/* ── Bank v4.1: never iterated against either arm, and no cap in force ── */

/*
 * Nothing on the slide renders anything in this section. It was a subtitle
 * under the headline until 2026-09-19, when the line came off for being
 * unreadable to an audience that has never heard of a bank version. The block
 * stays computed because the figures are the answer to "what about the bank
 * you did not tune against", which is the first question this slide invites;
 * `data-sources.md` under "Slide 6d" carries the same numbers in prose.
 */

export const V41_WEB_CORRECT = correct(V41_OUTCOMES, 'web')
export const V41_MCP_CORRECT = correct(V41_OUTCOMES, 'mcp')

const V41_BOTH_RIGHT = V41_OUTCOMES.filter((row) => row.web === 'CORRECT' && row.mcp === 'CORRECT')
export const V41_BOTH_RIGHT_N = V41_BOTH_RIGHT.length

/**
 * The one ratio the report clears for a slide, and it is speed rather than
 * accuracy. The v4.1 report states it as "a median of 3.3 times faster per
 * item" on the items both arms got right, so the arithmetic is the median of
 * the per-item ratios: not the ratio of the two medians, which is 3.5, and not
 * the ratio of the two totals, which is 4.6. That reproduces the report's 3.3
 * from the rows above. Report text: the v4.1 revision of the
 * Phase 1 report, "Time and effort".
 */
export const V41_FASTER =
  Math.round(median(V41_BOTH_RIGHT.map((row) => row.webS / row.mcpS)) * 10) / 10

/* ── Phase 0: the same question shape through a bare API agent ─────────────
 *
 * DeepSeek V4 Flash through OpenRouter at temperature 0, same model and same
 * prompt in three arms, only the tool list differing: `none`, `web` (an Exa
 * snippet plugin plus a bare python sandbox) and `mcp` (the OpenData MCP
 * server). Bank v0, one run. Source rows are
 * `bench/results/phase0-full-1-grades.jsonl` (90 rows, real `cost_usd` per
 * row) and the write-up is the Phase 0 report ("The headline" and "What it
 * cost").
 *
 * This is the one place in the benchmark that was billed per token, so it is
 * the only place a dollar figure is quotable: Phase 1 ran on a subscription
 * seat, where `cost_usd` is hardcoded 0.
 *
 * Grades are the judge's, with the one hand correction the report's
 * "The hand-check" section records: web p0-027 names Austin at "27% more
 * evictions than its baseline" against a gold of 126.8% of baseline, the judge
 * flipped it between two passes on identical input, and the hand grade carries
 * it as CORRECT. That single flip is why the web arm is 8 of 30 by hand and 7
 * by machine. `PHASE0_TABLE` was emitted with this, run from the repo root:
 *
 *   python3 -c "
 *   import json
 *   CODE = {'CORRECT': 'C', 'INCORRECT': 'X', 'NOT_ATTEMPTED': 'N'}
 *   HAND = {('web', 'p0-027'): 'CORRECT'}
 *   rows = [json.loads(l) for l in open('bench/results/phase0-full-1-grades.jsonl')]
 *   by = {(x['arm'], x['question_id']): x for x in rows}
 *   for i in sorted({x['question_id'] for x in rows}):
 *       g = [CODE[HAND.get((a, i), by[(a, i)]['grade'])] for a in ('none', 'web', 'mcp')]
 *       c = [by[(a, i)]['cost_usd'] for a in ('none', 'web', 'mcp')]
 *       print('%-8s %s %s %s %9.5f %9.5f %9.5f' % (i, g[0], g[1], g[2], c[0], c[1], c[2]))
 *   "
 */

/** `id noneGrade webGrade mcpGrade noneCost webCost mcpCost`, dollars. */
const PHASE0_TABLE = `
p0-001   X N C   0.00046   0.22514   0.00127
p0-002   X X X   0.00002   0.00710   0.00081
p0-003   C C C   0.00003   0.00712   0.00145
p0-004   X X C   0.00003   0.21718   0.00147
p0-005   X C C   0.00052   0.18674   0.00306
p0-006   X X C   0.00010   0.00709   0.00135
p0-007   X C C   0.00040   0.00729   0.00083
p0-008   C C C   0.00010   0.07820   0.00062
p0-009   X N C   0.00006   0.23510   0.00055
p0-010   X X C   0.00014   0.00712   0.00203
p0-011   X X X   0.00119   0.00711   0.00901
p0-012   X N C   0.00018   0.22678   0.00086
p0-013   N N C   0.00087   0.22443   0.00367
p0-014   X C C   0.00141   0.00708   0.00131
p0-015   X N C   0.00025   0.21336   0.00087
p0-016   C X C   0.00024   0.06701   0.00205
p0-017   C N C   0.00011   0.21342   0.00029
p0-018   X N X   0.00014   0.21316   0.00075
p0-019   X X X   0.00007   0.01422   0.00432
p0-020   X X C   0.00064   0.01443   0.00242
p0-021   X N C   0.00025   0.23425   0.00537
p0-022   X C C   0.00030   0.00717   0.00102
p0-023   X N X   0.00014   0.25274   0.00296
p0-024   X N X   0.00027   0.22678   0.00117
p0-025   X X C   0.00011   0.00738   0.00115
p0-026   X N N   0.00019   0.25517   0.01169
p0-027   X C X   0.00090   0.12740   0.00312
p0-028   X C C   0.00011   0.03641   0.00134
p0-029   C N C   0.00073   0.23507   0.00345
p0-030   X X N   0.00007   0.01449   0.01875
`

interface Phase0Row {
  id: string
  grade: { none: Grade; web: Grade; mcp: Grade }
  cost: { none: number; web: number; mcp: number }
}

export type Phase0Arm = 'none' | 'web' | 'mcp'

export const PHASE0_ROWS: Phase0Row[] = PHASE0_TABLE.trim()
  .split('\n')
  .map((line) => {
    const f = line.trim().split(/\s+/)
    return {
      id: f[0],
      grade: { none: GRADES[f[1]], web: GRADES[f[2]], mcp: GRADES[f[3]] },
      cost: { none: Number(f[4]), web: Number(f[5]), mcp: Number(f[6]) },
    }
  })

export const PHASE0_N = PHASE0_ROWS.length

const phase0Correct = (arm: Phase0Arm) =>
  PHASE0_ROWS.filter((row) => row.grade[arm] === 'CORRECT').length
const phase0Cost = (arm: Phase0Arm) => PHASE0_ROWS.reduce((sum, row) => sum + row.cost[arm], 0)

/** Correct of 30 per arm, hand grade: 5, 8 and 21. */
export const PHASE0_CORRECT: Record<Phase0Arm, number> = {
  none: phase0Correct('none'),
  web: phase0Correct('web'),
  mcp: phase0Correct('mcp'),
}

/** Real OpenRouter spend for the 30 chats, per arm, in dollars. */
export const PHASE0_COST: Record<Phase0Arm, number> = {
  none: phase0Cost('none'),
  web: phase0Cost('web'),
  mcp: phase0Cost('mcp'),
}

/** Dollars of model spend per correct answer, per arm. */
export const PHASE0_PER_CORRECT: Record<Phase0Arm, number> = {
  none: phase0Cost('none') / phase0Correct('none'),
  web: phase0Cost('web') / phase0Correct('web'),
  mcp: phase0Cost('mcp') / phase0Correct('mcp'),
}

/**
 * A dollar figure at the precision it can carry: the web arm's 0.447 reads as
 * "$0.45", the MCP arm's 0.00424 as "$0.004". Two significant figures would
 * print the MCP arm as 0.0042, which is more precision than one run of one
 * cheap model supports.
 */
export function phase0Dollars(value: number): string {
  return value >= 0.1 ? value.toFixed(2) : value.toFixed(3)
}

/** The model and harness the Phase 0 figures come from, for the stage label. */
export const PHASE0_MODEL = 'DeepSeek V4 Flash'

/** The public write-up of this run, linked at the bottom of the slide. */
export const BENCHMARK_URL = 'https://tryopendata.ai/benchmarks/claude-sonnet-5-opendata-connector'
