// Build-time loader for the "What you get" file tree: the files `decks init` and
// `decks new my-talk --story` write into an empty project, listed from a real
// run of the package's CLI in a temporary directory on every build, so the tree
// can't drift from what the commands do.
import {
  projectFiles,
  SETUP_COMMANDS,
  withScratchProject,
} from "../../scripts/scratch-project.mjs";

export const setupCommands: string[] = SETUP_COMMANDS;

export const loadProjectFiles = (): string[] => withScratchProject(projectFiles);
