/**
 * Slide 7: SOS election date, TEA 2026 appeal timeline, 19 TAC §97.1065(d),
 * and Constitution art. IV §4. Fetched 2026-11-06; data-sources.md, Slide 7.
 * A confirmed deadline does not imply that the associated decision has occurred.
 */
import { commissioner } from './04-rulebook'

export interface TimelineEvent {
  readonly id: string
  readonly date: string
  readonly label: string
  readonly actor: string
  readonly status: 'confirmed' | 'reported' | 'pending'
  readonly decisionStatus: 'confirmed' | 'pending'
  readonly basis: 'election' | 'legal' | 'administrative' | 'reported'
  readonly qualification: string
  readonly source: string
}

// Each event cites the source for its ISO date; December 11 is final publication, not a promised appeal-decision day.
export const collisionTimeline = [
  { id: 'election', date: '2026-11-03', label: 'Election', actor: 'Texas voters', status: 'confirmed', decisionStatus: 'confirmed', basis: 'election', qualification: 'Certification pending', source: 'Texas SOS returns' },
  { id: 'petitions', date: '2026-12-01', label: 'Validated petitions due', actor: 'AISD superintendent', status: 'confirmed', decisionStatus: 'pending', basis: 'legal', qualification: 'Submission to TEA after validation; parent collection deadline was October 15', source: '19 TAC §97.1065(d)(1)(C)' },
  { id: 'ratings', date: '2026-12-11', label: 'Final ratings published', actor: 'TEA commissioner', status: 'confirmed', decisionStatus: 'pending', basis: 'administrative', qualification: 'TEA says appeal decisions before this date; publication includes revised year counts', source: 'TEA 2026 A-F Accountability Ratings Appeals Process and Timeline, p. 2' },
  { id: 'trustees', date: '2026-12-15', label: 'Trustee request due', actor: 'AISD trustees', status: 'confirmed', decisionStatus: 'pending', basis: 'legal', qualification: 'Optional alternative action request, approved at a public meeting', source: '19 TAC §97.1065(d)(3)' },
  { id: 'inauguration', date: '2027-01-19', label: 'Inauguration', actor: 'Governor-elect', status: 'confirmed', decisionStatus: 'pending', basis: 'legal', qualification: 'First Tuesday after legislative organization, or as soon thereafter as practicable', source: 'Texas Constitution art. IV §4; LRL January 12 session start' },
  { id: 'order', date: '2027-02-15', label: 'Petition-process order due', actor: 'TEA commissioner', status: 'confirmed', decisionStatus: 'pending', basis: 'legal', qualification: 'Applies after a valid petition and any board request; implementation can be in the following school year', source: '19 TAC §97.1065(d)(5)' },
] as const satisfies readonly TimelineEvent[]

// Austin Politics, 2026-10-31: AISD expects an appeal response around December 10.
export const reportedAppealEstimate = { date: '2026-12-10', label: 'Approximate appeal response', status: 'reported', approximate: true } as const
// TAC §97.1065(d)(1)(A), (d)(4): additional petition-process dates for notes/watch.
export const petitionProcessDates = [
  { date: '2026-10-15', label: 'Parent petition collection deadline', status: 'confirmed', decisionStatus: 'confirmed' },
  { date: '2027-01-30', label: 'Closure plan due if closure requested', status: 'confirmed', decisionStatus: 'pending' },
] as const

// Display strings for the dated events above, shared with the closing timeline.
export const timelineDisplay = {
  district: 'AISD / TEA', governor: 'Governor', commissioner: 'Commissioner',
  commissionerName: commissioner.name,
  pending: 'Pending', reported: 'Reported date', electionStatus: 'Certification pending',
  unchanged: 'Appointment unresolved', governorChange: 'New governor takes office',
  appeal: 'Appeal response expected', order: 'Order due after a valid petition',
  orderTick: 'Order due',
  question: 'Who signs the February order?',
  deadlineMonth: 'December',
  source: 'Sources: TEA deadlines and appeal schedule',
  electionSource: 'Source: Texas election returns',
  inaugurationSource: 'Source: Governor’s constitutional term',
  deadlineSource: 'Source: school intervention deadlines',
  estimateSource: 'Source: district appeal estimate',
  appealsSource: 'TEA appeal schedule', constitutionSource: 'Source: Texas Constitution',
  electionUrl: 'https://electionresults.sos.state.tx.us/results.html',
  inaugurationUrl: 'https://tcss.legis.texas.gov/resources/CN/htm/CN.4.htm',
  ruleUrl: 'https://tea.texas.gov/laws-and-rules/commissioner-rules-tac/coe-tac-currently-effect/ch097ee.pdf',
  appealsUrl: 'https://tea.texas.gov/school-and-district-leaders/accountability/academic-accountability/performance-reporting/2026-appeals-timeline_0.pdf',
  reportUrl: 'https://www.austinpolitics.org/on-my-block/webb-burnet-petition-review-aisd-outside-operators-dobie-linder-pecan-springs',
} as const

// These words describe the pending action, not the established deadline.
export const timelineStatus: Readonly<Record<string, string>> = {
  election: timelineDisplay.electionStatus, petitions: 'Submission pending',
  trustees: 'Request pending', order: 'Order pending',
}
