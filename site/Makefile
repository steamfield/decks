# decks-site site commands.
#
# Adapt the recipes, but keep the target names: `stacks verify` calls install,
# lint, check, test, build, e2e and dev, and CI should call the same targets.

PORT_WEB ?= 4321
PORT_E2E ?= 4322
export PORT_WEB PORT_E2E

.DEFAULT_GOAL := help
.PHONY: help install dev lint format check test coverage build ci-prepare preview e2e clean demo demo-build deploy-check deploy-preview deploy

help: ## List targets
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'

# Outside CI this also installs git hooks (when configured) and the Chromium
# build the browser tests use; CI installs Chromium in its own step.
install: ## Install dependencies (frozen lockfile when CI is set)
	bun install $(if $(CI),--frozen-lockfile)
	@if [ -z "$(CI)" ] && [ -f lefthook.yml ] && command -v lefthook >/dev/null 2>&1; then lefthook install; fi
	@if [ -z "$(CI)" ] && [ -x node_modules/.bin/playwright ]; then node_modules/.bin/playwright install chromium; fi

# --ignore-lock keeps astro dev in the foreground when it detects an agent
# (otherwise it backgrounds itself and exits). Stop a stray one: bunx astro dev stop
dev: ## Astro dev server on PORT_WEB
	bunx astro dev --port $(PORT_WEB) --ignore-lock

lint: ## Biome for TS, JS, CSS and JSON; Prettier for .astro files
	bunx biome check .
	bunx prettier --check "**/*.astro"

format: ## Apply Biome and Prettier fixes
	bunx biome check --write .
	bunx prettier --write "**/*.astro"

check: ## Type-check pages, components and content (astro check)
	@bun --no-install -e 'require.resolve("@astrojs/check"); require.resolve("typescript")' >/dev/null 2>&1 || { echo 'Missing checker dependencies. Run bun add -d @astrojs/check typescript, then make check.' >&2; exit 1; }
	bunx --no-install astro check

test: ## Unit and component tests
	bunx vitest run

coverage: ## Unit and component tests with coverage
	bunx vitest run --coverage

ci-prepare: ## Workers Builds only: install the parent repo, then build the decks into public/demo/
	cd .. && bun install --frozen-lockfile
	node scripts/demo.mjs --build

# Cloudflare Workers Builds (WORKERS_CI=1) runs `bun run build` from site/ on a
# fresh checkout: install the parent repo and build the decks first, since
# public/demo/ is gitignored and the site reads ../packages at build time.
build: $(if $(WORKERS_CI),ci-prepare) ## Static build into dist/, then the acceptance tests over it
	bunx astro build
	bunx vitest run --config vitest.build.config.ts

preview: ## Serve the production build on PORT_WEB
	bunx astro preview --port $(PORT_WEB) --ignore-lock

e2e: ## Browser and accessibility tests against the production build
	node scripts/e2e.mjs

clean: ## Remove build output, test output and Astro caches
	rm -rf dist .astro node_modules/.astro coverage playwright-report test-results

# The player's decks. Needs the parent repository's dependencies (bun install at
# the root) and, for the posters and stills, Playwright's Chromium.
demo: ## Lint, check and build the example decks into public/demo/, record them, take posters and stills
	node scripts/demo.mjs

demo-build: ## Build the example decks into public/demo/ only (what a deploy needs)
	node scripts/demo.mjs --build

deploy-check: build ## Serve dist/ through wrangler dev and check headers, canonical URLs and 404
	node --test tests/deploy.test.mjs

# Production normally deploys from Cloudflare's Git integration (AGENTS.md, Deploy).
# These upload from this machine and need CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
deploy-preview: build ## Upload dist/ as a preview for BRANCH (needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
	@test -n "$$CLOUDFLARE_API_TOKEN" -a -n "$$CLOUDFLARE_ACCOUNT_ID" || { echo "Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID." >&2; exit 1; }
	@test -n "$(BRANCH)" || { echo "Set BRANCH, e.g. make deploy-preview BRANCH=my-change." >&2; exit 1; }
	bunx wrangler versions upload --preview-alias "$(BRANCH)"

deploy: build ## Upload dist/ to production (needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
	@test -n "$$CLOUDFLARE_API_TOKEN" -a -n "$$CLOUDFLARE_ACCOUNT_ID" || { echo "Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID." >&2; exit 1; }
	bunx wrangler deploy
