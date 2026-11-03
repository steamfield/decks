import { track } from "../lib/analytics";
import { type EventName, Events } from "../lib/events";

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

/** Copy buttons on commands: shown only when the clipboard API is there. */
function setupCommandCopy() {
  if (!canCopy()) return;
  for (const button of document.querySelectorAll<HTMLButtonElement>("button[data-copy]")) {
    const text = button.dataset.copy ?? "";
    button.hidden = false;
    button.addEventListener("click", async () => {
      await copyWithFeedback(button, () => text);
      const event = button.dataset.track as EventName | undefined;
      if (event) track(event, { method: button.dataset.trackMethod ?? null });
    });
  }
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
      window.dispatchEvent(new CustomEvent("decks:pick", { detail: name }));
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

function setupCodeCopy() {
  if (!canCopy()) return;
  for (const frame of document.querySelectorAll<HTMLElement>(".code-frame")) {
    const code = frame.querySelector("code");
    if (!code) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = "Copy";
    button.addEventListener("click", () => copyWithFeedback(button, () => code.textContent ?? ""));
    frame.append(button);
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

function setupTocHighlight() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc] a[href^='#']")];
  const byId = new Map(links.map((link) => [decodeURIComponent(link.hash.slice(1)), link]));
  const headings = [...byId.keys()]
    .map((id) => document.getElementById(id))
    .filter((heading) => heading !== null);
  if (headings.length === 0) return;
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      for (const link of links) link.removeAttribute("aria-current");
      byId.get(visible.target.id)?.setAttribute("aria-current", "location");
    },
    { rootMargin: "0px 0px -70% 0px" },
  );
  for (const heading of headings) observer.observe(heading);
}

setupThemeToggle();
setupCommandCopy();
setupGallery();
// After the layout script has called initAnalytics, which runs once this module has loaded.
queueMicrotask(trackQuickstart);
setupCodeCopy();
setupCopyPage();
setupTocHighlight();
