import nodeConsole from "node:console";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// vitest.config.ts disables iframe page loads, and happy-dom logs each one it
// skips as an error with a stack trace. It logs to the console it was given when
// the environment started, Node's own, which vitest's onConsoleLog never sees.
// Drop exactly that message there; every other error still prints.
const error = nodeConsole.error.bind(nodeConsole);
nodeConsole.error = (...args: unknown[]) => {
  if (String(args[0]).includes("Iframe page loading is disabled")) return;
  error(...args);
};
