import { DUR, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { SRC_FILES, SRC_LINES, TREE } from "../data/05-stacks-tour";
import {
  APP_LAYER,
  ERROR_TABLE,
  HOST_SERVICE,
  LAYER_TEST,
  RUNS_COMMAND,
} from "../data/code/05-stacks";
import type { Excerpt } from "../data/code/types";
import { CodePane } from "./CodePane";
import { OFF, ON } from "./design";
import { NamePlate } from "./NamePlate";
import { RepoTree } from "./RepoTree";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "Every run starts in three files.",
    body: "bin.ts imports from Node, main.ts maps errors to exit codes, and cli.ts builds the command tree.",
  },
  {
    lead: "Each command is one file.",
    body: "It declares its flags, calls the core, and lists its exit codes in the help text.",
  },
  {
    lead: "A service class includes its test double.",
    body: "Host.layer wraps the real process and Host.memory is the fake the tests use.",
  },
  {
    lead: "One function composes the layers.",
    body: "It adds config, output, logging and processes, and the tests call the same function.",
  },
  {
    lead: "Each error has one row in a table.",
    body: "The row sets its exit code and whether a retry can work. A missing row fails the build.",
  },
  {
    lead: "Tests replace a layer with a fake.",
    body: "This test swaps in an HTTP client that returns 503, then checks the JSON error.",
  },
];

interface Step {
  focus: string;
  lit: readonly string[];
  excerpt?: Excerpt;
  lines?: readonly (readonly [number, number])[];
}

const STEPS: readonly Step[] = [
  { focus: "", lit: ["bin", "main", "cli"] },
  { focus: "commands", lit: ["cli"], excerpt: RUNS_COMMAND, lines: [[2, 5]] },
  { focus: "services", lit: ["commands"], excerpt: HOST_SERVICE, lines: [[1, 4]] },
  { focus: "runtime", lit: ["bin", "services"], excerpt: APP_LAYER, lines: [[6, 9]] },
  { focus: "errors", lit: ["main"], excerpt: ERROR_TABLE, lines: [[12, 12]] },
  {
    focus: "tests",
    lit: ["services"],
    excerpt: LAYER_TEST,
    lines: [
      [8, 8],
      [11, 17],
    ],
  },
];

const TREE_BOX = { x: 110, y: 196, width: 680 };
const CODE_BOX = { x: 840, y: 196, width: 970, height: 746 };
const root = `packages/cli/src · ${SRC_FILES} files · ${SRC_LINES.toLocaleString("en-US")} lines`;

export function StacksTourStage() {
  const s = useTween({ tree: OFF, code: OFF, step: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { tree: ON, duration: DUR.scale, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { code: ON, duration: DUR.card, ease: SETTLE });
      beat(1);
      // Focus and excerpt follow the click, including when stepping backward.
      for (let n = 2; n < STEPS.length; n++) {
        tl.to(s, { step: n, duration: DUR.card, ease: "none" });
        beat(n);
      }
    },
  });
  const step = STEPS[Math.min(Math.max(clicks, 0), STEPS.length - 1)];
  if (!step) throw new Error(`No Stacks tour step for click ${clicks}`);
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">The Stacks CLI is written with Effect.</h2>
          <NamePlate id="stacks" chipOnly />
          <RepoTree
            nodes={TREE}
            lit={step.lit}
            focus={step.focus}
            reveal={s.tree}
            {...TREE_BOX}
            root={root}
          />
          {step.excerpt && (
            <CodePane excerpt={step.excerpt} focus={step.lines} progress={s.code} {...CODE_BOX} />
          )}
          <ThreadRail current="stacks" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
