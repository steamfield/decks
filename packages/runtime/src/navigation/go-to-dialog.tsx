import { type ReactElement, useId, useLayoutEffect, useRef, useState } from "react";
import { useDeck } from "../hooks";
import { useGoTo } from "./go-to-state";
import "./go-to-dialog.css";

export function GoToDialog(): ReactElement | null {
  const { open } = useGoTo();
  return open ? <OpenDialog /> : null;
}

function OpenDialog(): ReactElement {
  const { slides, go } = useDeck();
  const { hide } = useGoTo();
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const selectedOption = useRef<HTMLButtonElement>(null);
  const id = useId();
  const search = query.trim().toLowerCase();
  const matches = slides.filter((meta) =>
    /^\d+$/.test(search)
      ? meta.no === Number(search)
      : !search || meta.title?.toLowerCase().includes(search),
  );
  const selected = matches[Math.min(selection, matches.length - 1)];

  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    input.current?.focus();
    return () => element?.close();
  }, []);

  useLayoutEffect(() => {
    if (selected) selectedOption.current?.scrollIntoView?.({ block: "nearest" });
  }, [selected]);

  function choose(slide: number) {
    go(slide);
    hide();
  }

  return (
    <dialog
      ref={dialog}
      className="rd-go-to"
      aria-label="Go to slide"
      onCancel={(event) => {
        event.preventDefault();
        hide();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          hide();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Escape") {
          event.preventDefault();
          hide();
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setSelection((index) =>
            Math.max(0, Math.min(matches.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))),
          );
        } else if (event.key === "Enter") {
          event.preventDefault();
          if (selected) choose(selected.no);
        }
      }}
    >
      <label htmlFor={`${id}-input`}>Slide</label>
      <input
        ref={input}
        id={`${id}-input`}
        type="search"
        value={query}
        aria-controls={`${id}-list`}
        aria-activedescendant={selected ? `${id}-${selected.no}` : undefined}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelection(0);
        }}
      />
      <div id={`${id}-list`} role="listbox" aria-label="Slides">
        {matches.map((meta) => (
          <button
            key={meta.id}
            ref={meta.no === selected?.no ? selectedOption : undefined}
            id={`${id}-${meta.no}`}
            type="button"
            role="option"
            tabIndex={-1}
            aria-selected={meta.no === selected?.no}
            onClick={() => choose(meta.no)}
          >
            {meta.title ? `${meta.no}  ${meta.title}` : meta.no}
          </button>
        ))}
      </div>
    </dialog>
  );
}
