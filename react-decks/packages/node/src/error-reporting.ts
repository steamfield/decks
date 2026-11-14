import { createLogger, type Logger } from "vite";
import { authorError, type DeckError, displayPath } from "./errors";

export function errorReporting(base: Logger = createLogger()) {
  const logger = { ...base };
  const logError = logger.error.bind(logger);
  const reported = new Map<string, string>();
  const report = (error: DeckError) => {
    const key = error.file ?? error.message;
    if (reported.get(key) === error.message) return;
    reported.set(key, error.message);
    logError(error.message, { error });
  };
  logger.error = (message, options) => {
    const error = authorError(options?.error);
    if (error) report(error);
    else if (!Array.from(reported.values()).some((reported) => message.includes(reported)))
      logError(`${message}\nThis is a bug in react-decks.`, options);
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
