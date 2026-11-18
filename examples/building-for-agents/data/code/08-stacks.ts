/**
 * Slide 8: the Stacks repo tour's code. Reread 2026-11-18 from
 * ~/Projects/stacks at commit 6525ecbd, after the CLI structure refactor;
 * first read at a952e96. Checked by excerpts.test.ts.
 */
import type { Excerpt } from "./types";

const base = { repo: "stacks", commit: "6525ecbd", lang: "ts" } as const;

/** A whole command: flags (none here), a thin handler, its help text. */
export const RUNS_COMMAND: Excerpt = {
  ...base,
  path: "packages/cli/src/commands/runs.ts",
  start: 9,
  end: 27,
  code: `export const runsCommand = Command.make("runs", {}, () =>
  Effect.gen(function* () {
    const host = yield* Host;
    const runs = yield* projectRuns(host.cwd);
    yield* (yield* Output).result(Schema.encodeSync(ProjectRuns)(runs), renderRuns(runs));
  }),
).pipe(
  // …
  Command.withShortDescription("Show this project's verify history and timings."),
  // …
);`,
};

/** A service class that carries its real layer and its test double. */
export const HOST_SERVICE: Excerpt = {
  ...base,
  path: "packages/cli/src/services/host.ts",
  start: 33,
  end: 53,
  code: `export class Host extends Context.Service<Host, HostInfo>()("stacks/Host") {
  static layer = (value: HostInfo) => Layer.succeed(Host, value);
  static memory = (overrides: Partial<HostInfo> = {}) =>
    Host.layer({
      nodeMajor: 24,
      platform: "test",
      // …
      cwd: "/test",
      stdinIsTTY: false,
      // …
      ...overrides,
    });
}`,
};

/** The one place the application's layers are composed. */
export const APP_LAYER: Excerpt = {
  ...base,
  path: "packages/cli/src/runtime.ts",
  start: 18,
  end: 30,
  code: `export const AppLayer = ({
  output,
  build,
  env,
}: {
  output: Layer.Layer<Output, never, Host | AppConfig>;
  build: Build;
  env?: Environment;
}) =>
  Layer.mergeAll(Processes.layer, Logging.layer).pipe(
    Layer.provideMerge(output),
    Layer.provideMerge(env === undefined ? AppConfig.layer(build) : AppConfig.memory(env, build)),
  );`,
};

/** An error class carries its exit policy; the table is derived from the classes. */
export const ERROR_TABLE: Excerpt = {
  ...base,
  path: "packages/cli/src/errors.ts",
  start: 221,
  end: 480,
  code: `export class UpstreamUnavailable extends Schema.TaggedError<UpstreamUnavailable>()(
  "UpstreamUnavailable",
  { details: Schema.optionalKey(UpstreamUnavailableDetails) },
) {
  static readonly exit = 4;
  static readonly retryable = true;
  override readonly message = "Upstream service is unavailable.";
}
// …
export const errorTable = Object.freeze(
  EffectRecord.map(errorClasses, (Class) =>
    Object.freeze({
      exit: Class.exit,
      retryable: "retryable" in Class && Class.retryable,
      // …
    }),
  ),
);`,
};

/** A test that swaps the HttpClient layer and asserts the exact envelope. */
export const LAYER_TEST: Excerpt = {
  ...base,
  path: "packages/cli/tests/update.test.ts",
  start: 250,
  end: 279,
  code: `const client = HttpClient.make((request, url, signal) => {
  // …
  return Effect.succeed(HttpClientResponse.fromWeb(request, new Response(body, { status: 503 })));
});
// …
const result = await runCli(["update", "--json"], {
  // …
  http: Layer.succeed(HttpClient.HttpClient, client),
  // …
});
expect(failure(result, 4)).toEqual({
  tag: "UpstreamUnavailable",
  // …
  retryable: true,
  next: "wait a moment, then run the same command again.",
  // …
});`,
};
