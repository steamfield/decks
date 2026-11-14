import defaults from "./theme-default.json";
import { type Hue, resolveTheme as resolve, type Theme, themeCss } from "./theme-resolve";

let active: Theme | undefined;
let sheet: HTMLStyleElement | undefined;
const initial = resolveTheme();
export let CATEGORICAL_COLORS: string[] = initial.categorical;
export let CANVAS: string = initial.surfaces.canvas;

export function resolveTheme(deckTheme?: unknown): Theme {
  return resolve(defaults, deckTheme);
}

export function installTheme(value: Theme): void {
  const next = document.createElement("style");
  next.textContent = themeCss(value);
  if (sheet?.isConnected) sheet.replaceWith(next);
  else document.head.append(next);
  sheet = next;
  active = value;
  CATEGORICAL_COLORS = value.categorical;
  CANVAS = value.surfaces.canvas;
}

export function theme(): Theme {
  if (!active) throw new Error("No kit theme installed; call installTheme in setup.ts");
  return active;
}

export function ink(hue: Hue, step: 1 | 2 | 3 | 4): string {
  const [one, two, three, four] = theme().ramps[hue];
  return step === 1 ? one : step === 2 ? two : step === 3 ? three : four;
}
