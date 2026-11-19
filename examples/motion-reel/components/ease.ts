import { CustomEase } from "@steamfield/decks/motion";

// Broadcast timing, one curve per role, so a beat reads as one gesture with a clear accent.
/** Type arriving: a fast attack, then a long soft settle. */
export const snap = "reelSnap";
/** An accent landing: past its mark once, then back. */
export const punch = "reelPunch";
/** Something leaving: a small gather, then away. */
export const leave = "reelLeave";
/** A plate or band crossing the canvas: even speed through the middle. */
export const slam = "reelSlam";

CustomEase.create(snap, "M0,0 C0.06,0.6 0.12,0.9 0.3,0.97 0.5,1.004 0.72,1 1,1");
CustomEase.create(punch, "M0,0 C0.1,0.7 0.18,1.13 0.4,1.06 0.58,0.99 0.8,1 1,1");
CustomEase.create(leave, "M0,0 C0.3,-0.06 0.62,0.18 1,1");
CustomEase.create(slam, "0.76,0,0.24,1");

/** How far a line travels to clear its mask, as a percentage of its own height. */
export const CLEAR = 135;
/** The lean a line arrives with, in degrees, before it settles upright. */
export const LEAN = 5;
