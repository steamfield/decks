// Ported from ~/Projects/steamfield/src/scripts/night-drive/crt-tube.ts
// (steamfield commit 53a1a06, read 2026-11-13): the glass the tape plays on.
//
// One difference from the site. There the picture is the only warped thing,
// so the shader does the barrel warp. Here the whole slide is the tube: the
// warp is an SVG displacement filter on the slide frame (global-top.vue and
// warp.ts), and it bends this canvas along with the type over it. So
// `tubeWarp` defaults to 0 and the shader keeps the beam bloom and the corner
// falloff. Scanlines and the phosphor mask come from the tube overlay.
import { Uniform, Vector2 } from 'three'
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'

const tubeShader = /* glsl */ `
  uniform vec2 tubeSize;
  uniform float tubeWarp;
  uniform float tubeAmount;

  const vec3 TUBE_LUMA = vec3(0.2126, 0.7152, 0.0722);

  // Only bright light spreads: the beam widens with its brightness.
  vec3 tubeBright(vec2 uv) {
    vec3 c = texture2D(inputBuffer, uv).rgb;
    return c * smoothstep(0.3, 0.9, dot(c, TUBE_LUMA));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (tubeAmount == 0.0) {
      outputColor = inputColor;
      return;
    }
    vec2 halfSize = tubeSize * 0.5;
    vec2 d = vec2(uv.x, 1.0 - uv.y) * tubeSize - halfSize;
    float corner = length(halfSize);
    vec2 source = d * (1.0 + tubeWarp * dot(d, d) / (corner * corner * corner)) + halfSize;
    vec2 warped = vec2(source.x / tubeSize.x, 1.0 - source.y / tubeSize.y);
    vec3 color = texture2D(inputBuffer, warped).rgb;

    // Vertical beam bloom: bright neon bleeds a pixel or two across the
    // overlay's dark scanlines; dark areas keep their gaps.
    vec2 pixel = vec2(0.0, 1.0 / tubeSize.y);
    color += 0.3 * (tubeBright(warped + pixel) + tubeBright(warped - pixel))
      + 0.12 * (tubeBright(warped + 2.0 * pixel) + tubeBright(warped - 2.0 * pixel));

    // The tube's corners fall off a little.
    vec2 n = d / halfSize;
    float edge = clamp(n.x * n.x * n.y * n.y, 0.0, 1.0);
    color *= 1.0 - 0.24 * edge * sqrt(edge);
    outputColor = vec4(mix(inputColor.rgb, color, tubeAmount), inputColor.a);
  }
`

/** The CRT tube stage: beam bloom and corner falloff. Last pass. */
export function createCrtTube() {
  return new Effect('CrtTube', tubeShader, {
    blendFunction: BlendFunction.NORMAL,
    attributes: EffectAttribute.CONVOLUTION,
    uniforms: new Map<string, Uniform>([
      ['tubeSize', new Uniform(new Vector2(1, 1))],
      ['tubeWarp', new Uniform(0)],
      ['tubeAmount', new Uniform(1)],
    ]),
  })
}
