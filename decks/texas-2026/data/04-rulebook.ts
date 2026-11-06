/**
 * Slide 4: Texas Constitution art. III §1; TEC §§7.021, 7.051-7.055,
 * 11.151 and 39A.111. Read 2026-11-06; see data-sources.md, Slide 4.
 */
// Each link describes the legal allocation of authority, not a direct command chain.
export const rulebook = [
  { actor: 'Texas Legislature', role: 'School law and funding', status: 'confirmed', source: 'Texas Constitution art. III §1' },
  { actor: 'Governor', role: 'Commissioner nomination', status: 'confirmed', source: 'TEC §7.051' },
  { actor: 'Texas Senate', role: 'Commissioner confirmation', status: 'confirmed', source: 'TEC §7.051; Constitution art. IV §12' },
  { actor: 'Texas Education Agency', role: 'School-law administration', status: 'confirmed', source: 'TEC §§7.021, 7.055' },
  { actor: 'Austin ISD elected trustees', role: 'District governance', status: 'confirmed', source: 'TEC §11.151' },
] as const

// Tribune 2026-11-04 identifies Morath as incumbent; TEC requires appointment and Senate consent.
export const commissioner = {
  name: 'Mike Morath', office: 'Commissioner of Education', selection: 'Appointed by the governor; confirmed by the Senate',
  termYears: 4, termBasis: 'Commensurate with the governor’s term', status: 'confirmed', successorStatus: 'pending',
} as const

// TEC §39A.202: managers exercise district governance and suspend trustees' powers.
export const boardOfManagers = { label: 'Board of managers', definition: 'A state-appointed board that replaces elected trustees', status: 'confirmed' } as const
