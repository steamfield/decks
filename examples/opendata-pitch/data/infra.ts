/**
 * Slide 5c: the two production machines and what they carried under load.
 *
 * Hardware and utilisation were read off the boxes on 2026-09-12. The
 * throughput and latency figures are from a k6 run and a Prometheus query,
 * recorded in `data-sources.md`, "Slide 5c". Nothing here is estimated.
 */
export interface Box {
  id: string
  name: string
  role: string
  chip: string
  cores: number
  ramGb: number
  disk: string
  /** Operating system the containers run on. */
  os: string
  /** What the machine cost, as the card prints it, and how it was acquired. */
  cost: string
  costNote: string
  services: string[]
}

export const BOXES: Box[] = [
  {
    id: 'm1',
    name: 'Mac Mini M1',
    role: 'Serving',
    chip: 'Apple M1',
    cores: 8,
    ramGb: 16,
    disk: '150 GB NVMe + 466 GB SSD',
    os: 'Linux',
    cost: '$250',
    costNote: 'bought used',
    // DuckDB runs in-process inside the API containers, so it is a service the
    // box carries without a container of its own.
    services: ['API x3', 'DuckDB', 'Frontend x2', 'MCP', 'Worker', 'Redis', 'Proxy'],
  },
  {
    id: 'm4',
    name: 'Mac Mini M4',
    role: 'Processing',
    chip: 'Apple M4',
    cores: 10,
    ramGb: 16,
    disk: '228 GB',
    os: 'macOS',
    cost: '$0',
    costNote: 'hackathon prize',
    services: ['Postgres', 'Neo4j', 'Grafana', 'Prometheus', 'Logs'],
  },
]

/** Serving box utilisation on 2026-09-12, idle. Fractions 0..1. */
export const GAUGES = [
  { id: 'disk', label: 'Root disk', value: 105 / 150, text: '105 of 150 GB', wall: true },
  // Stated in GB against the machine's 16 GB, so the gauge and the card agree.
  // `free -h` reports 15 GiB usable with 8.6 GiB available.
  { id: 'ram', label: 'RAM in use', value: 6.4 / 16, text: '6.4 of 16 GB', wall: false },
  { id: 'cpu', label: 'CPU load', value: 0.11 / 8, text: '0.11 on 8 cores', wall: false },
]

/**
 * Ceiling run, same 17 scenarios, MODE=ceiling: ramped from 815 to 2,445 req/s offered over
 * 150 s. Figures are per-second means over the cleanest stretch of the plateau (seconds
 * 34 to 41: no failures, every second's API p95 under 110 ms).
 */
export const CEILING = {
  date: '2026-09-12',
  reqPerSec: 1104,
  api: { reqPerSec: 968, p95Ms: 28 },
  dataset: { reqPerSec: 136, p95Ms: 12 },
  /** Highest offered rate with zero failures in the run (10 s mean, seconds 64 to 73). */
  zeroFailReqPerSec: 1397,
  /** Offered rate in the first second with failed requests. */
  firstFailReqPerSec: 1556,
}

/** Prometheus on the M4, 7-day window ending 2026-09-12. */
export const PROD_LATENCY = { p50Ms: 13.6, p95Ms: 195, requests: 292_158 }
