/**
 * Slide 5: the Stacks repo tour's code. Read 2026-11-13 from
 * ~/Projects/stacks at commit a952e96. Checked by excerpts.test.ts.
 */
import type { Excerpt } from './types'

const base = { repo: 'stacks', commit: 'a952e96', lang: 'ts' } as const

/** A whole command: flags (none here), a thin handler, its help text. */
export const RUNS_COMMAND: Excerpt = {
  ...base,
  path: 'packages/cli/src/commands/runs.ts',
  start: 8,
  end: 25,
  code: `export const runsCommand = Command.make("runs", {}, () =>
  Effect.gen(function* () {
    const result = yield* projectRuns((yield* Host).cwd);
    yield* (yield* Output).result(Schema.encodeSync(ProjectRuns)(result), renderRuns(result));
  }),
).pipe(
  // …
  Command.withShortDescription("Show this project's verify history and timings."),
  // …
);`,
}

/** A service class that carries its real layer and its test double. */
export const HOST_SERVICE: Excerpt = {
  ...base,
  path: 'packages/cli/src/services/host.ts',
  start: 29,
  end: 49,
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
}

/** The one place the application's layers are composed. */
export const APP_LAYER: Excerpt = {
  ...base,
  path: 'packages/cli/src/runtime.ts',
  start: 11,
  end: 19,
  code: `export const AppLayer = (
  output: Layer.Layer<Output, never, Host | AppConfig>,
  env: Environment | undefined,
  build: Build,
) =>
  Layer.mergeAll(Processes.layer, Logging.layer).pipe(
    Layer.provideMerge(output),
    Layer.provideMerge(env === undefined ? AppConfig.layer(build) : AppConfig.memory(env, build)),
  );`,
}

/** One row per error: exit code, retryable, keeps its report. */
export const ERROR_TABLE: Excerpt = {
  ...base,
  path: 'packages/cli/src/errors.ts',
  start: 425,
  end: 443,
  code: `export const errorTable = {
  Usage: { exit: 2, retryable: false, keepsResult: false },
  // …
  UpstreamUnavailable: { exit: 4, retryable: true, keepsResult: false },
  // …
  VerifyFailed: { exit: 5, retryable: false, keepsResult: true },
  VerifyChanged: { exit: 5, retryable: false, keepsResult: true },
  PermissionDenied: { exit: 6, retryable: false, keepsResult: false },
  // …
  Interrupted: { exit: 130, retryable: false, keepsResult: false },
  // …
} as const satisfies Record<AppError["_tag"], ErrorSpec> & Record<typeof ErrorTag.Type, ErrorSpec>;`,
}

/** A test that swaps the HttpClient layer and asserts the exact envelope. */
export const LAYER_TEST: Excerpt = {
  ...base,
  path: 'packages/cli/tests/update.test.ts',
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
}
