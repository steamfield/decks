// The cassette shelf beside the player and the J-card a pulled tape shows.
// Each spine and J-card is lettered by hand in the deck's own paper and ink
// colors; the tracklist is the deck's slide titles as the deck reported them.
import type { CSSProperties } from "react";
import { sides, type Tape } from "../../lib/player/tape";

export const spineStyle = (tape: Tape) =>
  ({
    "--paper": tape.theme.paper,
    "--ink": tape.theme.ink,
    "--s1": tape.theme.stripes[0],
    "--s2": tape.theme.stripes[1],
    "--s3": tape.theme.stripes[2],
    "--shell":
      tape.theme.shell.kind === "tint"
        ? tape.theme.shell.color
        : tape.theme.shell.kind === "smoke"
          ? "#1c1c20"
          : "#c9d3da",
  }) as CSSProperties;

/** A cassette case seen end-on: the J-card's spine behind clear plastic. */
export function Spine({ tape, loaded }: { tape: Tape; loaded: boolean }) {
  if (loaded) {
    return (
      <span className="spine spine-empty">
        <span className="legend">In the deck</span>
      </span>
    );
  }
  return (
    <span className="spine" style={spineStyle(tape)} data-shell={tape.theme.shell.kind}>
      <span className="spine-card">
        <span aria-hidden="true" className="spine-stripes" />
        <span className="spine-title">{tape.title}</span>
        <span className="spine-side">A/B</span>
      </span>
    </span>
  );
}

/** The J-card, unfolded: title, sticker, and the slide titles split over two sides. */
export function JCard({ tape }: { tape: Tape }) {
  const tracks = tape.slideTitles.map((title, index) => title || `Slide ${index + 1}`);
  const { a, b } = sides(tracks);
  return (
    <div className="jcard" style={spineStyle(tape)}>
      <div className="jcard-front">
        <span aria-hidden="true" className="jcard-memphis" />
        <p className="jcard-title">
          <span className="highlighter">{tape.title}</span>
        </p>
        <span className="sticker" aria-hidden="true">
          {tape.slides}
          <small>slides</small>
        </span>
        <span className="scrawl" aria-hidden="true">
          Don't tape over
        </span>
      </div>
      <div className="jcard-tracks">
        {[
          { side: "A", list: a, start: 1 },
          { side: "B", list: b, start: a.length + 1 },
        ].map(
          ({ side, list, start }) =>
            list.length > 0 && (
              <div key={side}>
                <p className="jcard-side">Side {side}</p>
                <ol start={start} aria-label={`${tape.title}, side ${side}`}>
                  {list.map((title, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: slide order is the identity
                    <li key={index}>{title}</li>
                  ))}
                </ol>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
