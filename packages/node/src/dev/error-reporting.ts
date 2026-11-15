import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger, type Logger, normalizePath } from "vite";
import { authorError, type DeckError, displayPath } from "./errors";

export function errorReporting(base: Logger = createLogger(), deckDir = process.cwd()) {
  const packages = fileURLToPath(
    new URL(import.meta.url.endsWith(".ts") ? "../../../" : "../../", import.meta.url),
  );
  const sources = ["node", "core", "runtime", "motion", "kit"].map(
    (name) => `${normalizePath(join(packages, name, "src"))}/`,
  );
  const logger = { ...base };
  const logError = logger.error.bind(logger);
  const reported = new Map<string, string>();
  const report = (error: DeckError, heading?: string) => {
    const key = error.file ?? error.message;
    if (reported.get(key) === error.message) return;
    reported.set(key, error.message);
    if (heading) logger.info(heading);
    logError(error.message, { error });
  };
  logger.error = (message, options) => {
    const error = authorError(options?.error);
    if (error) report(error);
    else {
      const diagnostic = options?.error;
      const id = diagnostic && "id" in diagnostic ? diagnostic.id : undefined;
      // The component scan already reported the parser failure before Vite transformed it.
      if (
        diagnostic &&
        typeof id === "string" &&
        reported.has(id) &&
        "plugin" in diagnostic &&
        diagnostic.plugin === "vite:oxc"
      )
        return;
      if (Array.from(reported.values()).some((reported) => message.includes(reported))) return;
      const stack = diagnostic?.stack ?? message;
      const origin = stack.split("\n").find((line) => /^\s+(at |>[ ])/.test(line)) ?? "";
      const ownCode =
        sources.some(
          (source) =>
            origin.includes(source) ||
            [" ", "("].some((prefix) =>
              origin.includes(`${prefix}${normalizePath(relative(deckDir, source))}/`),
            ),
        ) ||
        (diagnostic &&
          "plugin" in diagnostic &&
          typeof diagnostic.plugin === "string" &&
          diagnostic.plugin.startsWith("react-decks"));
      logError(ownCode ? `${message}\nThis is a bug in react-decks.` : message, options);
    }
  };
  return {
    logger,
    report,
    fixed(file: string, message = `${displayPath(file)}: fixed`) {
      if (!reported.delete(file)) return;
      logger.info(message);
    },
  };
}
