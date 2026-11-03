# State of JavaScript survey export

Exported 2026-11-03 from OpenData, dataset `state-of-survey/state-of-js`
(https://tryopendata.ai/datasets/state-of-survey/state-of-js). Source: State of
JavaScript survey by Devographics, editions 2016 to 2025. License: CC-BY-4.0.

- `tools_historical.csv`: one row per tool per survey year (the dataset's
  `tools_historical` records). Requested with
  `GET https://api.tryopendata.ai/v1/datasets/state-of-survey/state-of-js?view=all&filter[table]=tools_historical&fields=tool_id,tool_name,year,respondents,awareness,usage,interest,retention&sort=tool_id,year&limit=1000&format=csv`
- `tools_2025.csv`: the 2025 edition's tools with their category (the `tools`
  records). Same endpoint with `filter[table]=tools` and
  `fields=tool_id,tool_name,category,respondents,awareness,usage,interest,retention,used_count,never_heard_count`.

Ratios are 0 to 1. Awareness: share of respondents who have heard of or used
the tool. Usage: share who have used it. Retention: share of its users who
would use it again. Interest: share of those who have heard of it but not used
it who want to learn it. Respondents self-select, so these describe engaged
JavaScript developers rather than all of them. Some tools skip years (webpack
has no 2018 or 2019 row).
