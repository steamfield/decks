export declare const REPO_ROOT: string
export declare const AGENT_DIR: string
export declare const SOURCES: string[]
export declare function renderSource(text: string, name?: string): string
export declare function renderAgent(repoRoot?: string): Map<string, string>
export declare function staleFiles(rendered: Map<string, string>, agentDir?: string): string[]
