# Lint coverage and limits

`decks lint [deck ...]` scans MDX under `slides/`, and TypeScript/TSX under `components/` and `layers/`, recursively. It reads visible text, MDX string props, and literal/template portions of `COPY` leads and bodies. `decks lint --stdin` reads MDX, not TSX or a whole skill document.

Notes are warnings even when the same phrase would be an on-slide error. Code, imports, comments and ordinary data identifiers are not visible prose. Interpolated values and arbitrary computed strings need rendered review; the scanner does not execute components. Text stored outside scanned directories needs manual review too.

The active pre-write lint hook checks scoped deck files for error-level hits. Its presence depends on the plugin/project hook setup. It does not enforce the full design or prose guide. `decks check` includes error-level prose; `decks lint` also exposes warnings. Treat scanner setup/parse failures as verification failures and fix the cause.

On a denied write, change the sentence's argument or structure. A synonym substitution leaves the tell intact. Do not bypass the hook with shell writes. A justified direct quotation may need a narrow documented lint allowance supported by the installed version; do not use allowances to preserve original copy that fails.

Manually verify word budgets, claim headlines, single-sentence bullets, source accuracy and repeated slide anatomy. None is established by “lint passed”.
