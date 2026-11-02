// The dev server behind `decks shot` and `decks snap`. With `--port N` they
// target a server already running there; without it they start one for the
// deck on a free port, wait for it to answer, and stop it when done.

import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

/** Whether `port` can be bound on `host`; a host this machine lacks counts as free. */
function bindable(port, host) {
  return new Promise((done) => {
    const probe = createServer()
    probe.once('error', (err) => done(err.code === 'EADDRNOTAVAIL'))
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

async function answers(origin) {
  try {
    const res = await fetch(origin, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

/** The origin of a server already on `port`, or null when nothing answers there. */
export async function existingServer(port) {
  const origin = `http://localhost:${port}`
  return (await answers(origin)) ? origin : null
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
  for (const sig of ['SIGINT', 'SIGTERM'])
    process.once(sig, () => {
      stop()
      process.exit(130)
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
