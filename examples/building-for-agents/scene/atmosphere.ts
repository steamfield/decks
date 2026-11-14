// Copied unchanged from ~/Projects/steamfield/src/scripts/night-drive/atmosphere.ts
// (steamfield commit 53a1a06, 2026-11-13): the ground haze and the sun rays.
// @ts-nocheck
import {
  Color,
  Uniform,
  Vector2,
  type Texture,
  type Camera,
  type Mesh,
} from "three";
import { BlendFunction, Effect, GodRaysEffect } from "postprocessing";

// Screen-height coordinates describe a continuous, shallow layer at the foot
// of the range. No billboards: density dies smoothly above and below it.
const hazeShader = /* glsl */ `
  uniform float hazeTime;
  uniform float hazeDaylight;
  uniform float hazeHorizon;
  uniform float hazeAspect;
  uniform vec2 hazeSun;
  uniform vec3 hazeOrange;
  uniform vec3 hazePink;
  uniform sampler2D hazeRays;
  uniform float hazeRayStrength;
  float hazeNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    vec4 n = fract(sin(vec4(dot(i, vec2(127.1,311.7)),
      dot(i + vec2(1,0), vec2(127.1,311.7)),
      dot(i + vec2(0,1), vec2(127.1,311.7)),
      dot(i + vec2(1,1), vec2(127.1,311.7)))) * 43758.5453);
    return mix(mix(n.x,n.y,f.x), mix(n.z,n.w,f.x), f.y);
  }
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float height = uv.y - hazeHorizon;
    float layer = exp(-pow(height / (height > 0.0 ? 0.035 : 0.065), 2.0));
    vec2 p = vec2(uv.x * hazeAspect, height) * vec2(9.0, 70.0);
    float density = layer * (0.65 + 0.35 * hazeNoise(p + vec2(hazeTime / 18.0, hazeTime / 43.0)));
    vec2 direction = (uv - hazeSun) * vec2(hazeAspect, 1.0);
    float cosine = inversesqrt(1.0 + dot(direction, direction) * 5.0);
    // Henyey-Greenstein, normalized to one in the forward direction (g=.62).
    float phase = pow(0.1444 / (1.3844 - 1.24 * cosine), 1.5);
    vec3 tint = mix(hazePink, hazeOrange, phase);
    float extinction = density * 0.23 * hazeDaylight;
    vec3 scattering = tint * density * (0.025 + 0.13 * phase) * hazeDaylight;
    scattering += texture2D(hazeRays, uv).rgb * density * 0.14 * hazeRayStrength;
    outputColor = vec4(inputColor.rgb * (1.0 - extinction) + scattering, inputColor.a);
  }
`;

export function createGroundHaze(
  orange: Color,
  pink: Color,
  rays: Texture,
  horizon: number,
) {
  return new Effect("GroundHaze", hazeShader, {
    blendFunction: BlendFunction.NORMAL,
    uniforms: new Map<string, Uniform>([
      ["hazeTime", new Uniform(0)],
      ["hazeDaylight", new Uniform(0)],
      ["hazeHorizon", new Uniform(1 - horizon)],
      ["hazeAspect", new Uniform(1)],
      ["hazeSun", new Uniform(new Vector2())],
      ["hazeOrange", new Uniform(orange)],
      ["hazePink", new Uniform(pink)],
      ["hazeRays", new Uniform(rays)],
      ["hazeRayStrength", new Uniform(0)],
    ]),
  });
}

// Bound scattering in screen-height units: distant sky must keep its night
// color even when the source is bright. The integration still uses scene depth.
export class SunRaysEffect extends GodRaysEffect {
  constructor(camera: Camera, source: Mesh) {
    super(camera, source, {
      resolutionScale: 0.25,
      samples: 80,
      density: 0.98,
      decay: 0.985,
      weight: 0.075,
      exposure: 0.75,
      clampMax: 0.75,
      // Pre-blurring the source erases the real ridge's narrow valleys.
      blur: false,
    });
    this.uniforms.set(
      "raySun",
      new Uniform(this.godRaysMaterial.lightPosition),
    );
    this.uniforms.set("rayAspect", new Uniform(1));
    this.uniforms.set("rayRadius", new Uniform(0.1));
    this.setFragmentShader(/* glsl */ `
    uniform sampler2D map;
    uniform vec2 raySun;
    uniform float rayAspect;
    uniform float rayRadius;
    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      float distance = length((uv - raySun) * vec2(rayAspect, 1.0)) / rayRadius;
      float air = (1.0 - smoothstep(1.2, 3.2, distance))
        * exp(-max(distance - 1.0, 0.0) * 0.5);
      outputColor = vec4(texture2D(map, uv).rgb * air, 1.0);
    }
  `);
  }
}
