/**
 * fact-extract.mjs: deterministic extractor for a deck's fact-check
 * manifest, behind `decks fact-extract`. Deck mode only.
 *
 * Usage (from the directory holding decks.json):
 *   decks fact-extract <alias>          # alias from decks.json
 *   decks fact-extract <deck-dir>
 *
 * Emits a markdown manifest to stdout with three sections:
 *   1. Data arrays: array literals in data/*.ts modules and in the <script>
 *      blocks of pages and components (chart data, COPY arrays)
 *   2. Prose numeric claims in slides.md and pages/*.md
 *   3. External links in number-bearing sentences
 *
 * Every entry is a claim to check against the deck's data-sources.md.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";

// An alias registered in decks.json (read from the current directory) wins;
// otherwise the argument is a deck directory.
function resolveDeckDir(arg) {
  const registry = join(process.cwd(), "decks.json");
  if (existsSync(registry)) {
    const deck = JSON.parse(readFileSync(registry, "utf-8"))[arg];
    if (deck && deck.entry) return dirname(join(process.cwd(), deck.entry));
  }
  if (existsSync(join(arg, "slides.md"))) return arg;
  console.error(`No deck alias "${arg}" in decks.json and no slides.md under ${arg}/`);
  process.exit(1);
}

// A number with a unit, currency, separator or decimal: the shapes a slide
// figure takes. Deliberately subject-neutral; a bare small integer ("three
// bullets", "step 2") is not matched.
const NUMBER_PATTERN =
  /[$€£]\s?\d|\d[\d,.]*\s*(%|percent|pp\b|x\b|×|trillion|billion|million|thousand|hundred|[kmb]\b|ms\b|seconds?\b|minutes?\b|hours?\b|days?\b|weeks?\b|months?\b|years?\b|times\b|per\s)|\b\d{1,3}(,\d{3})+\b|\b\d+\.\d+\b/i;

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

function readLines(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf-8").split("\n");
}

function stripNonProse(lines) {
  const result = [];
  let inFrontmatter = false;
  let inFence = false;
  let inScript = false;
  let fmCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (i === 0 && trimmed === "---") {
      inFrontmatter = true;
      fmCount++;
      continue;
    }
    if (inFrontmatter && trimmed === "---") {
      inFrontmatter = false;
      continue;
    }
    if (inFrontmatter) continue;

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (/^<script/.test(trimmed)) {
      inScript = true;
      continue;
    }
    if (/^<\/script>/.test(trimmed)) {
      inScript = false;
      continue;
    }
    if (/^<style/.test(trimmed)) {
      inScript = true;
      continue;
    }
    if (/^<\/style>/.test(trimmed)) {
      inScript = false;
      continue;
    }
    if (inScript) continue;

    if (/^\s*(import |export )/.test(line)) continue;
    if (/^\s*</.test(trimmed) && !/^<(p|blockquote|aside|details|summary|li|figcaption)/.test(trimmed)) continue;

    result.push({ line: i + 1, text: line });
  }
  return result;
}

// --- Section 1: data arrays (data/*.ts whole; pages and components inside <script>) ---
function extractDeckData(deckDir) {
  const arrays = [];
  const dirs = ["data", "pages", "components"];

  for (const subdir of dirs) {
    const dir = join(deckDir, subdir);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).sort().filter(
      (f) => f.endsWith(".md") || f.endsWith(".vue") || f.endsWith(".ts")
    );

    for (const file of files) {
      const filePath = join(dir, file);
      const lines = readLines(filePath);
      // A data module is all script; a page or component only inside <script>.
      let inScript = file.endsWith(".ts");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^<script/.test(line.trim())) {
          inScript = true;
          continue;
        }
        if (/^<\/script>/.test(line.trim())) {
          inScript = false;
          continue;
        }
        if (inScript) {
          if (
            /^\s*(export\s+)?(const|let|var)\s+\w+\s*=\s*\[/.test(line) ||
            /^\s*data:\s*\[/.test(line)
          ) {
            let depth = 0;
            let block = [];
            for (let j = i; j < lines.length; j++) {
              block.push(lines[j]);
              depth += (lines[j].match(/\[/g) || []).length;
              depth -= (lines[j].match(/\]/g) || []).length;
              if (depth <= 0) break;
            }
            arrays.push({ file: filePath, line: i + 1, text: block.join("\n") });
          }
        }
      }
    }
  }
  return arrays;
}

function processDeck(deckDir) {
  const slidesPath = join(deckDir, "slides.md");
  const lines = readLines(slidesPath);
  const proseLines = stripNonProse(lines);

  // Also scan all page files for prose
  const pagesDir = join(deckDir, "pages");
  let allProse = [...proseLines.map((p) => ({ ...p, file: slidesPath }))];

  if (existsSync(pagesDir)) {
    for (const f of readdirSync(pagesDir).sort().filter((f) => f.endsWith(".md"))) {
      const pagePath = join(pagesDir, f);
      const pageLines = readLines(pagePath);
      const pageProse = stripNonProse(pageLines);
      allProse.push(...pageProse.map((p) => ({ ...p, file: pagePath })));
    }
  }

  const chartData = extractDeckData(deckDir);
  const numericClaims = [];
  const citations = [];

  for (const item of allProse) {
    if (NUMBER_PATTERN.test(item.text)) {
      numericClaims.push({ file: item.file, line: item.line, text: item.text.trim() });
    }
    if (NUMBER_PATTERN.test(item.text)) {
      let match;
      LINK_PATTERN.lastIndex = 0;
      while ((match = LINK_PATTERN.exec(item.text)) !== null) {
        citations.push({
          file: item.file,
          line: item.line,
          label: match[1],
          url: match[2],
          context: item.text.trim(),
        });
      }
    }
  }

  return { chartData, numericClaims, citations };
}

// --- Output ---
// --- Output ---
function printManifest({ chartData, numericClaims, citations }) {
  console.log("# Fact-Check Manifest\n");

  console.log("## 1. Data Arrays\n");
  if (chartData.length === 0) {
    console.log("_No data arrays found._\n");
  } else {
    for (const cd of chartData) {
      const heading = cd.resolvedFrom
        ? `### ${cd.file} (resolvedFrom: ${cd.identifier})\n`
        : `### ${cd.file}:${cd.line}\n`;
      console.log(heading);
      console.log("```ts");
      console.log(cd.text.substring(0, 2000));
      if (cd.text.length > 2000) console.log("// ... truncated");
      console.log("```\n");
    }
  }

  console.log("## 2. Prose Numeric Claims\n");
  if (numericClaims.length === 0) {
    console.log("_No numeric claims found._\n");
  } else {
    for (const nc of numericClaims) {
      console.log(`- **${nc.file}:${nc.line}** ${nc.text}`);
    }
    console.log("");
  }

  console.log("## 3. External Citations\n");
  if (citations.length === 0) {
    console.log("_No external citations in number-bearing sentences._\n");
  } else {
    for (const c of citations) {
      console.log(`- **${c.file}:${c.line}** [${c.label}](${c.url})`);
      console.log(`  Context: ${c.context.substring(0, 200)}`);
    }
    console.log("");
  }
}

/** `decks fact-extract <alias|deck-dir>`: print the manifest to stdout. */
export function factExtract(target) {
  if (!target) {
    console.error("Usage:\n  decks fact-extract <alias>\n  decks fact-extract <deck-dir>");
    process.exit(1);
  }
  printManifest(processDeck(resolveDeckDir(target)));
}
