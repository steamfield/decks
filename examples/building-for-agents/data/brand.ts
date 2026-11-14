/**
 * The Steamfield mark: a disc cut into bands, which reads as a setting sun.
 *
 * Source: MARK_ONLY_PATH and MARK_VIEWBOX in
 * ~/Projects/steamfield/src/components/brand/paths.ts (generated there by
 * brand/source/build.py; read 2026-11-13, steamfield commit 53a1a06). Copy it
 * again if the brand files are regenerated. Its shape and gap ratios are never
 * edited here.
 */
export const MARK_PATH =
  'M0.002 12.75A13 13 0 0 1 25.998 12.75ZM0.039 14H25.961A13 13 0 0 1 25.447 16.75H0.553A13 13 0 0 1 0.039 14ZM1.221 18.5H24.779A13 13 0 0 1 23.437 20.75H2.563A13 13 0 0 1 1.221 18.5ZM4.693 23H21.307A13 13 0 0 1 4.693 23Z'

/** The mark's viewBox is a square of this many units. */
export const MARK_SIZE = 26

/** Sunset stops, top to bottom, as on the site (Sunset.astro). */
export const SUNSET_STOPS = [0, 0.38, 0.66, 1] as const
