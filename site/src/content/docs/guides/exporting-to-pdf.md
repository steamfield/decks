---
title: Exporting to PDF
description: Export a registered deck to PDF with decks export, and how the animated flag in decks.json changes the export flags.
group: guides
order: 4
---

```bash title="Terminal"
bunx -p slidev-addon-decks decks export my-talk
```

`export` runs Slidev's PDF export on the deck's entry. Slidev's exporter drives Chromium, so it needs Playwright's Chromium installed.

## Flags per deck

The flags depend on `animated` in the deck's `decks.json` entry:

| `animated` | Slidev flags |
| --- | --- |
| absent or `false` | `--dark --with-clicks --with-toc` |
| `true` | `--dark --with-clicks --wait 1500` |

Set `"animated": true` when the deck uses OpenChart or scripted demos. Animated decks drop `--with-toc`, which errors on HTML-only slides, and wait 1500 ms per page. `decks new --story` sets it for you.

The output file name comes from `exportFilename` in the deck's headmatter.
