/**
 * Slides 1-3: election returns as of 2026-11-06. See data-sources.md, Slide 2.
 * SOS returns were updated 2026-11-04; Tribune reporting distinguishes leads,
 * race calls and certification. These are election outcomes, not current holders.
 */
export type ClaimStatus = 'confirmed' | 'pending' | 'flag'

// Research cutoff requested by the author; all source retrievals used this date.
export const asOf = '2026-11-06' as const
export const electionSource = 'https://electionresults.sos.state.tx.us/results.html'

// Display labels for the sourced results below.
export const evidenceLabels = { pending: 'Pending', scenario: 'Scenario' } as const
export const boardLabels = {
  education: ['State Board', 'of Education'],
  officialSource: 'Source: Texas secretary of state; certification pending.',
  reportingSource: 'Source: Texas Tribune; certification pending.',
  houseSource: 'https://www.texastribune.org/2026/11/03/texas-house-legislature-outcomes-control-republicans-democrats-2026/',
  senateSource: 'https://www.texastribune.org/2026/11/05/texas-senate-republican-majority-lieutenant-governor-powers/',
  educationSource: 'https://www.texastribune.org/2026/11/04/texas-state-board-education-elections-2026/',
} as const

// SOS office rows: each listed Democrat has the largest vote count; canvass pending.
export const statewideOffices = [
  { office: 'Governor', name: 'Gina Hinojosa', party: 'Democratic', votes: 5230789, result: 'Winner in unofficial returns', status: 'confirmed', certification: 'pending' },
  { office: 'Lt. Governor', name: 'Vikki Goodwin', party: 'Democratic', votes: 5083581, result: 'Winner in unofficial returns', status: 'confirmed', certification: 'pending' },
  { office: 'Attorney General', name: 'Nathan Johnson', party: 'Democratic', votes: 5133629, result: 'Winner in unofficial returns', status: 'confirmed', certification: 'pending' },
  { office: 'Comptroller', name: 'Sarah Eckhardt', party: 'Democratic', votes: 5014496, result: 'Winner in unofficial returns', status: 'confirmed', certification: 'pending' },
] as const

// Tribune House report: 83 D / 67 R if remaining leads hold; HD 93 eligibility unresolved.
export const house = {
  office: 'Texas House', total: 150, majority: 76, democratic: 83, republican: 67,
  party: 'Democratic', status: 'pending', majorityStatus: 'confirmed',
  basis: 'Projected split from reported wins and leads', certification: 'pending',
  qualification: 'District 93 eligibility and remaining returns require refresh',
} as const

// Tribune Senate report, 2026-11-05: expected next-session split, not a certified roster.
export const senate = {
  office: 'Texas Senate', total: 31, majority: 16, democratic: 12, republican: 19,
  party: 'Republican', status: 'confirmed', certification: 'pending',
  qualification: 'Johnson and Eckhardt transitions may create vacancies; refresh attendance for any confirmation vote',
} as const

// Tribune SBOE report: seven seats each outside District 8; SOS: Walker 300108, Young 299544.
export const sboe = {
  office: 'State Board of Education', total: 15, democratic: 8, republican: 7,
  party: 'Democratic lead', status: 'pending', certification: 'pending',
  district: 8, leadingCandidate: 'Dana Van de Walker', leadingParty: 'Democratic',
  trailingCandidate: 'Audrey G. Young', trailingParty: 'Republican',
  leadingVotes: 300108, trailingVotes: 299544, margin: 300108 - 299544,
  recount: 'Possible recount; no filed recount verified', recountStatus: 'pending',
} as const

// SOS advisory 2026-28; governor/Lt. Governor also have the legislative canvass under art. IV §3.
export const certification = {
  status: 'pending', label: 'Unofficial returns; certification pending',
  stateCanvassWindow: { start: '2026-11-21', end: '2026-12-07' },
  governorCanvassAuthority: 'Texas Legislature',
} as const
