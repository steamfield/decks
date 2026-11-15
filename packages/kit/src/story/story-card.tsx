import { gsap, motionMode } from "@react-decks/motion";
import { registerCaptionProvider, useSlide } from "@react-decks/runtime";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { DUR, SETTLE } from "../theme/easings";
import type { Hue } from "../theme/theme-resolve";

export function StoryCard({
  lead,
  leadContent,
  body = "",
  anchor = "left",
  hue = "cyan",
  className = "",
  style,
}: {
  lead: string;
  leadContent?: ReactNode;
  body?: string;
  anchor?: "left" | "right";
  hue?: Hue;
  className?: string;
  style?: CSSProperties;
}) {
  const { isActive, renderContext } = useSlide();
  const captionRoot = useRef<HTMLDivElement>(null);
  // Root styles can change caption visibility without changing its text.
  useLayoutEffect(() => {
    if (isActive && renderContext === "slide")
      return registerCaptionProvider(() => {
        const root = captionRoot.current;
        if (!root) return;
        const { display, visibility } = getComputedStyle(root);
        if (display === "none" || visibility === "hidden" || visibility === "collapse") return;
        return { lead, body };
      });
  });
  const box = useRef<HTMLDivElement>(null);
  const incoming = useRef<HTMLDivElement>(null);
  const outgoing = useRef<HTMLDivElement>(null);
  const oldHeight = useRef(0);
  const attachIncoming = useCallback((element: HTMLDivElement | null) => {
    incoming.current = element;
    return () => {
      // React detaches a keyed ref before replacing its DOM, while the old copy is measurable.
      oldHeight.current = box.current?.offsetHeight ?? 0;
      incoming.current = null;
    };
  }, []);
  const [content, setContent] = useState<{
    lead: string;
    body: string;
    leadContent?: ReactNode;
    old: { lead: string; body: string; leadContent?: ReactNode } | null;
  }>({ lead, body, leadContent, old: null });
  if (content.lead !== lead || content.body !== body)
    setContent({
      lead,
      body,
      leadContent,
      old: { lead: content.lead, body: content.body, leadContent: content.leadContent },
    });
  else if (content.leadContent !== leadContent) setContent({ ...content, leadContent });
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const from = oldHeight.current;
    gsap.set(el, { clearProps: "height,overflow" });
    const to = el.offsetHeight;
    if (!content.old || !isActive || renderContext !== "slide" || motionMode() === "instant") {
      gsap.set(incoming.current, { clearProps: "opacity,transform" });
      if (content.old) setContent((previous) => ({ ...previous, old: null }));
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => setContent((previous) => ({ ...previous, old: null })),
    });
    tl.fromTo(
      incoming.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: DUR.card, ease: SETTLE, clearProps: "transform" },
      0,
    );
    tl.to(outgoing.current, { opacity: 0, duration: DUR.opacity }, 0);
    if (from > 0 && Math.abs(to - from) >= 1)
      tl.fromTo(
        el,
        { height: from, overflow: "hidden" },
        { height: to, duration: DUR.card, ease: SETTLE, clearProps: "height,overflow" },
        0,
      );
    return () => {
      tl.kill();
    };
  }, [isActive, renderContext, content.old]);
  const copy = (text: { lead: string; body: string; leadContent?: ReactNode }) => (
    <>
      <p className="od-story-lead">{text.leadContent ?? text.lead}</p>
      {text.body && <p className="od-story-copy">{text.body}</p>}
    </>
  );
  return (
    <div
      ref={captionRoot}
      className={`od-story-card anchor-${anchor} accent-${hue}${className ? ` ${className}` : ""}`}
      style={style}
      data-lead={lead}
      data-body={body}
    >
      <div ref={box} className="od-story-card-body">
        {content.old && (
          <div
            key={`${content.old.lead}|${content.old.body}`}
            ref={outgoing}
            aria-hidden="true"
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
          >
            {copy(content.old)}
          </div>
        )}
        <div key={`${lead}|${body}`} ref={attachIncoming}>
          {copy({ lead, body, leadContent })}
        </div>
      </div>
    </div>
  );
}
