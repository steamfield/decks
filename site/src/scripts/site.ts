import { type CopyEventDetail, enhanceCopyButtons } from "@steamfield/ui/copy";
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

/** How long a copy button says "Copied". */
const COPIED_MS = 1500;

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
  }, COPIED_MS);
}

/**
 * Copy buttons on commands (CopyBlock.astro) and code frames (the docs Markdown
 * plugins and the landing theme.json frame), wired by enhanceCopyButtons from
 * @steamfield/ui/copy: each button copies the text of the element its aria-controls
 * names, falling back to execCommand without the Clipboard API. A button's
 * data-track names the event sent after a successful copy, with data-track-method
 * as its method.
 */
function setupCopyButtons() {
  enhanceCopyButtons(document, {
    copiedMs: COPIED_MS,
    // The noun in a failure message: "The command list is selected; press Cmd+C ...".
    subjects: { "Copy the install commands": "command list" },
  });
  document.addEventListener("sf:copy", (event) => {
    const { ok } = (event as CustomEvent<CopyEventDetail>).detail;
    const button = event.target;
    if (!ok || !(button instanceof HTMLElement)) return;
    const name = button.dataset.track as EventName | undefined;
    if (name) track(name, { method: button.dataset.trackMethod ?? null });
  });
}

/**
 * The example gallery: each thumbnail links to the deck's static build. With
 * JavaScript, a click loads that deck into the gallery player instead and scrolls
 * to it. A pick made before the player hydrates waits on window.__decksPick.
 */
function setupGallery() {
  if (document.documentElement.dataset.page !== "landing") return;
  // The gallery player, not the motion section's reel above it, which is also a [data-player].
  const player = () => document.querySelector<HTMLElement>("#examples [data-player]");
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
  // Measured before initReveal sets the motion gate: measuring under it would flush the
  // hidden start state, so an on-screen block would play its entrance from there.
  const onScreen = new Set(
    [...document.querySelectorAll("[data-reveal]")].filter(
      (element) => element.getBoundingClientRect().top <= window.innerHeight,
    ),
  );
  initReveal({
    rootMargin: "0px 0px -15% 0px",
    immediate: (element) => onScreen.has(element),
  });
}

/** Marks the in-page link being read with aria-current="location" (DocsLayout styles it). */
function setupTocHighlight() {
  // One spy per list: the docs sidebar and its mobile menu carry the same hashes, and a spy keeps
  // one link per hash.
  for (const list of document.querySelectorAll("[data-toc]")) {
    spyToc(list, { linkSelector: "a[href^='#']" });
  }
}

/** How long the "Copied" tooltip stays; global.css fades it over 150ms. */
const TIP_MS = 1200;

/**
 * Click an inline code pill in docs or blog prose to copy its text. One delegated listener on the
 * article; fenced blocks (their own copy buttons), linked pills (they navigate) and headings
 * (anchor targets) are left alone, and so is a click that ends a text selection. The "Copied"
 * tooltip is one element reused across clicks; a polite live region announces it. global.css
 * styles the pills once the article carries data-copy-inline, so without JavaScript they stay inert.
 * Click-to-copy is a pointer enhancement: the text stays selectable, and copyable from the
 * keyboard, as it always was.
 */
function setupInlineCodeCopy() {
  const article = document.querySelector("article");
  if (!article?.querySelector(".prose") || !canCopy()) return;
  article.dataset.copyInline = "";
  const tip = document.createElement("div");
  tip.className = "copy-tip";
  tip.setAttribute("aria-hidden", "true");
  tip.textContent = "Copied";
  const live = document.createElement("div");
  live.className = "sr-only";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  document.body.append(tip, live);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const show = (code: HTMLElement) => {
    clearTimeout(hideTimer);
    const rect = code.getBoundingClientRect();
    tip.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    tip.style.top = `${rect.top + window.scrollY}px`;
    tip.dataset.visible = "";
    live.textContent = "";
    live.textContent = "Copied";
    hideTimer = setTimeout(() => {
      delete tip.dataset.visible;
      live.textContent = "";
    }, TIP_MS);
  };

  article.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const code = event.target.closest<HTMLElement>("code");
    if (!code || !article.contains(code)) return;
    if (!code.closest(".prose") || code.closest("pre, a, h1, h2, h3, h4, h5, h6")) return;
    if (!window.getSelection()?.isCollapsed) return;
    navigator.clipboard.writeText(code.textContent ?? "").then(
      () => show(code),
      (error) => console.warn("Copying inline code failed", error),
    );
  });
}

/** Brings the current page's link into view inside the sticky sidebar, leaving the page itself alone. */
function setupSidebarScroll() {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Docs"]');
  const link = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
  if (!nav || !link) return;
  const box = nav.getBoundingClientRect();
  const at = link.getBoundingClientRect();
  if (at.top < box.top) nav.scrollTop += at.top - box.top;
  else if (at.bottom > box.bottom) nav.scrollTop += at.bottom - box.bottom;
}

setupThemeToggle();
setupHeaderEdge();
setupReveal();
setupCopyButtons();
setupGallery();
// After the layout script has called initAnalytics, which runs once this module has loaded.
queueMicrotask(trackQuickstart);
setupCopyPage();
setupInlineCodeCopy();
setupTocHighlight();
setupSidebarScroll();
