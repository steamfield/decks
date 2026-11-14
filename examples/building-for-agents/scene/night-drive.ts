// The cover's picture as a live scene: a neon grid floor driving toward the
// viewer, a mountain range whose ridgeline is Steamfield's commits per day, and
// the mark as the rising sun, played back like consumer VHS on a CRT.
//
// Ported from ~/Projects/steamfield/src/scripts/night-drive.ts (steamfield
// commit 53a1a06, read 2026-11-13). Kept: the sky, stars, sun, the shadowed
// mountain range with its data line, the grid, sun rays, ground haze, tape
// texture and chroma bleed, bloom, vignette and the tube stage, and the
// sunrise and approach timings. Left out: the game, mouse steering and pointer
// relighting (a slide has no mouse), turbo, and the heavy tape tracking faults
// (see tape.ts). One addition: the sun can sit off-center, by a horizontal
// lens shift, so a title has room beside it.
//
// NightDriveField loads this module on demand, in the real slide view only.
// The SVG picture under the canvas is what the presenter view, the overview,
// export and reduced motion show.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { BloomEffect, EffectComposer, EffectPass, RenderPass, VignetteEffect, type Pass } from 'postprocessing'
import { gridShader, skyShader, sunShader } from './shaders'
import { createGroundHaze, SunRaysEffect } from './atmosphere'
import { createTape } from './tape'
import { createCrtTube } from './tube'

export interface NightDriveOptions {
  /** Where the horizon sits, as a fraction of the canvas height from the top. */
  horizon: number
  /** Where the sun sits, as a fraction of the canvas width from the left. */
  sunX: number
  /** One scanline period of the tube overlay, in CSS pixels at this canvas size. */
  crtLine: number
  /** Skip the sunrise and start settled (arriving on the slide a second time). */
  settled?: boolean
  onFirstFrame: () => void
}

export interface NightDrive {
  dispose(): void
}

const FOV = 50
const SUN_Z = -190
const SUN_R = 27
const SUNRISE_DELAY = 0.55
// The site rises in 15 s. A cover sits on screen while the speaker opens, so
// here it takes a minute (Riley, 2026-11-13).
const SUNRISE_DURATION = 60
const RIDGE_Z = -105
const RIDGE_H = 24
const RIDGE_ROWS = 7
const RIDGE_DEPTH = 54
const APPROACH_DURATION = 60
const APPROACH_ZOOM = 1.2

function makeStars(count: number) {
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  let s = 11
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rand() - 0.5) * 760
    pos[i * 3 + 1] = 6 + rand() ** 1.6 * 150
    pos[i * 3 + 2] = -230 - rand() * 20
    seed[i] = rand()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(pos, 3))
  geometry.setAttribute('seed', new BufferAttribute(seed, 1))
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime;
      uniform float uPixel;
      varying float vTw;
      void main() {
        vTw = 0.55 + 0.45 * sin(uTime * (0.6 + seed * 2.4) + seed * 40.0);
        gl_PointSize = (1.0 + seed * 2.2) * uPixel;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying float vTw;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c));
        gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * vTw, a * vTw);
      }`,
  })
  return new Points(geometry, material)
}

/**
 * A range of rows behind each other. The front row's peaks are the data; rows
 * further back are the same profile, lower and shifted, so the range has depth
 * without inventing new peaks.
 */
function makeRidge(values: readonly number[], ink: Color, violet: Color, cyan: Color) {
  const cols = values.length
  const rows = RIDGE_ROWS
  const width = 340
  const depth = RIDGE_DEPTH
  const geometry = new PlaneGeometry(width, depth, cols - 1, rows - 1)
  geometry.rotateX(-Math.PI / 2)
  const pos = geometry.getAttribute('position') as Float32BufferAttribute
  const frontRow = rows - 2
  const frontDistance = 10 - (RIDGE_Z + depth / 2 - depth / (rows - 1))
  for (let r = 0; r < rows; r++) {
    // Rows behind the data line are further away, so they would end inside the
    // viewport. Their ends stretch by the distance ratio, fading in toward the
    // ends so the profile near the middle keeps its shape.
    const distance = 10 - (RIDGE_Z - depth / 2 + (r * depth) / (rows - 1))
    const stretch = r < frontRow ? distance / frontDistance - 1 : 0
    const back = (rows - 1 - r) / (rows - 1) // 1 at the far row, 0 at the front
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const shifted = values[Math.min(cols - 1, Math.max(0, c - Math.round(back * 6)))]!
      const h = (shifted * (1 - back * 0.35) + back * 0.12) * RIDGE_H
      const x = pos.getX(i)
      pos.setX(i, x * (1 + stretch * Math.abs(x / (width / 2)) ** 4))
      pos.setY(i, r === rows - 1 ? 0 : h)
    }
  }
  geometry.computeVertexNormals()
  const fill = new Mesh(
    geometry,
    new MeshLambertMaterial({
      color: ink,
      emissive: ink.clone().multiplyScalar(0.35),
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      side: DoubleSide,
    }),
  )
  fill.castShadow = true
  fill.receiveShadow = true
  const wire = new Mesh(
    geometry,
    new MeshBasicMaterial({ color: violet, wireframe: true, transparent: true, opacity: 0.55 }),
  )
  // The data line: the front ridge, drawn bright.
  const front: number[] = []
  for (let c = 0; c < cols; c++) {
    const i = frontRow * cols + c
    front.push(pos.getX(i), pos.getY(i), pos.getZ(i))
  }
  const lineGeometry = new BufferGeometry()
  lineGeometry.setAttribute('position', new Float32BufferAttribute(front, 3))
  const line = new Line(
    lineGeometry,
    new LineBasicMaterial({ color: cyan.clone().multiplyScalar(1.6), depthTest: false, transparent: true }),
  )
  line.renderOrder = 10
  const group = new Group()
  group.add(fill, wire, line)
  group.position.set(0, 0, RIDGE_Z)
  return { group, width, front: RIDGE_Z + depth / 2 - depth / (rows - 1) }
}

export function mountNightDrive(
  canvas: HTMLCanvasElement,
  ridge: readonly number[],
  options: NightDriveOptions,
): NightDrive {
  const style = getComputedStyle(canvas)
  const color = (token: string) => {
    const value = style.getPropertyValue(token).trim()
    if (!value) throw new Error(`night-drive: missing color token ${token}`)
    return new Color(value)
  }
  // The theme's custom properties: accents.hero-* and accents.sun-* in theme.json.
  const palette = {
    ink: color('--od-hero-ink'),
    mid: color('--od-hero-mid'),
    haze: color('--od-hero-haze'),
    grid: color('--od-hero-grid'),
    ridge: color('--od-hero-ridge'),
    wire: color('--od-hero-wire'),
    yellow: color('--od-sun-yellow'),
    orange: color('--od-sun-orange'),
    pink: color('--od-sun-pink'),
    violet: color('--od-sun-violet'),
  }
  const { horizon, sunX } = options

  // Register ownership as it is taken, so a failed mount and a normal teardown
  // release the same resources.
  const cleanups: Array<() => void> = []
  const dispose = () => {
    const errors: unknown[] = []
    for (const cleanup of cleanups.splice(0).reverse()) {
      try {
        cleanup()
      } catch (error) {
        errors.push(error)
      }
    }
    if (errors.length) throw new AggregateError(errors, 'night-drive: cleanup failed')
  }

  try {
    const renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    })
    cleanups.push(() => {
      renderer.dispose()
      renderer.forceContextLoss()
    })
    const dpr = Math.min(window.devicePixelRatio, 1.5)
    renderer.setPixelRatio(dpr)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFShadowMap
    renderer.shadowMap.autoUpdate = false

    // Shared uniforms keep both light fields in the same phase.
    const light = { uTime: { value: 0 }, uDaylight: { value: 0 }, uCrt: { value: 1 } }

    const scene = new Scene()
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 600)
    camera.position.set(0, 2.4, 10)
    camera.lookAt(0, 2.4, -100)

    const sky = new Mesh(
      new PlaneGeometry(2200, 500),
      new ShaderMaterial({
        uniforms: {
          ...light,
          uHorizon: { value: 1 - horizon },
          uInk: { value: palette.ink },
          uMid: { value: palette.mid },
          uHaze: { value: palette.haze },
          uGlow: { value: palette.orange.clone().lerp(palette.pink, 0.65) },
          uResolution: { value: new Vector2(1, 1) },
          uSun: { value: new Vector2(0.5, 0.5) },
          uRadius: { value: 0.1 },
          uReveal: { value: 0 },
        },
        vertexShader: skyShader.vertex,
        fragmentShader: skyShader.fragment,
        depthWrite: false,
      }),
    )
    sky.position.set(0, 0, -260)
    scene.add(sky)

    const stars = makeStars(1300)
    scene.add(stars)

    const sunMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        ...light,
        uReveal: { value: 0.75 },
        uYellow: { value: palette.yellow },
        uOrange: { value: palette.orange },
        uPink: { value: palette.pink },
        uViolet: { value: palette.violet },
      },
      vertexShader: sunShader.vertex,
      fragmentShader: sunShader.fragment,
    })
    const sunSize = SUN_R * 2 * 1.6
    const sun = new Mesh(new PlaneGeometry(sunSize, sunSize), sunMaterial)
    const sunRestY = SUN_R + camera.position.y // disc bottom at the lens-shifted horizon
    sun.position.set(0, sunRestY, SUN_Z)
    scene.add(sun)

    const ground = new Group()
    scene.add(ground)
    const range = makeRidge(ridge, palette.ink, palette.wire, palette.ridge)
    ground.add(range.group)

    const gridMaterial = new ShaderMaterial({
      uniforms: {
        uDaylight: light.uDaylight,
        uOffset: { value: 0 },
        uCameraTravel: { value: 0 },
        uReveal: { value: 1 },
        uLine: { value: palette.grid.clone() },
        uInk: { value: palette.ink },
        uHaze: { value: palette.haze },
      },
      vertexShader: gridShader.vertex,
      fragmentShader: gridShader.fragment,
    })
    const floor = new Mesh(new PlaneGeometry(1000, 400), gridMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0, -190)
    ground.add(floor)

    // A directional source models distant sunlight. Only the mountain fill
    // casts; the neon wireframe keeps its own emission and the floor receives
    // the shade.
    const sunlight = new DirectionalLight(palette.orange, 1)
    cleanups.push(() => sunlight.shadow.dispose())
    sunlight.target.position.set(0, 0, RIDGE_Z)
    sunlight.castShadow = true
    sunlight.shadow.mapSize.set(1024, 1024)
    sunlight.shadow.radius = 2.5
    sunlight.shadow.bias = -0.0003
    sunlight.shadow.camera.top = 140
    sunlight.shadow.camera.bottom = -80
    sunlight.shadow.camera.near = 0.5
    sunlight.shadow.camera.far = 500
    ground.add(sunlight, sunlight.target)
    // Add only reflected sunlight, so occlusion removes this contribution
    // instead of painting darkness over the emissive grid.
    const floorLightMaterial = new MeshLambertMaterial({
      color: palette.haze.clone().multiplyScalar(0.45),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    cleanups.push(() => floorLightMaterial.dispose())
    const floorLight = new Mesh(floor.geometry, floorLightMaterial)
    floorLight.rotation.copy(floor.rotation)
    floorLight.position.copy(floor.position)
    floorLight.position.y = 0.01
    floorLight.receiveShadow = true
    ground.add(floorLight)

    const composer = new EffectComposer(renderer)
    cleanups.push(() => composer.dispose())
    const addPass = (pass: Pass) => {
      cleanups.push(() => {
        if (!composer.passes.includes(pass)) pass.dispose()
      })
      composer.addPass(pass)
    }
    addPass(new RenderPass(scene, camera))
    const raySourceMaterial = new ShaderMaterial({
      uniforms: sunMaterial.uniforms,
      defines: { RAY_SOURCE: 1 },
      vertexShader: sunShader.vertex,
      fragmentShader: sunShader.fragment,
      transparent: true,
      depthWrite: false,
    })
    cleanups.push(() => raySourceMaterial.dispose())
    const raySource = new Mesh(sun.geometry, raySourceMaterial)
    const rays = new SunRaysEffect(camera, raySource)
    addPass(new EffectPass(camera, rays))
    const haze = createGroundHaze(palette.orange, palette.pink, rays.texture, horizon)
    addPass(new EffectPass(camera, haze))
    const tape = createTape()
    const tapeTime = tape.uniforms.get('tapeTime')!
    const tapeClock = tape.uniforms.get('tapeClock')!
    const tapeSize = tape.uniforms.get('tapeSize')!
    tape.uniforms.get('tapeLine')!.value = options.crtLine
    addPass(new EffectPass(camera, tape))
    const bloom = new BloomEffect({
      intensity: 0.95,
      luminanceThreshold: 0.45,
      luminanceSmoothing: 0.25,
      mipmapBlur: true,
      radius: 0.8,
    })
    const vignette = new VignetteEffect({ offset: 0.32, darkness: 0.62 })
    addPass(new EffectPass(camera, bloom, vignette))
    const tube = createCrtTube()
    const tubeSize = tube.uniforms.get('tubeSize')!
    addPass(new EffectPass(camera, tube))

    let approach = 0
    // The range spans the visible width at the start, however far the lens is
    // shifted, so the whole series is on screen. The approach then carries the
    // camera toward it and it grows.
    const fitRange = () => {
      const distance = 10 - range.front
      const halfWidth = distance * Math.tan((FOV * Math.PI) / 360) * camera.aspect
      range.group.scale.x = (2 * halfWidth * 1.03) / range.width
      range.group.position.x = (1 - 2 * sunX) * halfWidth
      range.group.scale.y = Math.min(1, Math.max(0.45, camera.aspect / 1.6))
      const shadowWidth = Math.max(160, halfWidth * 2.4)
      sunlight.shadow.camera.left = -shadowWidth
      sunlight.shadow.camera.right = shadowWidth
      sunlight.shadow.camera.updateProjectionMatrix()
      renderer.shadowMap.needsUpdate = true
    }
    // The front ridge grows by APPROACH_ZOOM over the approach.
    const approachZ = () => 10 - (10 - range.front) * (1 - 1 / APPROACH_ZOOM) * approach
    const updateView = () => {
      camera.position.z = approachZ()
      // Distant sky and sun follow the forward translation; the floor's local
      // coordinates follow too, preserving the apparent grid speed.
      sun.position.z = SUN_Z + camera.position.z - 10
      sky.position.z = -260 + camera.position.z - 10
      stars.position.z = camera.position.z - 10
      floor.position.z = -190 + camera.position.z - 10
      floorLight.position.z = floor.position.z
      gridMaterial.uniforms.uCameraTravel!.value = camera.position.z - 10
    }
    const projectedSun = new Vector3()
    const projectedEdge = new Vector3()
    let sunRiseX = 0
    const updateLight = () => {
      camera.updateMatrixWorld()
      raySource.position.copy(sun.position)
      // GodRaysEffect freezes this matrix before rendering the mask.
      raySource.updateMatrix()
      projectedSun.copy(sun.position).project(camera)
      projectedEdge.set(sun.position.x, sun.position.y + SUN_R, sun.position.z).project(camera)
      sky.material.uniforms.uSun!.value.set(projectedSun.x * 0.5 + 0.5, projectedSun.y * 0.5 + 0.5)
      sky.material.uniforms.uRadius!.value = Math.abs(projectedEdge.y - projectedSun.y) * 0.5
      sky.material.uniforms.uReveal!.value = sunMaterial.uniforms.uReveal!.value
      if (sunlight.position.x !== sunRiseX || sunlight.position.y !== sun.position.y) {
        sunlight.position.set(sunRiseX, sun.position.y, SUN_Z)
        renderer.shadowMap.needsUpdate = true
      }
      // Fraction of the luminous disc above the ground horizon.
      const limb = Math.min(1, Math.max(-1, sun.position.y / SUN_R))
      const visibleDisc = 0.5 + (Math.asin(limb) + limb * Math.sqrt(1 - limb * limb)) / Math.PI
      const reveal = sunMaterial.uniforms.uReveal!.value
      light.uDaylight.value = visibleDisc ** 1.5 * reveal
      haze.uniforms.get('hazeSun')!.value.copy(sky.material.uniforms.uSun!.value)
      haze.uniforms.get('hazeDaylight')!.value = light.uDaylight.value
      // Scattering peaks at low elevation; once the disc clears, a residual remains.
      const crossing = Math.exp(-(((sun.position.y + 4) / 11) ** 2))
      const rayStrength = reveal * (0.006 + 1.2 * crossing)
      rays.uniforms.get('rayRadius')!.value = sky.material.uniforms.uRadius!.value
      rays.blendMode.opacity.value = rayStrength
      haze.uniforms.get('hazeRayStrength')!.value = rayStrength
      const elevation = Math.min(1, Math.max(0, sun.position.y / sunRestY))
      sunlight.intensity =
        sun.position.y > 0
          ? 2.2 * visibleDisc * (0.3 + 0.7 * elevation) * Math.min(1, elevation / 0.12) * reveal
          : 0
    }

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      composer.setSize(w, h, false)
      camera.aspect = w / h
      // Lens shift, not a tilt or a pan: the horizon stays flat at `horizon`
      // and the vanishing point moves to `sunX` without skewing the grid.
      camera.setViewOffset(w, h, (0.5 - sunX) * w, (0.5 - horizon) * h, w, h)
      camera.updateProjectionMatrix()
      fitRange()
      haze.uniforms.get('hazeAspect')!.value = camera.aspect
      rays.uniforms.get('rayAspect')!.value = camera.aspect
      ;(stars.material as ShaderMaterial).uniforms.uPixel!.value = dpr
      renderer.getDrawingBufferSize(sky.material.uniforms.uResolution!.value)
      tapeSize.value.set(w, h)
      tubeSize.value.set(w, h)
      updateLight()
    }
    const ro = new ResizeObserver(resize)
    cleanups.push(() => ro.disconnect())
    ro.observe(canvas)
    resize()

    const timer = new Timer()
    // One renderer owns the sunrise, terrain and grid from frame one.
    let intro = options.settled ? SUNRISE_DELAY + SUNRISE_DURATION : 0
    let driveTime = 0
    let elapsed = 0
    let offset = 0
    let raf = 0
    let first = true

    const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3

    const frame = () => {
      raf = requestAnimationFrame(frame)
      timer.update()
      const dt = Math.min(timer.getDelta(), 0.05)
      elapsed += dt
      intro += dt
      driveTime += dt
      tapeClock.value += dt
      // The dropout clock starts once the sun settles.
      if (intro >= SUNRISE_DELAY + SUNRISE_DURATION) tapeTime.value += dt
      offset = (offset + dt * 9 * ease(driveTime / 1.8)) % 4
      gridMaterial.uniforms.uOffset!.value = offset
      gridMaterial.uniforms.uReveal!.value = ease(intro / 1.2)
      light.uTime.value = elapsed
      const rise = Math.min(1, Math.max(0, (intro - SUNRISE_DELAY) / SUNRISE_DURATION))
      // Linger at the ridge before settling, without changing the arc itself.
      const sunrise = rise * rise * (3 - 2 * rise)
      sunMaterial.uniforms.uReveal!.value = ease((intro - SUNRISE_DELAY) / 1.2)
      sunRiseX = -SUN_R * 0.65 * (1 - sunrise)
      sun.position.y = sunRestY - (1 - sunrise) ** 2 * SUN_R * 2.0
      ;(stars.material as ShaderMaterial).uniforms.uTime!.value = elapsed
      const approachProgress = Math.min(
        1,
        Math.max(0, (intro - SUNRISE_DELAY - SUNRISE_DURATION) / APPROACH_DURATION),
      )
      approach = approachProgress * approachProgress * (3 - 2 * approachProgress)
      updateView()
      sun.position.x = sunRiseX
      updateLight()
      haze.uniforms.get('hazeTime')!.value = elapsed
      composer.render(dt)
      if (first) {
        first = false
        options.onFirstFrame()
      }
    }

    const start = () => {
      if (raf || document.hidden) return
      timer.update()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    cleanups.push(stop)
    const onVisibility = () => (document.hidden ? stop() : start())
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility))
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return { dispose }
  } catch (error) {
    try {
      dispose()
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'night-drive: startup and cleanup failed', {
        cause: error,
      })
    }
    throw error
  }
}
