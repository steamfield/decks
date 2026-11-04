// CopyBlock.astro's server output, for tests that run under happy-dom: there Vite
// compiles .astro files for the browser, where Astro components can't render.
// CopyBlock.test.ts (Node) checks this string against the real render.

export type CopyBlockProps = {
  id: string;
  lines: string[];
  label: string;
  track?: string;
  trackMethod?: string;
};

export function copyBlockHtml({ id, lines, label, track, trackMethod }: CopyBlockProps): string {
  const rows = lines
    .map(
      (line, index) =>
        `<span class="copy-line block pl-[2ch] -indent-[2ch]">${line
          .split(" ")
          .map((word) => `<span class="whitespace-nowrap">${word}</span>`)
          .join(" ")}${index < lines.length - 1 ? "\n" : ""}</span>`,
    )
    .join("");
  const tracking = `${track ? ` data-track="${track}"` : ""}${trackMethod ? ` data-track-method="${trackMethod}"` : ""}`;
  return (
    '<div class="border-line-strong bg-panel flex flex-wrap items-start gap-3 rounded-md border p-3">' +
    '<pre class="text-ink min-w-0 flex-1 font-mono text-[13px] leading-6 whitespace-pre-wrap">' +
    `<code id="${id}">${rows}</code></pre>` +
    `<button type="button" hidden data-copy-command aria-controls="${id}"${tracking} aria-label="${label}" class="border-line-strong text-ink-2 hover:text-ink min-h-11 shrink-0 rounded-sm border px-3 text-xs">` +
    "<span data-copy-label>Copy</span></button>" +
    '<span data-copy-result role="status" aria-live="polite" class="basis-full"></span></div>'
  );
}
