import { existsSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { expect, onTestFinished, test } from "vitest";
import { fixture } from "../dev/server.test-support";
import { marker, pane, setup } from "./sessions.test-support";

test("two resets remove old temporary directories only after exit, and never remove a named directory", async () => {
  const { dir } = await fixture(onTestFinished);
  const { sessions, shell, a } = setup(false, () => mkdtempSync(join(dir, "term-")), { repo: dir });
  onTestFinished(() => sessions.close());
  sessions.attach(pane, a.socket);
  for (const _ of [1, 2]) {
    const old = shell();
    const cwd = old.spec.cwd;
    old.data(marker);
    sessions.position(pane.id, 1, false, a.socket);
    sessions.position(pane.id, 0, true, a.socket);
    expect(existsSync(cwd)).toBe(true);
    old.exit("closed");
    expect(existsSync(cwd)).toBe(false);
    expect(existsSync(shell().spec.cwd)).toBe(true);
  }
  const last = shell();
  last.exit("natural exit");
  expect(existsSync(last.spec.cwd)).toBe(false);
  sessions.attach({ ...pane, cwd: "repo" }, a.socket);
  shell().exit("named exit");
  expect(existsSync(dir)).toBe(true);
});

test("a shell that cannot spawn does not leak its temporary directory", async () => {
  const { dir } = await fixture(onTestFinished);
  const cwd = join(dir, "term-");
  let created = "";
  const { sessions, a } = setup(true, () => {
    created = mkdtempSync(cwd);
    return created;
  });
  sessions.attach(pane, a.socket);
  expect(existsSync(created)).toBe(false);
});
