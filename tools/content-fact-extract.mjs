#!/usr/bin/env node
// Kept for the paths the docs name; the extractor is `decks fact-extract`
// (packages/decks/scripts/fact-extract.mjs). Usage: content-fact-extract.mjs <alias|deck-dir>
import { factExtract } from '../packages/decks/scripts/fact-extract.mjs'

factExtract(process.argv[2])
