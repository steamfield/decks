import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

export async function readSource(file: string): Promise<string> {
  let source = await readFile(file, "utf8");
  // Editors can emit just one event for a truncate followed by a write.
  for (let attempt = 0; !source && attempt < 10; attempt++) {
    await delay(10);
    source = await readFile(file, "utf8");
  }
  return source;
}
