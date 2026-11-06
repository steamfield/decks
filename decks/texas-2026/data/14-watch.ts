/**
 * Slide 14: AISD public calendar, LRL session calendar, Constitution art. IV §14,
 * and the decisions sourced in Slides 6-10. Retrieved 2026-11-06.
 * Meeting dates are published schedules; actions at those meetings remain pending.
 * Five watch topics are the author's editorial selection, not five scheduled votes.
 */
export { collisionTimeline, petitionProcessDates } from './07-collision-timeline'

// Each date is an AISD calendar event titled Board Information Session or Board Regular Voting Meeting.
export const boardMeetings = [
  { date: '2026-11-05', kind: 'Information session', eventPath: 'board-information-session' },
  { date: '2026-11-12', kind: 'Regular voting meeting', eventPath: 'board-regular-voting-meeting' },
  { date: '2026-12-10', kind: 'Information session', eventPath: 'board-information-session' },
  { date: '2026-12-17', kind: 'Regular voting meeting', eventPath: 'board-regular-voting-meeting' },
  { date: '2027-01-14', kind: 'Information session', eventPath: 'board-information-session' },
  { date: '2027-01-28', kind: 'Regular voting meeting', eventPath: 'board-regular-voting-meeting' },
  { date: '2027-02-11', kind: 'Information session', eventPath: 'board-information-session' },
  { date: '2027-02-25', kind: 'Regular voting meeting', eventPath: 'board-regular-voting-meeting' },
].map(meeting => ({ ...meeting, time: '18:00', timeZone: 'America/Chicago', status: 'confirmed' as const,
  source: `https://www.austinisd.org/calendar/events/${meeting.date.replaceAll('-', '/')}/${meeting.eventPath}` }))

// LRL 90th Legislature calendar; ordinary bill deadline is day 60, with emergency/local/rule exceptions.
export const sessionMilestones = [
  { date: '2027-01-12', label: 'Regular session begins', status: 'confirmed', basis: 'Texas Constitution art. III §5; LRL session calendar' },
  { date: '2027-03-12', label: 'Ordinary bill filing deadline', status: 'confirmed', basis: 'Day 60; Horseshoe Bay legislative calendar; exceptions and adopted rules apply' },
  { date: '2027-05-31', label: 'Sine die', status: 'confirmed', basis: 'Day 140; Texas Constitution art. III §24; LRL session calendar' },
  { date: '2027-06-20', label: 'Post-session governor action deadline', status: 'confirmed', basis: '20 days after adjournment under Texas Constitution art. IV §14 for bills covered by that provision' },
] as const

// Source-outline Slide 24, consolidated into five watch topics; authorities are sourced in the ledger.
export const decisionsToWatch = [
  { id: 'ratings-petitions', name: 'Appeals and petition validity', actors: ['TEA commissioner', 'AISD superintendent', 'Parents'], status: 'pending' },
  { id: 'intervention', name: 'Intervention remedy and timing', actors: ['TEA commissioner', 'AISD trustees'], status: 'pending' },
  { id: 'commissioner', name: 'Commissioner transition', actors: ['Governor', 'Texas Senate'], status: 'pending' },
  { id: 'senate', name: 'Senate rules and committees', actors: ['Texas senators', 'Lt. Governor'], status: 'pending' },
  { id: 'legislation', name: 'Education laws and funding', actors: ['Texas House', 'Texas Senate', 'Governor'], status: 'pending' },
] as const
// Derived from the author-selected list above; the window ends in June, not a legal deadline for all five decisions.
export const watchCount = decisionsToWatch.length
export const watchSelectionStatus = { status: 'flag', basis: 'author-reported editorial selection' } as const
// FLAG: author must supply the published sources page before a QR can be generated.
export const sourcesPage = { url: null, status: 'flag', needed: 'Published URL for the deck source ledger' } as const
