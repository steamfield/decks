// Ported from ~/Projects/steamfield/src/scripts/night-drive/scene-shaders.ts
// (steamfield commit 53a1a06, read 2026-11-13). The pointer relighting the
// site's hero has is left out: a slide has no mouse. Keep the rest in step
// with the site when its shaders change.

// Shared by the two light fields. Continuous value noise avoids changing seeds
// or exposure between frames; the mark and the data never get displaced.
const lightNoise = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float lightNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y) * 2.0 - 1.0;
  }
`

export const sunShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  // The mark on a 26-unit disc: a solid cap, then three gaps that widen
  // downward (1.25, 1.75, 2.25). Filled with the sunset, with a soft halo.
  fragment: /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uReveal;
    uniform float uCrt;
    uniform vec3 uYellow;
    uniform vec3 uOrange;
    uniform vec3 uPink;
    uniform vec3 uViolet;
    ${lightNoise}
    void main() {
      // Plane spans 1.6x the disc, so the halo has room.
      vec2 p = (vUv - 0.5) * 1.6 * 26.0;   // mark units, centered
      float y = 13.0 - p.y;                 // 0 at the top of the disc
      float d = length(p);
      float disc = 1.0 - smoothstep(12.9, 13.05, d);
      float gap = 0.0;
      gap += step(12.75, y) * (1.0 - step(14.0, y));
      gap += step(16.75, y) * (1.0 - step(18.5, y));
      gap += step(20.75, y) * (1.0 - step(23.0, y));
      float body = disc * (1.0 - gap);
      float t = clamp(y / 26.0, 0.0, 1.0);
      vec3 col = mix(uYellow, uOrange, clamp(t / 0.38, 0.0, 1.0));
      col = mix(col, uPink, clamp((t - 0.38) / 0.28, 0.0, 1.0));
      col = mix(col, uViolet, clamp((t - 0.66) / 0.34, 0.0, 1.0));
      #ifdef RAY_SOURCE
        // The scattering mask contains the luminous mark, never its halo.
        if (body < 0.5) discard;
        gl_FragColor = vec4(col, uReveal);
        return;
      #endif
      float edge = max(d - 13.0, 0.0);
      float irregularity = lightNoise(p * 0.19 + vec2(uTime / 12.0, -uTime / 19.0));
      float illumination = 1.0 + uCrt * 0.08 * irregularity;
      // The near halo dies before the plane edge. The sky owns the broad spill.
      float halo = exp(-edge * 0.65) * (1.0 - disc)
        * (1.0 - smoothstep(17.0, 20.0, d)) * 0.32 * illumination;
      vec3 haloCol = mix(uOrange, uPink, 0.65);
      // Straight alpha: don't multiply the halo into its color a second time.
      gl_FragColor = vec4(mix(haloCol, col, body), max(body, halo) * uReveal);
    }`,
}

export const gridShader = {
  vertex: /* glsl */ `
    varying vec3 vWorld;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragment: /* glsl */ `
    varying vec3 vWorld;
    uniform float uOffset;
    uniform float uCameraTravel;
    uniform float uReveal;
    uniform vec3 uLine;
    uniform vec3 uInk;
    uniform vec3 uHaze;
    uniform float uDaylight;
    void main() {
      // The site maps the pattern through the floor's own matrix so steering
      // can turn the ground under it. The deck never steers, so ground space
      // is world space and the pattern reads it directly.
      vec2 g = vec2(vWorld.x, vWorld.z - uCameraTravel - uOffset) / 4.0;
      vec2 w = fwidth(g);
      vec2 a = abs(fract(g - 0.5) - 0.5) / w;
      float distanceToLine = min(a.x, a.y);
      // A luminous core with a softer shoulder, measured in screen pixels.
      float line = exp(-distanceToLine * distanceToLine * 1.8);
      float shoulder = exp(-distanceToLine * distanceToLine * 0.15) * 0.26;
      float dist = -vWorld.z + uCameraTravel;
      float fade = 1.0 - smoothstep(20.0, 170.0, dist);
      float glow = exp(-min(abs(fract(g.x - 0.5) - 0.5), abs(fract(g.y - 0.5) - 0.5)) * 9.0) * 0.18;
      vec3 base = uInk * mix(0.45, 1.0, uDaylight);
      vec3 col = base + uLine * (line * 1.35 + shoulder + glow) * fade * uReveal;
      // Haze where the floor meets the sky.
      col += uHaze * smoothstep(110.0, 200.0, dist) * 0.25 * uDaylight;
      gl_FragColor = vec4(col, 1.0);
    }`,
}

export const skyShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragment: /* glsl */ `
    varying vec2 vUv;
    uniform float uHorizon;
    uniform float uDaylight;
    uniform vec3 uInk;
    uniform vec3 uMid;
    uniform vec3 uHaze;
    uniform vec3 uGlow;
    uniform vec2 uResolution;
    uniform vec2 uSun;
    uniform float uRadius;
    uniform float uReveal;
    uniform float uTime;
    uniform float uCrt;
    ${lightNoise}
    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      float h = clamp((uv.y - uHorizon) / (1.0 - uHorizon), 0.0, 1.0);
      vec3 col = mix(uHaze, uMid, smoothstep(0.0, 0.45, h));
      col = mix(col, uInk, smoothstep(0.45, 1.0, h));
      vec3 night = mix(uInk * 0.55, uInk, 1.0 - h);
      col = mix(night, col, uDaylight);
      // Distances are in screen-height units so the halo stays round.
      vec2 p = (uv - uSun) * vec2(uResolution.x / uResolution.y, 1.0);
      p /= max(uRadius, 0.001);
      float d = length(p);
      float variation = lightNoise(p * 1.7 + vec2(uTime / 12.0, -uTime / 19.0));
      float haze = lightNoise(uv * vec2(5.0, 8.0) + vec2(-uTime / 23.0, uTime / 31.0));
      col *= 1.0 + uCrt * 0.04 * haze * (1.0 - h);
      float illumination = 1.0 + uCrt * 0.04 * variation;
      float spill = exp(-max(d - 1.0, 0.0) * 1.8)
        * (1.0 - smoothstep(2.4, 3.5, d));
      // A bounded addition leaves dark sky around the light, even with bloom.
      col += uGlow * min(spill * 0.12 * illumination, 0.14) * uReveal * uDaylight;
      gl_FragColor = vec4(col, 1.0);
    }`,
}
