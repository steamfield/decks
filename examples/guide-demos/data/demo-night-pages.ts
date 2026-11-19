/** Guide demo (slide 87-story-stage): illustrative figures, authored for the Decks guide.
 * Not measured observations: night pages per week by service, before and after each
 * alert got a linked runbook. The slide labels them as illustrative.
 */
import type { InkBarRow } from "@steamfield/decks/kit";

export const BEFORE: InkBarRow[] = [
  { id: "checkout", label: "Checkout", value: 16 },
  { id: "search", label: "Search", value: 5 },
  { id: "auth", label: "Sign-in", value: 4 },
  { id: "payments", label: "Payments", value: 3 },
  { id: "email", label: "Email", value: 2 },
];

export const AFTER: InkBarRow[] = [
  { id: "checkout", label: "Checkout", value: 4 },
  { id: "search", label: "Search", value: 5 },
  { id: "auth", label: "Sign-in", value: 3 },
  { id: "payments", label: "Payments", value: 3 },
  { id: "email", label: "Email", value: 2 },
];

export const DOMAIN: [number, number] = [0, 18];
