import { enhanceCopyButtons } from "@steamfield/ui/copy";
import { spyToc } from "@steamfield/ui/docs";
import { initReveal } from "@steamfield/ui/reveal";
import { track } from "../lib/analytics";
import { type EventName, Events } from "../lib/events";
import { PICK_EVENT } from "../lib/player/pick";

// The one module script every page loads. It isn't an island: docs pages ship no
// hydrated component, so the theme toggle, copy buttons and the TOC highlight
// are plain DOM code. Each part does nothing on a page without its markup.

const THEME_KEY = "theme";

function setupThemeToggle() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (!toggle) return;
  const root = document.documentElement;
  const sync = () => toggle.setAttribute("aria-pressed", String(root.classList.contains("dark")));
  toggle.hidden = false;
  sync();
  toggle.addEventListener("click", () => {
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    root.classList.toggle("light", !dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
    sync();
  });
}

const canCopy = () => typeof navigator.clipboard?.writeText === "function";

async function copyWithFeedback(button: HTMLButtonElement, read: () => Promise<string> | string) {
  const label = button.textContent;
  try {
    await navigator.clipboard.writeText(await read());
    button.textContent = "Copied";
  } catch {
    button.textContent = "Copy failed";
  }
  setTimeout(() => {
    button.textContent = label;
  }, 1500);
}

/** How long a copy button says "Copied". */
const COPIED_MS = 1500;

/**
 * Copy buttons on commands (CopyBlock.astro) and code frames (the docs Markdown
 * plugins and the landing theme.json frame), wired by enhanceCopyButtons from
 * @steamfield/ui/copy: each button copies the text of the element its aria-controls
 * names. They stay hidden unless the clipboard API is
 * there. A button's data-track names the event sent after every attempt, with
 * data-track-method as its method.
 */
function setupCopyButtons() {
  if (!canCopy()) return;
  enhanceCopyButtons(document, {
    copiedMs: COPIED_MS,
    onCopy: ({ id }) => {
      const button = document.querySelector<HTMLElement>(
        `[data-copy-command][aria-controls="${id}"]`,
      );
      const event = button?.dataset.track as EventName | undefined;
      if (event) track(event, { method: button?.dataset.trackMethod ?? null });
    },
  });
}

/**
 * The example gallery: each thumbnail links to the deck's static build. With
 * JavaScript, a click loads that deck into the hero player instead and scrolls
 * to it. A pick made before the player hydrates waits on window.__decksPick.
 */
function setupGallery() {
  const player = () => document.querySelector<HTMLElement>("[data-player]");
  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[data-example]")) {
    link.addEventListener("click", (event) => {
      const target = player();
      const name = link.dataset.example;
      if (!target || !name || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      window.__decksPick = name;
      window.dispatchEvent(new CustomEvent(PICK_EVENT, { detail: name }));
      const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
      target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
      target.focus({ preventScroll: true });
    });
  }
}

function trackQuickstart() {
  if (window.location.pathname === "/docs/getting-started/quickstart/") {
    track(Events.docsQuickstartViewed);
  }
}

function setupCopyPage() {
  const button = document.querySelector<HTMLButtonElement>("[data-copy-page]");
  const href = button?.dataset.copyPage;
  if (!button || !href || !canCopy()) return;
  button.hidden = false;
  button.addEventListener("click", () =>
    copyWithFeedback(button, async () => (await fetch(href)).text()),
  );
}

/** The landing header shows its bottom edge once the page scrolls under it. */
function setupHeaderEdge() {
  const header = document.querySelector<HTMLElement>("[data-landing-header]");
  const sentinel = document.querySelector("[data-header-sentinel]");
  if (!header || !sentinel || typeof IntersectionObserver === "undefined") return;
  new IntersectionObserver(([entry]) => {
    header.toggleAttribute("data-scrolled", !entry?.isIntersecting);
  }).observe(sentinel);
}

/**
 * Landing sections rise in as they scroll into view (initReveal from
 * @steamfield/ui/reveal, which sets data-revealed once). A block already on
 * screen, or above it, is revealed at once, so only blocks still below the fold
 * wait; keyboard focus reveals a block early. Without JavaScript or
 * IntersectionObserver, or with reduced motion, everything is simply there.
 */
function setupReveal() {
  initReveal({
    rootMargin: "0px 0px -15% 0px",
    immediate: (element) => element.getBoundingClientRect().top <= window.innerHeight,
  });
}

/** Marks the "On this page" link being read with aria-current="location" (DocsLayout styles it). */
function setupTocHighlight() {
  spyToc(document, { linkSelector: "[data-toc] a[href^='#']" });
}

setupThemeToggle();
setupHeaderEdge();
setupReveal();
setupCopyButtons();
setupGallery();
// After the layout script has called initAnalytics, which runs once this module has loaded.
queueMicrotask(trackQuickstart);
setupCopyPage();
setupTocHighlight();
