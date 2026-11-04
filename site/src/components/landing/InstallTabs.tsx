import { InstallTabs as LibraryInstallTabs } from "@steamfield/ui/react/install-tabs";
import type { InstallOption } from "../../config";
import { track } from "../../lib/analytics";
import { Events } from "../../lib/events";

/** Tab values become ids, so each label is reduced to id-safe characters. */
const idOf = (label: string) => label.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");

/** Options by tab id. Two labels with the same id would share a tab, so that fails the build. */
function byTabId(options: InstallOption[]): Map<string, InstallOption> {
  const byId = new Map<string, InstallOption>();
  for (const option of options) {
    const id = idOf(option.label);
    const taken = byId.get(id);
    if (taken) {
      throw new Error(
        `InstallTabs: "${taken.label}" and "${option.label}" reduce to the same tab id "${id}"`,
      );
    }
    byId.set(id, option);
  }
  return byId;
}

// An island (client:idle) on @steamfield/ui's InstallTabs. Without JavaScript the
// first tab's commands render as selectable text, each tab links to its panel and
// the copy button stays hidden; hydration adds tab switching and copying. A command
// may span lines; it copies whole. Its look lives in src/styles/sf-theme.css.
export function InstallTabs({ options }: { options: InstallOption[] }) {
  if (options.length === 0) return null;
  const byId = byTabId(options);
  return (
    <LibraryInstallTabs
      id="install-with"
      className="decks-install"
      labels={{ prompt: "" }}
      options={[...byId].map(([id, option]) => ({
        id,
        label: option.label,
        command: option.command,
      }))}
      onCopy={(id, ok) => {
        const option = byId.get(id);
        if (ok && option) track(Events.installCopied, { method: option.label });
      }}
    />
  );
}
