/**
 * existingServer decides whether `--port N` points at a Slidev dev server for
 * the deck being shot: each outcome against a real HTTP server on a free port.
 * startServer uses it to tell its own server from another run's.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { decodeEntities, existingServer, freePort, startServer } from './server.mjs'

const servers: Server[] = []
const dirs: string[] = []
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((done) => s.close(done))))
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** Serve `body` with `status` on a free port; resolves the port. */
async function serve(body: string, status = 200) {
  const port = await freePort(41000 + Math.floor(Math.random() * 2000))
  const server = createServer((_, res) => {
    res.writeHead(status, { 'content-type': 'text/html' })
    res.end(body)
  })
  servers.push(server)
  await new Promise<void>((done) => server.listen(port, 'localhost', done))
  return port
}

const page = (entry?: string) =>
  `<!doctype html><html><head><meta property="slidev:version" content="52.0.0">` +
  (entry === undefined ? '' : `<meta property="slidev:entry" content="${entry}">`) +
  `</head><body></body></html>`

/** A deck dir with a slides.md, so realpath resolves it. */
function deck(name = "tide's & <deck>") {
  const dir = mkdtempSync(join(tmpdir(), 'decks-server-'))
  dirs.push(dir)
  const entry = join(dir, `${name}.md`)
  writeFileSync(entry, '---\n---\n')
  return entry
}

const escapeAttr = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

describe('existingServer', () => {
  it('reports nothing listening', async () => {
    const port = await freePort(43000 + Math.floor(Math.random() * 2000))
    expect((await existingServer(port, deck())).error).toMatch(/^nothing answers on http:\/\/localhost:\d+/)
  })

  it('reports a non-200 answer', async () => {
    const port = await serve('gone', 404)
    expect((await existingServer(port, deck())).error).toMatch(/answers HTTP 404, not a Slidev page/)
  })

  it('reports a page that is not Slidev', async () => {
    const port = await serve('<html><head></head></html>')
    expect((await existingServer(port, deck())).error).toMatch(/is not a Slidev dev server \(no slidev:version/)
  })

  it('reports a Slidev page with no slidev:entry (a build, not a dev server for this deck)', async () => {
    const port = await serve(page())
    expect((await existingServer(port, deck())).error).toMatch(/not a Slidev dev server for this deck \(no slidev:entry/)
  })

  it('reports a different deck', async () => {
    const other = deck('other')
    const port = await serve(page(escapeAttr(other)))
    const r = await existingServer(port, deck())
    expect(r.error).toMatch(/serves a different deck/)
    expect(r.origin).toBeUndefined()
  })

  it('accepts the matching deck, entity-escaped in the page', async () => {
    const entry = deck()
    const port = await serve(page(escapeAttr(entry)))
    expect(await existingServer(port, entry)).toEqual({ origin: `http://localhost:${port}` })
  })

  it.runIf(process.platform === 'linux')('compares case-sensitively on Linux', async () => {
    const entry = deck('Tides')
    const port = await serve(page(entry.replace('Tides', 'tides')))
    expect((await existingServer(port, entry)).error).toMatch(/serves a different deck/)
  })
})

describe('startServer', () => {
  it('waits for its own deck when another run already answers on the probed port', async () => {
    // Two runs probe the same free port; the other run's server got it first.
    const ours = deck('ours')
    const taken = await serve(page(escapeAttr(deck('theirs'))))
    // A stand-in for Slidev bumped off `taken`: it ignores --port, serves
    // `ours` on another port after a delay, and prints that URL.
    const bumped = await freePort(45000 + Math.floor(Math.random() * 2000))
    const fake = join(dirs[0], 'fake-slidev.mjs')
    writeFileSync(
      fake,
      `import { createServer } from 'node:http'
const html = ${JSON.stringify(page(escapeAttr(ours)))}
setTimeout(() => createServer((_, res) => res.end(html)).listen(${bumped}, 'localhost', () =>
  console.log('public slide show > http://localhost:${bumped}/')), 1500)
`,
    )
    const server = await startServer({ args: [fake], cwd: dirs[0], port: taken, entry: ours })
    try {
      expect(server.origin).toBe(`http://localhost:${bumped}`)
    } finally {
      server.stop()
    }
  }, 20_000)
})

describe('decodeEntities', () => {
  it('decodes the named and numeric entities an attribute escape writes', () => {
    expect(decodeEntities('a&amp;b&quot;c&#39;d&#039;e&#x27;f&lt;g&gt;h&apos;i')).toBe(`a&b"c'd'e'f<g>h'i`)
  })
})
