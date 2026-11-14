---
trigger: glob
description: "react-decks React conventions"
globs: "**/react-decks/packages/runtime/**,**/react-decks/packages/motion/**,**/react-decks/packages/kit/**,**/react-decks/examples/**"
---
<!-- GENERATED from .claude/ for delegate agents from .claude/rules/react-decks/react.md. Edit the source, then regenerate this copy to match. -->

# react-decks React conventions

- React 19, function components, TypeScript. No class components, no `React.FC`, no default
  exports for components.
- Deck state lives in the zustand store from `createDeckStore`, read through `useDeck()` and
  `useSlide()` with selectors so a component re-renders only when what it reads changes. No
  second state library, no context that re-renders the whole tree on every click.
- The URL hash is the source of truth for slide and click. Never keep a second copy in
  component state.
- No `useEffect` to derive state from props or other state; compute it during render. An
  effect is for synchronizing with something outside React (the DOM, a timer, gsap, a
  channel), and it returns its cleanup.
- Read the DOM in `useLayoutEffect` or an event handler, never during render.
- A slide may render in five contexts (`slide`, `presenter`, `preview`, `overview`, `print`)
  and several at once. A component never assumes it is the only instance, never uses a global
  id, and never touches `window.location`: it reads `useSlide()`.
- When the context is not `slide`, or motion is `instant`, a component renders its end state
  for the current click with no animation and starts no WebGL.
- Styles: a co-located CSS Module for component-local rules; global classes only where the
  DOM contract or the kit's `od-*` vocabulary names them. No inline hex colors or raw
  durations: use theme and motion tokens.
- Props are explicit and typed. No `any`, no non-null `!`, no `as` casts except at a
  validated boundary.
