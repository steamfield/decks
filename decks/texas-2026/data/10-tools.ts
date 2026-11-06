/**
 * Slide 10: Constitution arts. III §§1, 5, 30, IV §§8-10, 12, 14;
 * Government Code §§401.041-.046; TEC §§7.051, 29.352, 39.023, 39A.111, ch. 48.
 * Fetched 2026-11-06. See data-sources.md, Slide 10. Labels identify legal powers.
 */
// These acts can be initiated by the governor; none independently changes an enacted statute.
export const executiveTools = [
  { label: 'Nominate a commissioner', source: 'TEC §7.051; Constitution art. IV §12', qualification: 'Senate confirmation required', status: 'confirmed' },
  { label: 'Veto bills and appropriation items', source: 'Constitution art. IV §14', qualification: 'Legislative override remains possible', status: 'confirmed' },
  { label: 'Propose a budget', source: 'Government Code §§401.041-.046', qualification: 'Legislature appropriates', status: 'confirmed' },
  { label: 'Call special sessions and set their subjects', source: 'Constitution arts. IV §8 and III §40', qualification: 'Legislators must pass the bills', status: 'confirmed' },
  { label: 'Set priorities and recommend policy', source: 'Constitution art. IV §§9-10; TEC §7.055', qualification: 'Commissioner retains statutory duties and authority', status: 'confirmed' },
] as const
// Changing these statutory requirements needs legislation; some implementation discretion already exists.
export const legislativeTools = [
  { label: 'Change the takeover rule', source: 'TEC §39A.111', status: 'confirmed' },
  { label: 'Change statutory testing requirements', source: 'TEC §§39.022-.023', status: 'confirmed' },
  { label: 'Change school-funding formulas', source: 'TEC ch. 48', status: 'confirmed' },
  { label: 'Repeal the voucher program', source: 'TEC §29.352; SB 2 (2025)', status: 'confirmed' },
] as const
// Constitution art. III §30 and art. IV §14; House process guide.
export const billPath = { chambers: ['Texas House', 'Texas Senate'], identicalTextRequired: true, governorAction: 'Signature, no signature, or veto subject to override', status: 'confirmed' } as const
// Art. IV §12(c)-(f): recess appointments have later confirmation requirements and vacancy constraints.
export const recessAppointment = { label: 'Recess appointment', status: 'confirmed', qualification: 'Conditional vacancy route; no blanket exemption from Senate confirmation' } as const
