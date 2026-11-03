// Contract test for the embed control (packages/decks/setup/embed.ts), against
// built decks.
//
//   bun run build:all && bun run test:embed [alias ...]   # default: tides templates keeling
//
// Serves each deck's build from decks.json's outDir, embeds it in a same-origin
// test page, sends `decks:cmd` messages and asserts the `decks:*` replies:
// ready, then meta, then state; slide, beat and card text after each command;
// settled flipping false then true; the direction. It also checks that the
// deck stays silent inside a cross-origin parent and that loading it makes no
// Google Fonts request.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright-chromium'

const registry = JSON.parse(readFileSync('decks.json', 'utf8'))
const aliases = process.argv.slice(2).length ? process.argv.slice(2) : ['tides', 'templates', 'keeling']

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

const PARENT = `<!doctype html><meta charset="utf-8"><title>embed test</title>
<iframe id="deck" src="__SRC__" width="1280" height="720" style="border:0" allow="screen-wake-lock"></iframe>
<script>
  window.msgs = []
  window.addEventListener('message', (e) => {
    if (e.data && typeof e.data.type === 'string' && e.data.type.startsWith('decks:'))
      window.msgs.push({ ...e.data, t: performance.now(), origin: e.origin })
  })
  window.send = (cmd) => document.getElementById('deck').contentWindow.postMessage({ type: 'decks:cmd', ...cmd }, '*')
</script>`

/** Static server for one build dir, plus the test page at /__embed.html. */
function serve(dir, frameSrc) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (path === '/__embed.html') {
      res.writeHead(200, { 'content-type': 'text/html' })
      return res.end(PARENT.replace('__SRC__', frameSrc(server.address().port)))
    }
    let file = resolve(dir, '.' + path)
    if (!file.startsWith(resolve(dir)) || !existsSync(file) || statSync(file).isDirectory())
      file = join(dir, 'index.html')
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)))
}

let failures = 0
function check(ok, label, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `\n     ${JSON.stringify(detail)}`}`)
  if (!ok) failures++
}

/** Send a command and wait for its settled:true state; returns [unsettled, settled]. */
async function step(page, cmd) {
  const from = await page.evaluate(() => window.msgs.length)
  await page.evaluate((c) => window.send(c), cmd)
  await page.waitForFunction(
    (n) => window.msgs.slice(n).some((m) => m.type === 'decks:state' && m.settled),
    from,
    { timeout: 10_000 },
  )
  const after = await page.evaluate((n) => window.msgs.slice(n), from)
  const states = after.filter((m) => m.type === 'decks:state')
  return [states.find((m) => !m.settled), states.find((m) => m.settled)]
}

/** Assert one command's state pair against `want` (slide, beat, lead, direction...). */
async function expectStep(page, cmd, want, label) {
  const [moving, settled] = await step(page, cmd)
  const got = settled ?? {}
  const fields = Object.keys(want)
  const match = fields.every((k) => got[k] === want[k])
  check(match, `${label}: ${fields.map((k) => `${k}=${JSON.stringify(want[k])}`).join(' ')}`, got)
  check(
    !!moving && moving.settled === false && settled.t >= moving.t && moving.slide === got.slide,
    `${label}: settled false then true (${settled ? Math.round(settled.t - (moving?.t ?? 0)) : '?'} ms)`,
    { moving, settled },
  )
  return [moving, settled]
}

const browser = await chromium.launch()
try {
  for (const alias of aliases) {
    const entry = registry[alias]
    if (!entry) throw new Error(`no deck "${alias}" in decks.json`)
    const dir = (entry.outDir ?? registry._config.outDir).replace('{name}', entry.name)
    if (!existsSync(join(dir, 'index.html'))) throw new Error(`${dir} is not built: bun run build ${alias}`)
    console.log(`\n# ${alias} (${dir})`)

    const server = await serve(dir, () => '/')
    const origin = `http://127.0.0.1:${server.address().port}`
    const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
    const fontHosts = []
    const errors = []
    page.on('request', (r) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontHosts.push(r.url())
    })
    // Slidev requests a screen wake lock on load; headless Chromium always denies it.
    const noise = /Wake Lock permission request denied/
    page.on('console', (m) => m.type() === 'error' && !noise.test(m.text()) && errors.push(m.text().slice(0, 200)))
    page.on('pageerror', (e) => !noise.test(String(e)) && errors.push(String(e).slice(0, 200)))

    await page.goto(`${origin}/__embed.html`)
    await page.waitForFunction(() => window.msgs.some((m) => m.type === 'decks:state' && m.settled), null, {
      timeout: 20_000,
    })
    const boot = await page.evaluate(() => window.msgs)
    const types = boot.map((m) => m.type)
    check(
      types[0] === 'decks:ready' && types[1] === 'decks:meta' && types[2] === 'decks:state',
      'boot order: ready, meta, state',
      types,
    )
    check(boot.every((m) => m.origin === origin), 'replies come from the deck origin', boot.map((m) => m.origin))
    const meta = boot[1]
    check(
      typeof meta.title === 'string' && meta.title.length > 0 && meta.slides > 1 &&
        Array.isArray(meta.slideTitles) && meta.slideTitles.length === meta.slides,
      `meta: title=${JSON.stringify(meta.title)} slides=${meta.slides}`,
      meta,
    )
    console.log(`     slideTitles ${JSON.stringify(meta.slideTitles)}`)
    const first = boot.find((m) => m.type === 'decks:state' && m.settled)
    check(first.slide === 1 && first.beat === 0 && first.direction === null, 'load state: slide 1, beat 0, direction null', first)

    if (alias === 'tides') {
      await expectStep(page, { cmd: 'go', slide: 2, beat: 0 }, {
        slide: 2, slides: 5, beat: 0, beats: 2, direction: 'forward',
        lead: 'Water level, hour by hour, for two days.',
      }, 'go 2')
      const [m1, s1] = await expectStep(page, { cmd: 'next' }, {
        slide: 2, beat: 1, direction: 'forward', lead: 'High tides arrive 12 h 25 min apart.',
      }, 'next')
      check(s1.t - m1.t >= 250, `a story beat stays unsettled while it animates (${Math.round(s1.t - m1.t)} ms >= 250)`, { m1, s1 })
      check(s1.body.startsWith('That is the average gap'), 'body text is the card body', s1.body)
      await expectStep(page, { cmd: 'prev' }, { slide: 2, beat: 0, direction: 'backward' }, 'prev')
      await expectStep(page, { cmd: 'go', slide: 2, beat: 2 }, { slide: 2, beat: 2, lead: 'The schedule follows the Moon.' }, 'go 2.2')
      await expectStep(page, { cmd: 'next' }, {
        slide: 3, beat: 0, direction: 'forward', lead: 'The Moon pulls the near ocean hardest.',
      }, 'next crosses to slide 3')
      await expectStep(page, { cmd: 'prev' }, { slide: 2, beat: 2, direction: 'backward' }, 'prev crosses back to the last beat')
      await expectStep(page, { cmd: 'nextSlide' }, { slide: 3, beat: 0, direction: 'forward' }, 'nextSlide')
      await expectStep(page, { cmd: 'go', slide: 3, beat: 2 }, { slide: 3, beat: 2 }, 'go 3.2')
      await expectStep(page, { cmd: 'prevSlide' }, { slide: 2, beat: 0, direction: 'backward' }, 'prevSlide lands on beat 0')
      await expectStep(page, { cmd: 'go', slide: 1, beat: 0 }, { slide: 1, beat: 0, lead: '', body: '' }, 'cover has no card')
    } else {
      await expectStep(page, { cmd: 'go', slide: 2, beat: 0 }, { slide: 2, beat: 0, direction: 'forward' }, 'go 2')
      await expectStep(page, { cmd: 'nextSlide' }, { slide: 3, beat: 0, direction: 'forward' }, 'nextSlide')
      await expectStep(page, { cmd: 'prev' }, { direction: 'backward' }, 'prev')
      await expectStep(page, { cmd: 'prevSlide' }, { beat: 0, direction: 'backward' }, 'prevSlide')
    }

    // Ignored: a message of another type, and a command from a frame that is not the parent.
    const before = await page.evaluate(() => window.msgs.length)
    await page.evaluate(() => document.getElementById('deck').contentWindow.postMessage({ type: 'other', cmd: 'next' }, '*'))
    await page.waitForTimeout(600)
    check((await page.evaluate(() => window.msgs.length)) === before, 'non-decks:cmd message is ignored', null)

    const fontOk = await page.frames()[1].evaluate(async () => {
      await document.fonts.ready
      return document.fonts.check('510 16px Inter') && [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Inter' && f.status === 'loaded')
    })
    check(fontOk, 'Inter is loaded from the build', null)
    check(fontHosts.length === 0, 'no Google Fonts request', fontHosts)
    check(errors.length === 0, 'no console errors', errors)
    await page.close()

    // Cross-origin parent: the test page on a second server (127.0.0.1 vs localhost).
    const other = await serve(dir, () => origin + '/')
    const xpage = await browser.newPage()
    await xpage.goto(`http://localhost:${other.address().port}/__embed.html`)
    await xpage.waitForTimeout(4000)
    await xpage.evaluate(() => window.send({ cmd: 'next' }))
    await xpage.waitForTimeout(800)
    const xmsgs = await xpage.evaluate(() => window.msgs)
    const xurl = xpage.frames()[1].url()
    check(xmsgs.length === 0 && !xurl.includes('clicks') && /#\/1$|\/$/.test(xurl), 'cross-origin parent: silent and not steerable', { xmsgs, xurl })
    await xpage.close()
    other.close()
    server.close()
  }
} finally {
  await browser.close()
}
console.log(failures ? `\n${failures} failed` : '\nall passed')
process.exit(failures ? 1 : 0)
