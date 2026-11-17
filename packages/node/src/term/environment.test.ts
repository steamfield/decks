import { expect, test } from "vitest";
import { shellEnvironment } from "./environment";

test("a shell keeps the user's environment without package-runner variables or bin paths", () => {
  const env = {
    HOME: "/users/speaker",
    LANG: "en_US.UTF-8",
    BUN_INSTALL: "/users/speaker/.bun",
    PATH: "/repo/node_modules/.bin:/users/speaker/.bun/bin:/parent/node_modules/.bin/:/usr/bin::/bin",
    npm_command: "run",
    npm_config_user_agent: "bun",
    npm_package_json: "/repo/package.json",
    npm_lifecycle_event: "decks",
    NODE: "/bin/node",
    NODE_OPTIONS: "--conditions=source",
    INIT_CWD: "/repo",
    TERM: "xterm-256color",
    DO_NOT_TRACK: "1",
  };
  expect(shellEnvironment(env)).toEqual({
    HOME: "/users/speaker",
    LANG: "en_US.UTF-8",
    BUN_INSTALL: "/users/speaker/.bun",
    PATH: "/users/speaker/.bun/bin:/usr/bin::/bin",
    TERM: "xterm-256color",
    DO_NOT_TRACK: "1",
  });
  expect(env.PATH).toContain("node_modules/.bin");
});

test("an absent PATH stays absent", () => {
  expect(shellEnvironment({ HOME: "/users/speaker" })).toEqual({ HOME: "/users/speaker" });
});
