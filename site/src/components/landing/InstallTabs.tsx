import { type KeyboardEvent, useEffect, useId, useState } from "react";
import type { InstallOption } from "../../config";
import { track } from "../../lib/analytics";
import { Events } from "../../lib/events";

/** True once the page can write to the clipboard; copy buttons stay hidden until then. */
export const canCopy = () =>
  typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";

// An island (client:visible). Without JavaScript the first tab's commands render
// as selectable text; hydration adds tab switching and, when the clipboard API is
// there, the copy button. A command may span lines; it copies whole.
export function InstallTabs({ options }: { options: InstallOption[] }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyable, setCopyable] = useState(false);
  useEffect(() => setCopyable(canCopy()), []);
  if (options.length === 0) return null;

  const select = (index: number) => {
    setActive(index);
    setCopied(false);
    document.getElementById(`${id}-tab-${index}`)?.focus();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (step) select((active + step + options.length) % options.length);
  };
  const copy = async (option: InstallOption) => {
    await navigator.clipboard.writeText(option.command);
    setCopied(true);
    track(Events.installCopied, { method: option.label });
  };

  return (
    <div className="border-line bg-panel rounded-md border">
      <div role="tablist" aria-label="Install with" className="border-line flex border-b">
        {options.map((option, index) => (
          <button
            key={option.label}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={onKeyDown}
            className="aria-selected:text-ink aria-selected:border-ink text-muted -mb-px min-h-11 border-b-2 border-transparent px-4 text-sm font-medium"
          >
            {option.label}
          </button>
        ))}
      </div>
      {options.map((option, index) => (
        <div
          key={option.label}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          hidden={index !== active}
          className="flex items-start justify-between gap-4 p-4"
        >
          <pre className="text-ink min-w-0 font-mono text-[13px] leading-6 break-words whitespace-pre-wrap">
            <code>{option.command}</code>
          </pre>
          {copyable && (
            <button
              type="button"
              onClick={() => copy(option)}
              className="border-line-strong text-ink-2 hover:text-ink min-h-11 shrink-0 rounded-sm border px-3 text-xs"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
