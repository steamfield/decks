import { DUR, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { type ProductId, product } from "../data/products";
import { SECTIONS } from "../data/sections";
import { FRAME } from "./design";
import styles from "./SectionStage.module.css";
import { DecksFigure } from "./section/DecksFigure";
import { ForemanFigure } from "./section/ForemanFigure";
import { GlassFigure } from "./section/GlassFigure";
import { RrFigure } from "./section/RrFigure";
import { StacksFigure } from "./section/StacksFigure";
import { ThreadRail } from "./ThreadRail";

const COPY = [{ lead: "" }];
const FIGURES = {
  stacks: StacksFigure,
  foreman: ForemanFigure,
  rr: RrFigure,
  statglass: GlassFigure,
  decks: DecksFigure,
};
const PICTURE = { x: FRAME.right - 760, y: 220, width: 760, height: 520 };

export function SectionStage({ id }: { id: ProductId }) {
  const p = product(id);
  const Figure = FIGURES[id];
  const s = useTween({ t: 0 });
  const { beats, clicks } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { t: 1, duration: DUR.bloom, ease: "none" }, DUR.morph + DUR.opacity * 2);
    },
    beats: (_tl, beat) => beat(0),
  });
  return (
    <StoryStage
      enterAfterTransition
      beats={beats}
      click={clicks}
      stage={
        <svg
          x={PICTURE.x}
          y={PICTURE.y}
          width={PICTURE.width}
          height={PICTURE.height}
          viewBox="0 0 38 26"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <Figure t={s.t} />
        </svg>
      }
      overlay={
        <>
          <div className={styles.title}>
            <div className={`od-enter-a ${styles.verb}`}>{p.verb}</div>
            <h1 className={`od-enter-b ${styles.name}`}>
              <span className={`sf-chrome ${styles.chrome}`}>{p.name}</span>
            </h1>
            <p className={`od-enter-c ${styles.sentence}`}>
              <span className="sf-prompt">❯</span> {SECTIONS[id]}
            </p>
          </div>
          <ThreadRail current={id} />
        </>
      }
    />
  );
}
