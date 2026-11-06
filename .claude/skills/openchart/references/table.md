# Data Table

Rich data tables with sorting, search, pagination, and inline visualizations.

## TableSpec

For the full shape (`TableSpec`, `ColumnConfig`, the per-feature configs `HeatmapConfig`/`BarConfig`/`SparklineConfig`/`ImageConfig`), load `TableSpec` from `index.d.ts`. Animation reuses the chart `AnimationSpec`.

Behavioral defaults the type doesn't show:

| Field | Default |
| --- | --- |
| `responsive` | `true` |
| `search` | off (omit to hide the search box) |
| `pagination` | off; pass `{ pageSize: N }` to enable |
| `density` | `"regular"` (48px rows). `"condensed"` is 40px, `"relaxed"` is 56px |
| `striped` | `false` |
| surface | Transparent: the table, header, totals row, search input, and pager paint `theme.colors.background` (transparent by default), so the table sits on the host surface like a chart. Set `theme.colors.background` for an opaque table. The opt-in sticky first column stays opaque. Inline bar fills render at 18% opacity in light mode, 40% in dark |
| `sort` | unset; the table's own default is the first inline-bar column, descending |
| `totalRow` | `false`; pass `true` (or `{ label }`) for a sticky footer summing every quantitative column over the currently filtered/sorted rows. Set `total: false` on a column (ratios, prices, percentages) to leave its total cell blank |
| `column.width` | auto-sized from content; an explicit `"200px"` or `"25%"` is honoured exactly (not flex-scaled). If explicit widths exceed the container they are scaled down proportionally with a `TABLE_WIDTH_OVERFLOW` dev warning |
| `column.sortable` | `true` |
| `column.align` | `"right"` for numeric data, `"left"` otherwise -- `column.type` (`'quantitative' \| 'nominal' \| 'ordinal' \| 'temporal'`) also drives this when set, and keys that look like identifiers (`id`, `zip`, `postal`, `code`, `year`, `fips`) are forced left even when numeric |
| `column.priority` | `1` for the first column, `2` for the rest. Only matters in cards mode (see below) |
| `column.image` size | 24x24 px |
| `column.sparkline.type` | `"line"` |
| `column.sparkline.domain` | `"shared"` -- every row's sparkline is scaled against the same min/max across the whole column, so magnitude is comparable row-to-row. Set `"row"` for each row scaled to its own range (emphasizes shape over magnitude), or an explicit `[min, max]` |

**Visual feature precedence** (if a column sets multiple): `sparkline > bar > delta > heatmap > image > flag > categoryColors`.

## Responsive behavior

Below 400px container width the table switches to **cards mode**: each row becomes a two-column grid with the column label printed beside its value, rather than horizontally scrolling a table. `column.priority` controls what shows in a card: `1` (the default for the first column) leads the card on its own full-width line, `2` (the default for every other column) renders as a label/value pair, `3` hides the column entirely in cards mode. Cards mode keeps real table semantics (explicit ARIA roles), so screen readers still announce rows and cells correctly.

Above 400px, `density` is authoritative when you set it explicitly -- no container-width logic overrides it. Left unset, the table only condenses to `"condensed"` under real content pressure (columns that can't each get roughly 96px, or a container under ~560px), not on every narrow embed.

## Category colors as chips

`column.categoryColors` renders each value as a chip: a small dot in the mapped color, the label text pushed to accessible contrast, sitting on a light (~14%) tint of the same color. The table cell itself is never fully painted -- this is a deliberate change from painting the whole cell, which read as a solid color block competing with the data.

```json
{
  "key": "status",
  "label": "Status",
  "categoryColors": { "Active": "#2a9d8f", "Inactive": "#e76f51", "Pending": "#f4a261" }
}
```

## Delta chips

`column.delta` (boolean, or `{ invert?: boolean }`) renders a signed, colored change chip (e.g. "▲ 2.4%") instead of a bare number -- positive green, negative red, using the theme's semantic colors and their tint backgrounds. Set `invert: true` for metrics where a decrease is the good outcome (churn, cost, error rate) so the color still tracks "good vs. bad" rather than "sign of the number."

## Builder

```typescript
import { dataTable } from "@opendata-ai/openchart-core";

// Auto-generates columns from data keys if omitted
const spec = dataTable(data, { search: true, pagination: { pageSize: 20 } });

// Or provide explicit columns
const spec = dataTable(data, {
  columns: [
    { key: "name", label: "Name" },
    { key: "revenue", label: "Revenue", format: "$,.0f", bar: { color: "#1b7fa3" } },
  ],
});
```

## Event Handlers

**Vanilla / all frameworks:**

| Handler | Signature | Fires when |
| --- | --- | --- |
| `onRowClick` | `(row: DataRow) => void` | User clicks a row |
| `onStateChange` | `(state: { sort?, search?, page? }) => void` | Any table state changes |

**React-only convenience props** (decompose `onStateChange` into individual callbacks):

| Handler | Signature | Fires when |
| --- | --- | --- |
| `onSortChange` | `(sort: SortState \| null) => void` | Sort changes |
| `onSearchChange` | `(query: string) => void` | Search input changes |
| `onPageChange` | `(page: number) => void` | Pagination changes |

**SortState:** `{ column: string, direction: "asc" | "desc" }`

Sort cycling: clicking the same column cycles none -> asc -> desc -> none. Clicking a different column resets to asc.

## Vanilla Instance API

```typescript
import { createTable } from "@opendata-ai/openchart-vanilla";

const table = createTable(container, spec, {
  autoResize: true,                     // default; false renders once
  onRowClick: (row) => console.log(row),
  onStateChange: (state) => console.log(state),  // { sort, search, page }
});

table.update(newSpec);                  // re-render with new spec
table.resize();                         // recalculate dimensions
table.export("csv");                    // export all filtered/sorted rows as CSV string
table.getState();                       // { sort: SortState|null, search: string, page: number }
table.setState({ search: "q", page: 0 }); // programmatic state control
table.destroy();                        // cleanup
```

## Controlled Mode (React)

Pass `sort`, `search`, or `page` props to control state externally:

```tsx
import { DataTable } from '@opendata-ai/openchart-react';

<DataTable
  spec={tableSpec}
  sort={sortState}
  search={searchQuery}
  page={currentPage}
  onSortChange={(sort) => setSortState(sort)}
  onSearchChange={(q) => setSearchQuery(q)}
  onPageChange={(p) => setCurrentPage(p)}
/>
```

Omit these props for uncontrolled mode (the table manages its own state).

## Example

```json
{
  "type": "table",
  "data": [
    {
      "city": "Tokyo",
      "country": "JP",
      "pop": 37.4,
      "density": 6158,
      "trend": [34.5, 35.2, 36.1, 37.0, 37.4]
    },
    {
      "city": "Delhi",
      "country": "IN",
      "pop": 32.9,
      "density": 11320,
      "trend": [25.7, 28.1, 30.3, 31.8, 32.9]
    },
    {
      "city": "Shanghai",
      "country": "CN",
      "pop": 29.2,
      "density": 3826,
      "trend": [24.2, 25.6, 27.1, 28.5, 29.2]
    },
    {
      "city": "Sao Paulo",
      "country": "BR",
      "pop": 22.6,
      "density": 7523,
      "trend": [20.9, 21.3, 21.8, 22.2, 22.6]
    },
    {
      "city": "Mexico City",
      "country": "MX",
      "pop": 22.1,
      "density": 9544,
      "trend": [20.1, 20.8, 21.3, 21.7, 22.1]
    }
  ],
  "columns": [
    { "key": "city", "label": "City" },
    { "key": "country", "label": "", "flag": true, "width": "48px" },
    {
      "key": "pop",
      "label": "Population (M)",
      "format": ".1f",
      "bar": { "color": "#1b7fa3" }
    },
    {
      "key": "density",
      "label": "Density /km2",
      "format": ",.0f",
      "heatmap": { "palette": "orange" }
    },
    {
      "key": "trend",
      "label": "2020-2024",
      "sparkline": { "type": "line", "color": "#6a9f58" }
    }
  ],
  "chrome": {
    "title": "World's largest metropolitan areas",
    "subtitle": "Population in millions, 2024 estimates",
    "source": "Source: UN World Urbanization Prospects"
  },
  "search": true,
  "pagination": { "pageSize": 10 },
  "stickyFirstColumn": true
}
```
