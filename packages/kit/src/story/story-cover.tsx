import type { ReactNode } from "react";
import { OdByline } from "../chrome/od-byline";
import { OdCoverHead } from "../chrome/od-cover-head";
import { StoryStage } from "./story-stage";

export function StoryCover({
  field,
  head,
  title,
  lede,
  byline,
  eyebrow,
  aside,
  background,
  center = false,
  url,
  brand = false,
  enterAfterTransition = false,
  children,
}: {
  field?: ReactNode;
  head?: ReactNode;
  title?: ReactNode;
  lede?: ReactNode;
  byline?: ReactNode;
  eyebrow?: ReactNode;
  aside?: ReactNode;
  background?: ReactNode;
  center?: boolean;
  url?: string;
  brand?: boolean;
  enterAfterTransition?: boolean;
  children?: ReactNode;
}) {
  return (
    <StoryStage
      className="is-story-cover"
      fluid={!field && !aside}
      enterAfterTransition={enterAfterTransition}
      background={background}
      overlay={
        <>
          {field}
          <div className="od-cover-frame">
            {head ?? ((url || brand) && <OdCoverHead className="od-enter-a" url={url} />)}
            <div className={`od-enter-b od-cover-body${center ? " od-cover-center" : ""}`}>
              {eyebrow}
              <h1 className="od-title">{title}</h1>
              {lede && <p className="od-lede od-cover-lede">{lede}</p>}
              {children}
            </div>
            {byline && <OdByline className="od-enter-c">{byline}</OdByline>}
          </div>
          {aside}
        </>
      }
    />
  );
}
