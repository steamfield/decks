// The dev server behind `decks shot` and `decks snap`. With `--port N` they
// target a server already running there; without it they start one for the
// deck on a free port, wait for it to answer, and stop it when done.

import { spawn } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { createServer } from 'node:net'

/**
 * Whether `port` can be bound on `host`. A host this machine lacks (no such
 * address, or IPv6 turned off) counts as free.
 */
function bindable(port, host) {
  return new Promise((done) => {
    const probe = createServer()
    probe.once('error', (err) => done(err.code === 'EADDRNOTAVAIL' || err.code === 'EAFNOSUPPORT'))
    probe.listen(port, host, () => probe.close(() => done(true)))
  })
}

/**
 * The first port at or above `start` that nothing listens on. `localhost` may
 * be either loopback address, so both have to be free.
 */
export async function freePort(start = 3030) {
  for (let port = start; port < start + 200; port++) {
    if ((await bindable(port, '127.0.0.1')) && (await bindable(port, '::1'))) return port
  }
  throw new Error(`no free port in ${start}-${start + 199}`)
}

const ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }

/** An HTML attribute value as text: the named entities HTML escaping writes, and numeric ones (`&#39;`, `&#039;`, `&#x27;`). */
export function decodeEntities(text) {
  return text.replace(/&(?:(amp|quot|apos|lt|gt)|#(\d+)|#x([0-9a-f]+));/gi, (m, name, dec, hex) => {
    if (name) return ENTITIES[name.toLowerCase()]
    const code = dec ? Number(dec) : parseInt(hex, 16)
    return code <= 0x10ffff ? String.fromCodePoint(code) : m
  })
}

async function answers(origin) {
  try {
    const res = await fetch(origin, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Whether the server already on `port` is a Slidev dev server for `entry`
 * (an absolute slides.md path). Resolves `{ origin }` when it is, or
 * `{ error }` saying what answers there instead. Slidev's page carries a
 * `slidev:version` meta tag, and in dev a `slidev:entry` one naming the deck.
 */
export async function existingServer(port, entry) {
  const origin = `http://localhost:${port}`
  let html
  try {
    const res = await fetch(origin, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return { error: `${origin} answers HTTP ${res.status}, not a Slidev page` }
    html = await res.text()
  } catch (err) {
    return { error: `nothing answers on ${origin} (${err.cause?.code ?? err.message})` }
  }
  if (!/property="slidev:version"/.test(html))
    return { error: `${origin} is not a Slidev dev server (no slidev:version in its page)` }
  const raw = /property="slidev:entry"\s+content="([^"]*)"/.exec(html)?.[1]
  if (raw === undefined)
    return { error: `${origin} is not a Slidev dev server for this deck (no slidev:entry in its page)` }
  const served = decodeEntities(raw)
  // Through realpath, so a symlinked temp dir is not a mismatch; case folds only
  // where the file system usually ignores it.
  const fold = process.platform === 'win32' || process.platform === 'darwin'
  const norm = (p) => {
    try {
      p = realpathSync.native(p)
    } catch {}
    p = p.replaceAll('\\', '/')
    return fold ? p.toLowerCase() : p
  }
  if (entry && norm(served) !== norm(entry))
    return { error: `${origin} serves a different deck (${served}), not ${entry}` }
  return { origin }
}

/**
 * Start `node <args>` (a Slidev dev server) in `cwd` on `port` and resolve
 * once it serves. Returns `{ origin, stop }`. The server is stopped on exit,
 * and its output is shown only if it dies before it answers.
 */
export async function startServer({ args, cwd, port, timeoutMs = 120_000 }) {
  const child = spawn('node', [...args, '--port', String(port)], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const collect = (chunk) => {
    output = (output + chunk).slice(-4000)
  }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  let exited = null
  child.once('exit', (code) => (exited = code ?? 1))
  const stop = () => {
    if (exited === null) child.kill('SIGTERM')
  }
  process.once('exit', stop)
  // 128 + the signal number, as a shell reports a process killed by it.
  for (const [sig, code] of [
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ])
    process.once(sig, () => {
      stop()
      process.exit(code)
    })

  const deadline = Date.now() + timeoutMs
  for (;;) {
    // Slidev moves to the next port if this one was taken in the meantime.
    const actual = /http:\/\/localhost:(\d+)/.exec(output)?.[1] ?? port
    const origin = `http://localhost:${actual}`
    if (await answers(origin)) return { origin, stop }
    if (exited !== null)
      throw new Error(`the dev server exited (${exited}) before it served:\n${output}`)
    if (Date.now() > deadline) {
      stop()
      throw new Error(
        `the dev server did not answer on ${origin} within ${timeoutMs / 1000}s:\n${output}`,
      )
    }
    await new Promise((r) => setTimeout(r, 500))
  }
}
