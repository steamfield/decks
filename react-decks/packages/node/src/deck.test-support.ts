import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export async function fixture(
  cleanup: (callback: () => Promise<void>) => void,
  files: Record<string, string> = {},
) {
  const root = resolve(".tmp");
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(join(root, "node-"));
  cleanup(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, "node_modules/@react-decks"), { recursive: true });
  for (const name of ["node", "runtime", "motion"])
    await symlink(resolve("packages", name), join(dir, "node_modules/@react-decks", name), "dir");
  const put = async (file: string, text: string) => {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await writeFile(join(dir, file), text);
  };
  for (const [file, text] of Object.entries({
    "deck.config.ts": 'export default { title: "Test deck" };',
    "slides/01-first.mdx": "# First slide",
    ...files,
  }))
    await put(file, text);
  return { dir, put };
}
