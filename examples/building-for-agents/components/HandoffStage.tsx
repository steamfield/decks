import { useDeck, useSlide } from "@steamfield/decks";
import { DUR, StoryStage, useStage } from "@steamfield/decks/kit";
import { Fragment, useEffect, useRef, useState } from "react";
import type { ProductId } from "../data/products";
import codeStyles from "./CodePane.module.css";
import { tokenizeLine } from "./code-tokens";
import styles from "./HandoffStage.module.css";
import { NamePlate } from "./NamePlate";
import { ThreadRail } from "./ThreadRail";
import { VscodeLink } from "./VscodeLink";

export interface Handoff {
  headline: string;
  product: ProductId;
  where: string;
  kind: "prompt" | "shell";
  /** Set a long prompt in the smaller prompt size. */
  dense?: boolean;
  text: string;
}

const COPY = [{ lead: "" }];

function shellTokens(command: string) {
  let nextName = true;
  return [
    ...command.matchAll(/"(?:[^"\\]|\\.)*"|'[^']*'|&&|\|\||[()&|;<>]|\s+|[^\s()&|;<>]+/g),
  ].flatMap(([text]) => {
    if (/^\s+$/.test(text)) return [{ text, kind: "plain" }];
    if (/^(?:&&|\|\||[()&|;])$/.test(text)) {
      nextName = true;
      return [{ text, kind: "punct" }];
    }
    if (nextName) {
      nextName = false;
      return [{ text, kind: "keyword" }];
    }
    if (text.startsWith("-")) return [{ text, kind: "type" }];
    return tokenizeLine(text, "sh");
  });
}

function promptTokens(line: string) {
  let offset = 0;
  return line
    .split(/(`[^`]+`|^\/\S+|~\/[\w./-]*[\w/-])/g)
    .filter(Boolean)
    .map((text) => {
      const start = offset;
      offset += text.length;
      if (text.startsWith("~/")) {
        return (
          <VscodeLink key={start} path={text}>
            {text}
          </VscodeLink>
        );
      }
      return (
        <span
          key={start}
          className={
            text.startsWith("/")
              ? codeStyles["sf-tok-keyword"]
              : text.startsWith("`")
                ? styles.inlineCode
                : undefined
          }
        >
          {text}
        </span>
      );
    });
}

export function HandoffStage({ handoff }: { handoff: Handoff }) {
  const deck = useDeck();
  const { renderContext } = useSlide();
  const { clicks, beats } = useStage({ copy: COPY, beats: (_tl, beat) => beat(0) });
  const snippet = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "fallback">("idle");
  const interactive = renderContext === "slide" || renderContext === "presenter";
  const label = handoff.kind === "shell" ? "command" : "prompt";
  let offset = 0;

  useEffect(() => {
    if (status !== "copied") return;
    const timer = setTimeout(() => setStatus("idle"), (DUR.gather + DUR.color) * 1000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    setStatus("idle");
    try {
      await navigator.clipboard.writeText(handoff.text);
      setStatus("copied");
    } catch {
      setStatus("fallback");
      if (snippet.current) {
        const range = document.createRange();
        range.selectNodeContents(snippet.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      enterAfterTransition
      overlay={
        <>
          <h2 className="od-story-head">{handoff.headline}</h2>
          <NamePlate id={handoff.product} chipOnly />
          <section
            className={`${styles.panel} od-enter-c`}
            aria-label={handoff.where}
            onCopy={(event) => {
              if (status !== "fallback") return;
              // Browser selections trim a final newline at the edge of a preformatted block.
              event.clipboardData.setData("text/plain", handoff.text);
              event.preventDefault();
            }}
          >
            <div className={styles.band}>
              <span className={styles.where}>{handoff.where}</span>
              {interactive && (
                <button
                  type="button"
                  className={`${styles.control} ${status === "copied" ? styles.copied : ""}`}
                  aria-label={
                    status === "copied"
                      ? "Copied"
                      : status === "fallback"
                        ? "Press ⌘C"
                        : `Copy ${label}`
                  }
                  onKeyDown={(event) => {
                    if (event.code !== "Space" || event.altKey || event.ctrlKey || event.metaKey)
                      return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.shiftKey) deck.prev();
                    else deck.next();
                  }}
                  onClick={copy}
                >
                  {status === "copied" && <span aria-hidden="true">✓ </span>}
                  {status === "copied" ? "Copied" : status === "fallback" ? "Press ⌘C" : "Copy"}
                </button>
              )}
            </div>
            <pre
              ref={snippet}
              className={`${styles.snippet} ${handoff.kind === "shell" ? styles.shell : styles.prompt}${handoff.dense ? ` ${styles.dense}` : ""}`}
            >
              {handoff.kind === "shell"
                ? shellTokens(handoff.text).map((token) => {
                    const start = offset;
                    offset += token.text.length;
                    return (
                      <span key={start} className={codeStyles[`sf-tok-${token.kind}`]}>
                        {token.text}
                      </span>
                    );
                  })
                : handoff.text.split("\n").map((line, index, lines) => {
                    if (index === lines.length - 1 && line === "") return null;
                    const start = offset;
                    offset += line.length + 1;
                    return (
                      <Fragment key={start}>
                        <span
                          className={`${styles.line} ${/^\s{2}\S/.test(line) ? styles.spec : /^\s*(?:\d+\.|-) /.test(line) ? styles.list : ""}`}
                        >
                          {/^\s{2}\S/.test(line) ? (
                            <code>{promptTokens(line)}</code>
                          ) : (
                            promptTokens(line)
                          )}
                        </span>
                        {index < lines.length - 1 ? "\n" : ""}
                      </Fragment>
                    );
                  })}
            </pre>
          </section>
          <ThreadRail current={handoff.product} />
        </>
      }
    />
  );
}
