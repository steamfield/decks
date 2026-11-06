# Chart Editing

The editing system lets users drag, select, delete, add, and inline-edit chart elements. The library never mutates your spec: every durable edit arrives as an `EditTransaction` on `onEdit`, and you decide whether to apply it. `applyEditTransaction` from `@opendata-ai/openchart-core` is the one supported way to apply it.

## Interaction Mode

`interaction` (mount option or wrapper prop) picks what the chart allows:

| Mode | Selection | Edit gestures (drag, nudge, delete, add, text) | Arrow keys |
| --- | --- | --- | --- |
| `'read'` | None (`select()` and `selectedElement` are ignored too) | None | Reader data navigation |
| `'select'` | Click and Tab; `onSelect`/`onDeselect` fire | None | Reader data navigation |
| `'edit'` | Click and Tab | All, emitted through `onEdit` | Nudge the selection |

When `interaction` is omitted it is inferred once per mount: `onEdit` gives `'edit'`, otherwise `onSelect`/`onDeselect` give `'select'`, otherwise `'read'`. Wrappers recreate the chart when `interaction` or the presence of those listeners changes. `interaction: 'edit'` without `onEdit` warns once (gestures have nowhere to go). Select mode never edits text: pass `interaction: 'edit'` with `onEdit` for double-click/Enter text editing.

```tsx
// React
<Chart spec={spec} interaction="edit" onEdit={handleEdit} />
// Vue: <Chart :spec="spec" :interaction="'edit'" @edit="handleEdit" />
// Svelte: <Chart {spec} interaction="edit" onedit={handleEdit} />
```

```typescript
// Vanilla JS
const chart = createChart(container, spec, { interaction: 'edit', onEdit: handleEdit });
```

`seriesSearch` and `youDrawIt` key off the resolved mode, so `interaction: 'read'` keeps a youDrawIt chart drawable even with an `onSelect` handler.

## Edit Transactions

`onEdit(transaction)` receives `{ revision?, ops: EditOp[] }`. Each op is `{ op: 'set' | 'add' | 'remove', path, value?, expect? }`:

- `path` is a root-relative RFC 6901 JSON Pointer into the authored spec (`/annotations/2/offset`, `/layer/0/annotations/1`, `/chrome/title`, `/legend`). Use `jsonPointer(...)` from core to build one.
- `set` replaces a value and requires the parent to exist; `add` creates (or appends with `/-`); `remove` deletes.
- `expect` is a precondition on the nearest authored annotation (`id`, `type`, and `text`, which matches a refline/range `label`). If the annotation was reordered or changed since the gesture started, the transaction fails instead of silently editing the wrong one. Give annotations a stable `id` anyway; it is the durable identity.
- One gesture is one transaction. Apply all ops or none.

```typescript
import { applyEditTransaction } from '@opendata-ai/openchart-core';

const chart = createChart(container, spec, {
  interaction: 'edit',
  onEdit(transaction) {
    const result = applyEditTransaction(spec, transaction);
    if (!result.ok) return;            // stale or invalid target: keep the current spec
    undoStack.push(result.inverse);    // one undo entry per gesture
    spec = result.spec;
    chart.update(spec);
  },
});

// Undo: the inverse is itself a transaction.
const undone = applyEditTransaction(spec, undoStack.pop()!);
```

`applyEditTransaction` validates the whole op list against a private copy and never mutates its input; on failure it returns `{ ok: false, error: { opIndex, path, reason } }`. It does not compare `revision`; use that for your own bookkeeping (the chart stamps the `revision` mount option onto emitted transactions, and changing it cancels an in-flight gesture).

### What each gesture writes

| Gesture | Ops (paths relative to the annotation, e.g. `/annotations/2`) |
| --- | --- |
| Drag a text annotation label | `set …/offset` (plus `…/anchor` when it changes) and `set …/responsive: false`, so the placed label stays inline on narrow screens |
| Drag a connector endpoint | `set …/connectorOffset` |
| Drag a range/refline label | `set …/labelOffset` |
| Drag the data-point handle | `set …/x` and `set …/y` (data coordinates) |
| Edit text inline | `set …/text` (text annotations) or `set …/label` (range/refline) |
| Delete an annotation | `remove …` |
| Double-click empty plot area, type, Enter | `add /annotations/-` with a new `{ type: 'text', x, y, text }` |
| Drag or edit a chrome element | `set /chrome/<key>` to `{ text, offset? }` (a bare string stays a string on text edit) |
| Delete a chrome element | `remove /chrome/<key>` |
| Drag the legend | `add /legend` with `offset` merged in |
| Delete the legend | `add /legend` with `show: false` |

Offsets are pixels relative to the element's resolved position. A dragged position is clamped and can overlap other pinned annotations. Endpoint labels are not draggable.

## Selection

Click an element (or Tab to it) to select it; the library draws the selection overlay inside the SVG. Every `ElementRef` the chart emits or returns carries `path` (the authored object's JSON Pointer; chrome is `/chrome/<key>`, legend and legend entries are `/legend`). Variants: `annotation` (with `index`, optional `id`, optional `facetInstance`), `chrome` (`key`), `legend`, `legend-entry` (`series`, `index`). Build refs with `elementRef.annotation(i, id?, path?)`, `elementRef.chrome(key)`, `elementRef.legend()`, `elementRef.legendEntry(series, i)`.

```tsx
const [selected, setSelected] = useState<ElementRef | null>(null);

<Chart
  spec={spec}
  interaction="edit"
  onEdit={handleEdit}
  selectedElement={selected ?? undefined}   // controlled selection
  onSelect={setSelected}
  onDeselect={() => setSelected(null)}
/>
```

Imperative: `chart.select(ref)`, `chart.getSelectedElement()`, `chart.deselect()` (vanilla instance or React `ChartHandle` ref). `chart.isTextEditing` is true while the inline text editor is open.

## Keyboard (edit mode)

Edit mode replaces reader keyboard navigation, because arrow keys nudge instead of moving between data points.

| Key | Action |
| --- | --- |
| Arrow / Shift+Arrow | Nudge the selected text annotation 1px / 10px. Nudges commit as one transaction 500ms after the last release, or immediately on selection change, another gesture, cancel, or blur |
| Tab / Shift+Tab | Cycle editable elements; past the last (or first) the selection clears and focus leaves the chart |
| Enter | Start text editing on the selected element |
| Delete / Backspace | Delete the selected element |
| Escape | Cancel text editing, or deselect |

## Legend Toggle

Clicking a legend entry hides/shows a series at runtime (engine recompile, y-axis rebalance, locked color scale, per-series UI hidden; the last visible series can't be hidden). This is transient reader state, not a spec edit: it never emits a transaction. `onLegendToggle(series, visible)` observes it. Use `hiddenSeries` on the spec to start with series hidden.

## Ownership

| Library owns (inside the SVG) | Consumer owns |
| --- | --- |
| Selection overlay, drag handles, cursors | Toolbars, property panels |
| Inline text editor | Applying transactions, undo/redo stacks |
| Keyboard focus inside the chart | Persistence (save the spec after applying) |
