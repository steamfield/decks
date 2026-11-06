/**
 * Slide 8: Constitution arts. IV §12, XV §9, XVI §17; TEC §§7.051-.053.
 * Tribune Senate-rules report and KPRC Harrison report, 2026-11-05.
 * All opened 2026-11-06; data-sources.md, Slide 8.
 */
import { senate } from './02-power-board'
export { senate }

// Art. IV §12 requires two-thirds of senators PRESENT; 21 assumes all 31 present.
export const confirmation = {
  present: senate.total, numerator: 2, denominator: 3,
  required: Math.ceil(senate.total * 2 / 3),
  otherVotesNeeded: Math.ceil(senate.total * 2 / 3) - senate.democratic,
  status: 'confirmed', voteStatus: 'pending', assumption: 'All 31 present; all 12 Democrats support the nominee',
} as const

// Art. XVI §17(a): continue duties until successor qualifies; lawful vacancy/removal can alter this.
export const holdover = { name: 'Mike Morath', label: 'Holds over until a successor qualifies', status: 'confirmed', departureStatus: 'pending' } as const
// Art. XV §9 says the governor who appointed the officer; §7.053 incorporates that route.
export const removal = {
  label: 'Removal requires a lawful route', consent: 'Two-thirds of senators present',
  appointingGovernor: 'Greg Abbott', incomingGovernor: 'Gina Hinojosa',
  status: 'flag', issue: 'No legal determination establishes that the incoming governor can use the appointing-governor removal route',
} as const
// Tribune: rules-based powers may change; constitutional Senate presidency remains under art. IV §16.
export const senateRules = {
  label: 'Senate rules and committee leadership', actor: 'Texas senators',
  affectedOffice: 'Lt. Governor', affectedName: 'Vikki Goodwin',
  status: 'pending', reportDate: '2026-11-05', enactmentVerified: false,
} as const
// KPRC quotes Harrison's November 4 call; art. IV §8 gives the governor the convening power.
export const specialSessionProposal = {
  proposer: 'Rep. Brian Harrison', party: 'Republican', date: '2026-11-04',
  subject: 'Limit gubernatorial emergency powers', decisionMaker: 'Gov. Greg Abbott',
  proposalStatus: 'confirmed', sessionStatus: 'pending', enactedStatus: 'pending',
} as const

// Display labels for the qualified claims above; source URLs match the Slide 8 ledger.
export const arcLabels = {
  democratic: 'Democrats', republican: 'Republicans', gap: 'Republican votes needed',
  expected: 'Expected Senate', certification: 'Pending: certification',
  pending: 'Pending', scenario: 'Scenario',
  majority: 'Majority', confirmation: 'Confirmation',
  tenure: 'departure date', rules: 'Committee and agenda rules',
  departureStatus: 'Pending: departure date unknown', ruleStatus: 'Pending: rule changes unverified',
  source: 'https://tcss.legis.texas.gov/resources/CN/htm/CN.4.htm',
  holdoverSource: 'https://tcss.legis.texas.gov/resources/CN/htm/CN.16.htm',
  rulesSource: 'https://www.texastribune.org/2026/11/05/texas-senate-republican-majority-lieutenant-governor-powers/',
} as const
