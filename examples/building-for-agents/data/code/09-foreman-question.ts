/**
 * Slide 9: the held question's code. Read 2026-11-13 from
 * ~/Projects/claude-codex at commit 9413fa8. Checked by excerpts.test.ts.
 * Shown dedented; the test compares lines with their indentation trimmed.
 */
import type { Excerpt } from './types'

const base = { repo: 'claude-codex', commit: '9413fa8', lang: 'ts' } as const

/** Receiving the tool call: remember the request, mark the run waiting, send nothing. */
export const HOLD_QUESTION: Excerpt = {
  ...base,
  path: 'src/supervisor/questions.ts',
  start: 103,
  end: 146,
  code: `const receive = Effect.fnUntraced(function* (
  // …
  run.calls.set(id, { id: message.id, server });
  yield* registry.event(run, {
    _tag: "QuestionAsked",
    id,
    kind,
    question: args.success.question,
  });
  yield* registry.state(run, "waiting");`,
}

/** What every blocked `foreman wait` is parked on: a Deferred, swapped and resolved. */
export const WAKE: Excerpt = {
  ...base,
  path: 'src/supervisor/registry.ts',
  start: 114,
  end: 119,
  code: `let changed = yield* Deferred.make<void>();
const wake = Effect.gen(function* () {
  const previous = changed;
  changed = yield* Deferred.make<void>();
  yield* Deferred.succeed(previous, undefined);
});`,
}

/** The answer: a JSON-RPC response to the request id stored when the question arrived. */
export const RESPOND: Excerpt = {
  ...base,
  path: 'src/supervisor/questions.ts',
  start: 82,
  end: 97,
  code: `yield* Effect.gen(function* () {
  yield* rpc.server.connection.respond(rpc.id, {
    success: true,
    contentItems: [{ type: "inputText", text }],
  });
  run.calls.delete(id);
  // …
  if (run.calls.size === 0 && run.record.state === "waiting")
    yield* registry.state(run, "running");`,
}

/** The timeout, tested by moving Effect's clock instead of waiting. */
export const TIMEOUT_TEST: Excerpt = {
  ...base,
  path: 'tests/supervisor-integration.test.ts',
  start: 6317,
  end: 6333,
  code: `it.effect("defers on the question timeout through TestClock", () =>
  // …
    yield* f.start({ questionTimeoutMs: 1000 });
    yield* f.untilState("waiting");
    yield* TestClock.adjust(1000);
    yield* f.untilState("idle");
    // …
    expect(yield* Store.readQuestions(f.runDir)).toMatchObject([
      { _tag: "Asked" },
      { _tag: "Deferred", by: "timeout" },
    ]);`,
}
