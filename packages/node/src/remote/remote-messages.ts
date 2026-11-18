import type { RemoteClientMessage, RemotePosition } from "@react-decks/core";
import { z } from "zod";

export const maxPayload = 4096;

export const positionMessage = z.strictObject({
  slide: z.int().positive(),
  click: z.int().nonnegative(),
  view: z.enum(["play", "presenter", "overview"]),
  focused: z.boolean(),
}) satisfies z.ZodType<RemotePosition>;

export const clientMessage = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("next") }),
  z.strictObject({ type: z.literal("prev") }),
  z.strictObject({ type: z.literal("go"), slide: z.int().positive() }),
  z.strictObject({ type: z.literal("ping") }),
  z.strictObject({ type: z.literal("reset-timer") }),
]) satisfies z.ZodType<RemoteClientMessage>;
