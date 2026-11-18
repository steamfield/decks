import { duration, ease, type gsap, motionMode, stagger } from "@react-decks/motion";
import { registerSettleProbe, useSlide } from "@react-decks/runtime";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { ink } from "../theme/theme";
import type { TemplateProps } from "./motion-template-props";
import styles from "./team-grid.module.css";
import { useTemplateMotion } from "./use-template-motion";

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function TeamGrid({ people, at = 0, accent = "cyan" }: TemplateProps<"team-grid">) {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error(`team-grid: invalid at ${at}`);
  if (people.length < 2 || people.length > 6)
    throw new Error(`team-grid: invalid people ${JSON.stringify(people)}`);
  for (const [i, person] of people.entries()) {
    for (const field of ["name", "role"] as const) {
      const value = person[field];
      if (typeof value !== "string" || !value.trim())
        throw new Error(`team-grid: invalid people[${i}].${field} ${JSON.stringify(value)}`);
    }
  }
  const cards = useRef<HTMLUListElement>(null);
  const [photos, setPhotos] = useState<ReadonlyMap<string, boolean>>(new Map());
  const ready = people.every(({ src }) => !src || photos.has(src));
  useLayoutEffect(() => {
    if (!ready) return registerSettleProbe(() => true, "portrait load");
  }, [ready]);

  const beat = useRef<gsap.core.Timeline | null>(null);
  const { clicks, isActive, renderContext } = useSlide();
  const previous = useRef({ clicks, isActive, ready });
  const pendingAdvance = useRef(false);
  useLayoutEffect(() => {
    const last = previous.current;
    previous.current = { clicks, isActive, ready };
    if (clicks !== last.clicks || !isActive)
      pendingAdvance.current =
        !last.ready &&
        last.isActive &&
        isActive &&
        at > 0 &&
        clicks === at &&
        clicks === last.clicks + 1;
    if (!ready || !pendingAdvance.current) return;
    pendingAdvance.current = false;
    // The cards missed this live click while loading. Replay the beat they missed.
    // A direct load at the same click keeps the seek performed by useTemplateMotion.
    const tl = beat.current;
    if (tl && renderContext === "slide" && motionMode() === "live") {
      tl.play(0);
      return () => {
        tl.pause();
      };
    }
  }, [at, clicks, isActive, ready, renderContext]);

  const warned = useRef(new Set<string>());
  function finishPhoto(src: string, loaded: boolean) {
    if (!loaded && !warned.current.has(src)) {
      warned.current.add(src);
      console.warn(`team-grid: could not load ${src}`);
    }
    setPhotos((previous) => (previous.has(src) ? previous : new Map(previous).set(src, loaded)));
  }

  return (
    <>
      <ul
        ref={cards}
        className={`od-body ${styles.people}`}
        style={{
          visibility: ready ? undefined : "hidden",
          gridTemplateColumns: `repeat(${people.length === 4 ? 2 : Math.min(3, people.length)}, minmax(0,1fr))`,
        }}
      >
        {Array.from(people.entries(), ([i, { name, role, src }]) => {
          const words = name.trim().split(/\s+/u);
          const initials = (words.length > 1 ? [words[0], words.at(-1)] : words)
            .map((word) => graphemes.segment(word ?? "").containing(0)?.segment)
            .join("")
            .toUpperCase();
          return (
            <li key={`${i}-${name}`}>
              {src && photos.get(src) !== false ? (
                <img
                  src={src}
                  alt={name}
                  aria-hidden="true"
                  ref={(image) => {
                    // A cached portrait can be ready a frame before its load event on reload.
                    if (
                      image?.complete &&
                      image.naturalWidth &&
                      image.naturalHeight &&
                      !photos.has(src)
                    )
                      finishPhoto(src, true);
                  }}
                  onLoad={(event) =>
                    finishPhoto(
                      src,
                      event.currentTarget.naturalWidth > 0 && event.currentTarget.naturalHeight > 0,
                    )
                  }
                  onError={() => finishPhoto(src, false)}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={styles.initials}
                  style={{ color: ink(accent, 3) }}
                >
                  {initials}
                </span>
              )}
              <h2>{name}</h2>
              <p className="od-body">{role}</p>
            </li>
          );
        })}
      </ul>
      {ready && <CardEntrance cards={cards} at={at} beat={beat} />}
    </>
  );
}

// Mount after the last portrait resolves, so a delayed group starts at the current click.
function CardEntrance({
  cards,
  at,
  beat,
}: {
  cards: RefObject<HTMLUListElement | null>;
  at: number;
  beat: RefObject<gsap.core.Timeline | null>;
}) {
  useTemplateMotion(at, (tl) => {
    beat.current = tl;
    if (!cards.current) return;
    // Each person rises into the row just after their neighbour.
    tl.fromTo(
      cards.current.children,
      { autoAlpha: 0, yPercent: 12 },
      { autoAlpha: 1, yPercent: 0, duration: duration.base, ease: ease.enter, stagger },
    );
  });
  return null;
}
