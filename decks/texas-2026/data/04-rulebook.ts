/**
 * Slide 4: Texas Constitution art. III §1; TEC §§7.021, 7.051-7.055,
 * 11.151 and 39A.111. Read 2026-11-06; see data-sources.md, Slide 4.
 */
export const rulebookSource = 'https://tcss.legis.texas.gov/resources/ED/htm/ED.7.htm'
export const interventionSource = 'https://tcss.legis.texas.gov/resources/ED/htm/ED.39A.htm'
// Plain-language display labels for the legal roles below.
export const rulebookLabels = {
  legislature: 'House and Senate', law: 'Write school law and fund schools',
  governor: 'Governor', appoints: 'Appoints the commissioner',
  senate: 'Senate', confirms: 'Confirms the appointment',
  agency: 'Texas Education Agency', administers: 'Administers school law',
  commissioner: 'Education commissioner', trustees: 'Austin ISD elected board',
  governs: 'Governs the district',
} as const

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
