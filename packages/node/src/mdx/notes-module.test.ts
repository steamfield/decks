import { execFile } from "node:child_process";
import { open, rename } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it, onTestFinished } from "vitest";

import { fixture, serve } from "../dev/server.test-support";
import { renderNotes } from "./notes";
import { readSource } from "./read-source";

describe("notes-module", () => {
  it("reads notes after an editor finishes a transient empty write", async () => {
    const { dir, put } = await fixture(onTestFinished);
    const file = join(dir, "editor-write.mdx");
    await put("saved-source.mdx", "# Slide\n\n<Notes>Saved notes</Notes>");
    await promisify(execFile)("mkfifo", [file]);
    const source = readSource(file, true);
    const emptyWrite = await open(file, "w");
    // The first reader holds the empty FIFO; its next read sees the saved regular file.
    await rename(join(dir, "saved-source.mdx"), file);
    await emptyWrite.close();
    expect(await renderNotes(await source, file)).toEqual([
      { click: 0, html: "<p>Saved notes</p>" },
    ]);
  });
  it.each(["<Notes >\n**Secret**\n</Notes >", "<Notes\n>\n**Secret**\n</Notes\n>"])(
    "extracts notes children with whitespace in the tags: %s",
    async (notes) => {
      const app = await serve({ "slides/01-first.mdx": `# Audience\n\n${notes}` });
      expect((await app.server.ssrLoadModule("virtual:react-decks/notes")).notes).toEqual({
        "01-first": [{ click: 0, html: "<p><strong>Secret</strong></p>" }],
      });
      expect(await app.get("/slides/01-first.mdx")).not.toContain("Secret");
    },
  );
  it("treats self-closing Notes as no notes", async () => {
    const app = await serve({ "slides/01-first.mdx": "# Audience\n\n<Notes />" });
    expect((await app.server.ssrLoadModule("virtual:react-decks/notes")).notes).toEqual({});
    expect(await app.get("/slides/01-first.mdx")).not.toContain("Notes");
  });
  it("names the file when notes parsing fails", async () => {
    const app = await serve({ "slides/01-first.mdx": "# Audience\n\n<Notes>\n<broken" });
    await expect(app.server.ssrLoadModule("virtual:react-decks/notes")).rejects.toThrow(
      "slides/01-first.mdx",
    );
  });
  it.each(["{true && <Notes>Secret</Notes>}", "<div child={<Notes>Secret</Notes>} />"])(
    "rejects Notes inside an expression naming the file: %s",
    async (body) => {
      const app = await serve({ "slides/01-first.mdx": `# Audience\n\n${body}` });
      for (const id of ["virtual:react-decks/notes", "/slides/01-first.mdx"]) {
        await expect(app.server.ssrLoadModule(id)).rejects.toThrow(
          /01-first\.mdx.*Notes.*expression/,
        );
      }
    },
  );
  it("renders each notes segment to HTML with its click and removes notes from compiled slides", async () => {
    const secret = "Speaker secret";
    const app = await serve({
      "slides/01-first.mdx": `# Audience\n\n<Notes>\n**${secret}**\n\n[click] Next\n\n[click:2] Last\n</Notes>`,
      "slides/02-no-notes.mdx": "# No notes",
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/notes");
    expect(module.notes).toEqual({
      "01-first": [
        { click: 0, html: `<p><strong>${secret}</strong></p>` },
        { click: 1, html: "<p>Next</p>" },
        { click: 3, html: "<p>Last</p>" },
      ],
    });
    const slide = await app.get("/slides/01-first.mdx");
    expect(slide).toContain("Audience");
    expect(slide).not.toContain(secret);
    expect(slide).not.toContain("[click]");
  });
  it("does not treat Notes shown in code as speaker notes", async () => {
    const app = await serve({
      "slides/01-first.mdx": "# Slide\n\n```mdx\n<Notes>example</Notes>\n```",
    });
    expect((await app.server.ssrLoadModule("virtual:react-decks/notes")).notes).toEqual({});
    expect(await app.get("/slides/01-first.mdx")).toContain("example");
  });
  it("rejects two Notes blocks in both the notes module and compilation", async () => {
    const app = await serve({
      "slides/01-first.mdx": "# Slide\n\n<Notes>One</Notes>\n\n<Notes>Two</Notes>",
    });
    await expect(app.server.ssrLoadModule("virtual:react-decks/notes")).rejects.toThrow(
      /01-first\.mdx.*more than one <Notes>/,
    );
    const response = await fetch(new URL("/slides/01-first.mdx", app.url));
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("more than one \\u003cNotes>");
  });
});
