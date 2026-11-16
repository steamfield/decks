import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { expect, test } from "vitest";

const TERM = import.meta.dirname;
const files = readdirSync(TERM, { recursive: true, encoding: "utf8" })
  .filter((file) => /\.tsx?$/.test(file) && !file.includes(".test."))
  .map((file) => join(TERM, file));
const imports = (file: string) =>
  [...readFileSync(file, "utf8").matchAll(/from\s+"([^"]+)"/g)].map((match) => String(match[1]));
const offenders = (under: string, banned: (specifier: string, file: string) => boolean) =>
  files
    .filter((file) => relative(TERM, file).startsWith(under))
    .flatMap((file) =>
      imports(file)
        .filter((specifier) => banned(specifier, file))
        .map((specifier) => `${relative(TERM, file)} imports ${specifier}`),
    );

test("nothing under term/ imports from the rest of the deck", () => {
  const escapes = (specifier: string, file: string) =>
    specifier.startsWith(".") && relative(TERM, resolve(file, "..", specifier)).startsWith("..");
  expect(offenders("", escapes)).toEqual([]);
});

test("term/server imports no browser or React code", () => {
  const browser = (specifier: string) =>
    /^(react|react-dom|@xterm\/|@steamfield\/decks\/(kit|runtime|motion))/.test(specifier) ||
    specifier.includes("/client/");
  expect(offenders("server", browser)).toEqual([]);
});

test("term/client imports no Node module or server code", () => {
  const node = (specifier: string) =>
    specifier.startsWith("node:") || specifier.includes("/server/");
  expect(offenders("client", node)).toEqual([]);
});
