import { basename } from "node:path";
import { glob } from "tinyglobby";

export async function componentsModule(dir: string): Promise<string> {
  const files = (await glob("components/*.tsx", { cwd: dir, dot: true })).sort();
  return `${files.map((file, index) => `import * as c${index} from ${JSON.stringify(`/${file}`)};`).join("\n")}
const components = Object.create(null);
const owners = Object.create(null);
${files
  .map(
    (file, index) => `for (const [key, component] of Object.entries(c${index})) {
  const name = key === "default" ? ${JSON.stringify(basename(file, ".tsx"))} : key;
  if (Object.hasOwn(components, name) && owners[name] !== ${JSON.stringify(file)}) throw new Error("Duplicate component " + name + " in " + owners[name] + " and " + ${JSON.stringify(file)});
  components[name] = component;
  owners[name] = ${JSON.stringify(file)};
}`,
  )
  .join("\n")}
export { components };`;
}
