/** Remove package-runner state while preserving the user's own tools and settings. */
export function shellEnvironment(env: Record<string, string | undefined>) {
  const clean = Object.fromEntries(
    Object.entries(env).filter(
      ([key]) => !key.startsWith("npm_") && !["NODE", "NODE_OPTIONS", "INIT_CWD"].includes(key),
    ),
  );
  if (clean.PATH !== undefined)
    clean.PATH = clean.PATH.split(":")
      .filter((entry) => !entry.replace(/\/+$/, "").endsWith("node_modules/.bin"))
      .join(":");
  return clean;
}
