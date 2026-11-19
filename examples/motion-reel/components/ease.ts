import { CustomEase } from "@steamfield/decks/motion";

// Broadcast timing: type lands hard and stops, a plate overshoots once, a wipe crosses evenly.
export const snap = "reelSnap";
export const punch = "reelPunch";
export const slam = "reelSlam";

CustomEase.create(snap, "0.19,1,0.22,1");
CustomEase.create(punch, "0.34,1.56,0.64,1");
CustomEase.create(slam, "0.83,0,0.17,1");
