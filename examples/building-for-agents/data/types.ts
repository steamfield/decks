/** Shapes shared by the data modules and the components that draw them. */

/** A row of a RepoTree. */
export interface TreeNode {
  id: string
  label: string
  /** Indent level, 0 for the tree's top rows. */
  depth: number
  /** One short line shown beside the row when a beat focuses it. */
  note?: string
}

/** A line of a TermPane. See TermPane.vue for what each tone looks like. */
export interface TermLine {
  text: string
  tone?: 'cmd' | 'user' | 'agent' | 'out' | 'ok' | 'fail' | 'warn' | 'muted'
}
