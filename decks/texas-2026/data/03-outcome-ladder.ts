/**
 * Slide 3: SOS 2026 ballot/returns and Senate incumbent roster, fetched 2026-11-06.
 * data-sources.md records the district crosswalk and corrects the Tribune's 15-seat claim.
 * Rung ordering is the author's public-school-platform judgment, not an empirical rank.
 */
import { senate } from './02-power-board'

// SOS lists these 16 regular-election districts; SD 9 was already Democratic after its special election.
export const senateBallot = [
  { district: 1, incumbent: 'Bryan Hughes', party: 'Republican' },
  { district: 2, incumbent: 'Bob Hall', party: 'Republican' },
  { district: 3, incumbent: 'Robert Nichols', party: 'Republican' },
  { district: 4, incumbent: 'Brett Ligon', party: 'Republican' },
  { district: 5, incumbent: 'Charles Schwertner', party: 'Republican' },
  { district: 9, incumbent: 'Taylor Rehmet', party: 'Democratic' },
  { district: 11, incumbent: 'Mayes Middleton', party: 'Republican' },
  { district: 13, incumbent: 'Borris Miles', party: 'Democratic' },
  { district: 18, incumbent: 'Lois Kolkhorst', party: 'Republican' },
  { district: 19, incumbent: 'Roland Gutierrez', party: 'Democratic' },
  { district: 21, incumbent: 'Judith Zaffirini', party: 'Democratic' },
  { district: 22, incumbent: 'Brian Birdwell', party: 'Republican' },
  { district: 24, incumbent: 'Pete Flores', party: 'Republican' },
  { district: 26, incumbent: 'José Menéndez', party: 'Democratic' },
  { district: 28, incumbent: 'Charles Perry', party: 'Republican' },
  { district: 31, incumbent: 'Kevin Sparks', party: 'Republican' },
] as const

// Derived from the crosswalk: 7 D holdovers + 5 D defenses + 4 R flips = 16.
export const senateMath = {
  total: senate.total, majority: senate.majority, onBallot: senateBallot.length,
  republicanDefenses: senateBallot.filter(seat => seat.party === 'Republican').length,
  democraticDefenses: senateBallot.filter(seat => seat.party === 'Democratic').length,
  democraticBefore: 12, democraticHoldovers: 7,
  netFlipsNeeded: 4, ballotSeatsNeeded: 9, mathematicallyImpossible: false,
  maximumDemocraticSeats: 23, status: 'confirmed',
  assumption: 'Retain all five Democratic ballot seats and seven holdover seats',
} as const

// Counterfactual ballot possibilities; constitutional/statutory school powers are sourced in Slides 4, 8 and 10.
export const outcomeLadder = [
  { rung: 1, outcome: 'No change', lever: 'Existing office control', onBallot: true, status: 'confirmed', kind: 'scenario' },
  { rung: 2, outcome: 'Governor', lever: 'Vetoes and nominations', onBallot: true, status: 'confirmed', kind: 'scenario' },
  { rung: 3, outcome: 'Plus Texas House', lever: 'House passage of school bills', onBallot: true, status: 'confirmed', kind: 'scenario' },
  { rung: 4, outcome: 'Plus Lt. Governor', lever: 'Senate agenda under chamber rules', onBallot: true, status: 'pending', kind: 'scenario' },
  { rung: 5, outcome: 'Plus Attorney General, Comptroller and State Board of Education', lever: 'Litigation, voucher administration and curriculum', onBallot: true, status: 'pending', kind: 'scenario' },
  { rung: 6, outcome: 'Plus Senate majority', lever: 'Majority votes; floor rules still apply', onBallot: true, status: 'confirmed', kind: 'scenario' },
] as const

// Slide 2 results; rung 5 remains conditional on SBOE District 8.
export const reachedRung = { confirmed: 4, provisional: 5, status: 'pending' } as const
// FLAG: author-reported ordering; no model establishes a best attainable outcome or likelihood.
export const ladderJudgment = { status: 'flag', basis: 'author-reported', perspective: 'Hinojosa public-school platform' } as const

// SOS 2026 returns, updated 2026-11-04 16:59, fetched 2026-11-06.
// All eleven races list exactly one Republican and one Democrat; total excludes undervotes.
export const senateMargins = [
  { district: 1, winner: 'Bryan Hughes', winnerVotes: 229545, democraticCandidate: 'Laticia Ambroz', democraticVotes: 91022 },
  { district: 2, winner: 'Bob Hall', winnerVotes: 180363, democraticCandidate: 'Keenen Colbert', democraticVotes: 170824 },
  { district: 3, winner: 'Trent Ashby', winnerVotes: 211888, democraticCandidate: 'Bobby Tillman', democraticVotes: 93016 },
  { district: 4, winner: 'Brett W. Ligon', winnerVotes: 205530, democraticCandidate: 'Ron C. Angeletti', democraticVotes: 147017 },
  { district: 5, winner: 'Charles Schwertner', winnerVotes: 197912, democraticCandidate: 'Paul Thomasson', democraticVotes: 173380 },
  { district: 11, winner: 'Dennis Paul', winnerVotes: 174935, democraticCandidate: 'Shannon Dicely', democraticVotes: 164777 },
  { district: 18, winner: 'Lois W. Kolkhorst', winnerVotes: 196125, democraticCandidate: 'Erica Gillum', democraticVotes: 165093 },
  { district: 22, winner: 'David Cook', winnerVotes: 186433, democraticCandidate: 'Amy Martinez-Salas', democraticVotes: 146611 },
  { district: 24, winner: 'Pete Flores', winnerVotes: 192054, democraticCandidate: 'Joe Paz Herrera', democraticVotes: 147026 },
  { district: 28, winner: 'Charles Perry', winnerVotes: 193190, democraticCandidate: 'Riley Rodriquez', democraticVotes: 83931 },
  { district: 31, winner: 'Kevin Sparks', winnerVotes: 163490, democraticCandidate: 'John Betancourt', democraticVotes: 60021 },
].map(result => {
  const totalVotes = result.winnerVotes + result.democraticVotes
  return { ...result, totalVotes, winnerParty: 'Republican' as const,
    democratOnBallot: true, contested: true,
    marginPp: 100 * (result.winnerVotes - result.democraticVotes) / totalVotes,
    status: 'confirmed' as const, certification: 'pending' as const }
}).sort((a, b) => a.marginPp - b.marginPp || a.district - b.district)

// Derived from the eleven SOS rows; contested means a Democrat opposed the Republican.
// Fourth-closest is the fourth-smallest Republican-minus-Democratic share gap, not a forecast.
export const senateMarginSummary = {
  contestedSeats: senateMargins.filter(result => result.democratOnBallot).length,
  republicanSeatsWon: senateMargins.filter(result => result.winnerVotes > result.democraticVotes).length,
  democraticFlipsWon: senateMargins.filter(result => result.democraticVotes > result.winnerVotes).length,
  fourthClosestDistrict: senateMargins[senateMath.netFlipsNeeded - 1].district,
  fourthClosestMarginPp: senateMargins[senateMath.netFlipsNeeded - 1].marginPp,
  status: 'confirmed', certification: 'pending',
} as const

interface HistoricalSenateResult {
  readonly district: number
  readonly winner: string
  readonly winnerVotes: number | null
  readonly opponent: string | null
  readonly opponentVotes: number | null
  readonly opponentParty: 'Democratic' | 'Libertarian' | null
  readonly otherVotes: number | null
  readonly source: string
}

// 2022 context: TXElectionResults.com compilation attributing SOS; primary archive returned HTTP 403.
// Same eleven district numbers, not all 2022 Republican defenses. SD 3 also had Libertarian
// Desarae Lindsey (3,941 votes). Unopposed placeholders have no usable vote total or margin.
const senateResults2022: readonly HistoricalSenateResult[] = [
  { district: 1, winner: 'Bryan Hughes', winnerVotes: null, opponent: null, opponentVotes: null, opponentParty: null, otherVotes: null, source: 'https://www.txelectionresults.com/2022-general-election/races/19792' },
  { district: 2, winner: 'Bob Hall', winnerVotes: 172713, opponent: 'Prince S. Giadolor', opponentVotes: 106309, opponentParty: 'Democratic', otherVotes: 0, source: 'https://www.txelectionresults.com/2022-general-election/races/3460' },
  { district: 3, winner: 'Robert Nichols', winnerVotes: 213288, opponent: 'Steve Russell', opponentVotes: 58285, opponentParty: 'Democratic', otherVotes: 3941, source: 'https://www.txelectionresults.com/2022-general-election/races/3461' },
  { district: 4, winner: 'Brandon Creighton', winnerVotes: 202341, opponent: 'Misty Bishop', opponentVotes: 86946, opponentParty: 'Democratic', otherVotes: 0, source: 'https://www.txelectionresults.com/2022-general-election/races/3462' },
  { district: 5, winner: 'Charles Schwertner', winnerVotes: 192146, opponent: 'Tommy Estes', opponentVotes: 76317, opponentParty: 'Libertarian', otherVotes: 0, source: 'https://www.txelectionresults.com/2022-general-election/races/3463' },
  { district: 11, winner: 'Mayes Middleton', winnerVotes: null, opponent: null, opponentVotes: null, opponentParty: null, otherVotes: null, source: 'https://www.txelectionresults.com/2022-general-election/races/19793' },
  { district: 18, winner: 'Lois W. Kolkhorst', winnerVotes: 186367, opponent: 'Josh Tutt', opponentVotes: 95287, opponentParty: 'Democratic', otherVotes: 0, source: 'https://www.txelectionresults.com/2022-general-election/races/3471' },
  { district: 22, winner: 'Brian Birdwell', winnerVotes: 190988, opponent: 'Jeremy Schroppel', opponentVotes: 66204, opponentParty: 'Libertarian', otherVotes: 0, source: 'https://www.txelectionresults.com/2022-general-election/races/3475' },
  { district: 24, winner: 'Pete Flores', winnerVotes: 187598, opponent: 'Kathy Jones-Hospod', opponentVotes: 104063, opponentParty: 'Democratic', otherVotes: 0, source: 'https://www.txelectionresults.com/2022-general-election/races/3476' },
  { district: 28, winner: 'Charles Perry', winnerVotes: null, opponent: null, opponentVotes: null, opponentParty: null, otherVotes: null, source: 'https://www.txelectionresults.com/2022-general-election/races/19795' },
  { district: 31, winner: 'Kevin Sparks', winnerVotes: null, opponent: null, opponentVotes: null, opponentParty: null, otherVotes: null, source: 'https://www.txelectionresults.com/2022-general-election/races/20047' },
]

// Vote-share difference uses all valid candidate votes, including the third-party vote in SD 3.
// Null sorts last; a Libertarian runner-up margin is not a Democratic flip margin.
export const senateMargins2022 = senateResults2022.map(result => {
  const totalVotes = result.winnerVotes === null || result.opponentVotes === null || result.otherVotes === null
    ? null : result.winnerVotes + result.opponentVotes + result.otherVotes
  const marginPp = totalVotes === null || result.winnerVotes === null || result.opponentVotes === null
    ? null : 100 * (result.winnerVotes - result.opponentVotes) / totalVotes
  return { ...result, totalVotes, marginPp, winnerParty: 'Republican' as const,
    democratOnBallot: result.opponentParty === 'Democratic',
    contested: result.opponentParty === 'Democratic',
    hasOpponent: result.opponent !== null,
    status: 'confirmed' as const, basis: 'Named SOS compilation; context only' as const }
}).sort((a, b) => (a.marginPp ?? Infinity) - (b.marginPp ?? Infinity) || a.district - b.district)

const democraticContests2022 = senateMargins2022.filter(result => result.democratOnBallot)
// Derived only from the five Democratic contests in this fixed district cohort.
export const senateMarginSummary2022 = {
  contestedSeats: democraticContests2022.length,
  seatsWithAnyOpponent: senateMargins2022.filter(result => result.hasOpponent).length,
  unopposedSeats: senateMargins2022.filter(result => !result.hasOpponent).length,
  fourthClosestDistrict: democraticContests2022[senateMath.netFlipsNeeded - 1].district,
  fourthClosestMarginPp: democraticContests2022[senateMath.netFlipsNeeded - 1].marginPp,
  status: 'confirmed', basis: 'Named SOS compilation; context only',
} as const

