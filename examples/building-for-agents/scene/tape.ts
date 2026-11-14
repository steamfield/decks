// Ported from ~/Projects/steamfield/src/scripts/night-drive/tape-tracking.ts
// (steamfield commit 53a1a06, read 2026-11-13).
//
// What is kept: the always-on tape character. Luma softened to about 240 TV
// lines with a faint edge ring, whole lines shimmering sideways by a fraction
// of a sample, chroma bleeding to the right and averaging with the line above,
// fine grain that changes every field, the head switch on the bottom six
// lines, and the rare one-line oxide dropout.
//
// What is left out, by Riley's decision for the deck (2026-11-13): the heavy
// mistracking. No noise bars, no rolls, parks or flutters, no torn picture,
// no crash burst. The site's fault schedule (src/lib/tape-faults.ts) is not
// ported at all, so nothing here can draw a bar.
import { Uniform, Vector2 } from 'three'
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'

const tapeShader = /* glsl */ `
  uniform float tapeTime;
  uniform float tapeClock;
  uniform float tapeLine;
  uniform vec2 tapeSize;
  uniform float tapeAmount;
  uniform float chromaAmount;
  uniform float tapeTexture;

  const float SAMPLES = 720.0;
  const vec3 Y_WEIGHTS = vec3(0.299, 0.587, 0.114);

  float tapeHash(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  float tapeHash2(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float tapeNoise(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(tapeHash(i), tapeHash(i + 1.0), f * f * (3.0 - 2.0 * f)) * 2.0 - 1.0;
  }
  vec2 tapeIQ(vec3 rgb) {
    vec2 difference = rgb.rb - rgb.gg;
    return vec2(dot(difference, vec2(0.596, -0.322)),
      dot(difference, vec2(0.211, 0.312)));
  }
  vec3 yiqToRgb(vec3 c) {
    return vec3(
      c.x + 0.956 * c.y + 0.621 * c.z,
      c.x - 0.272 * c.y - 0.647 * c.z,
      c.x - 1.106 * c.y + 1.703 * c.z);
  }
  vec3 tapeEncode(vec3 linear) {
    return mix(12.92 * linear, 1.055 * pow(max(linear, 0.0), vec3(1.0 / 2.4)) - 0.055,
      step(vec3(0.0031308), linear));
  }
  vec3 tapeDecode(vec3 encoded) {
    return mix(encoded / 12.92, pow(max((encoded + 0.055) / 1.055, 0.0), vec3(2.4)),
      step(vec3(0.04045), encoded));
  }
  vec3 tapeTap(vec2 uv) {
    return tapeEncode(texture2D(inputBuffer, uv).rgb);
  }

  // Fit chroma into the RGB gamut by reducing saturation around the original
  // display-space luma. Clipping channels independently would brighten dark edges.
  vec3 tapeGamut(float luma, vec2 iq) {
    vec3 chroma = yiqToRgb(vec3(0.0, iq));
    chroma -= dot(chroma, Y_WEIGHTS);
    vec3 room = mix(vec3(luma), vec3(1.0 - luma), step(vec3(0.0), chroma));
    vec3 limits = room / max(abs(chroma), vec3(0.00001));
    return vec3(luma) + chroma * min(1.0, min(limits.r, min(limits.g, limits.b)));
  }

  // The playback signal at uv as gamma-encoded YIQ. Chroma is filtered in
  // signal space and trails to the right. With tape texture on, luma loses
  // bandwidth and gains a faint edge-enhancement halo to the right of hard
  // edges, and chroma averages with the line above.
  vec3 tapeSignal(vec2 uv) {
    vec3 own = tapeTap(uv);
    float luma = dot(own, Y_WEIGHTS);
    vec2 iq = tapeIQ(own);
    if (chromaAmount == 0.0 && tapeTexture == 0.0) return vec3(luma, iq);
    vec2 chroma = iq;
    float total = 1.0;
    float l1 = luma, l2 = luma, l3 = luma, l5 = luma;
    for (int k = 1; k < 12; k++) {
      float lag = float(k) * 0.5;
      float weight = exp(-float(k) * 0.35);
      vec3 s = tapeTap(uv - vec2(lag / SAMPLES, 0.0));
      chroma += weight * tapeIQ(s);
      total += weight;
      if (k == 1) l1 = dot(s, Y_WEIGHTS);
      if (k == 2) l2 = dot(s, Y_WEIGHTS);
      if (k == 3) l3 = dot(s, Y_WEIGHTS);
      if (k == 5) l5 = dot(s, Y_WEIGHTS);
    }
    iq = mix(iq, chroma / total, chromaAmount);
    if (tapeTexture > 0.0) {
      float right = dot(tapeTap(uv + vec2(1.0 / SAMPLES, 0.0)), Y_WEIGHTS);
      float soft = 0.25 * l2 + 0.5 * luma + 0.25 * right;
      float delayed = 0.25 * l5 + 0.5 * l3 + 0.25 * l1;
      luma = mix(luma, soft + 0.08 * (soft - delayed), tapeTexture);
      vec2 up = uv + vec2(0.0, tapeLine / tapeSize.y);
      vec2 above = (2.0 * tapeIQ(tapeTap(up))
        + 1.5 * tapeIQ(tapeTap(up - vec2(1.0 / SAMPLES, 0.0)))
        + tapeIQ(tapeTap(up - vec2(2.5 / SAMPLES, 0.0)))) / 4.5;
      iq = mix(iq, 0.5 * (iq + mix(iq, above, chromaAmount)), tapeTexture);
    }
    return vec3(luma, iq);
  }

  // Comets with a bright head and a decaying tail, at random gaps. Used only
  // by the head switch on the bottom six lines.
  float tapeStreaks(float x, float line, float field, float density) {
    float sum = 0.0;
    float cell = floor(x / 64.0);
    for (int i = 0; i < 2; i++) {
      float c = cell - float(i);
      vec2 key = vec2(c, line * 1.37 + field * 7.13);
      if (tapeHash2(key) > density) continue;
      float start = (c + tapeHash2(key + 3.1)) * 64.0;
      float len = mix(5.0, 64.0, pow(tapeHash2(key + 5.7), 2.2));
      float d = x - start;
      if (d < 0.0 || d > len) continue;
      float period = mix(3.0, 5.0, tapeHash2(key + 9.2)) * len;
      float tail = 1.0 - d / len;
      sum += cos(PI * d / period) * tail * tail * mix(-1.0, 2.0, tapeHash2(key + 11.4));
    }
    return sum;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    outputColor = inputColor;
    if (chromaAmount == 0.0 && tapeTexture == 0.0 && tapeAmount == 0.0) return;
    float lines = tapeSize.y / tapeLine;
    float y = (1.0 - uv.y) * lines;
    float line = floor(y);
    float x = uv.x * SAMPLES;
    float clockField = floor(tapeClock * 60.0);
    float shift = 0.0;

    // Time-base wobble shimmers whole lines by a fraction of a sample; the
    // head switch shears the bottom six lines sideways.
    float headSwitch = 0.0;
    if (tapeTexture > 0.0) {
      shift += 0.6 * tapeTexture * clamp(0.7 * tapeNoise(line / 23.0 + tapeClock * 1.3)
        + 0.3 * tapeNoise(line / 5.3 + tapeClock * 4.1 + 50.0), -1.0, 1.0);
      float fromBottom = floor(lines - y);
      if (fromBottom < 6.0) {
        headSwitch = (1.0 - fromBottom / 6.0) * tapeTexture;
        shift -= 12.0 * headSwitch * headSwitch
          + 2.0 * headSwitch * tapeHash2(vec2(line, clockField));
      }
    }

    vec3 color = inputColor.rgb;
    if (shift != 0.0 || chromaAmount > 0.0 || tapeTexture > 0.0) {
      vec2 sampled = uv + vec2(shift / SAMPLES, 0.0);
      vec3 signal = tapeSignal(sampled);
      float luma = signal.x;
      vec2 iq = signal.yz;
      if (headSwitch > 0.0) {
        luma += headSwitch * (0.35 * tapeStreaks(x, line + 401.0, clockField, 0.7)
          + 0.03 * tapeNoise(x * 0.4 + tapeHash2(vec2(line, clockField + 0.5)) * 100.0));
        iq *= 1.0 - 0.5 * headSwitch;
      }
      if (tapeTexture > 0.0) {
        // Chroma noise streaks along the line; luma grain changes every field
        // and is a little heavier in the dark.
        vec2 seeds = vec2(tapeHash2(vec2(line, clockField)), tapeHash2(vec2(line + 0.5, clockField)));
        iq += 0.02 * tapeTexture * vec2(tapeNoise(x / 45.0 + seeds.x * 97.0),
          tapeNoise(x / 45.0 + seeds.y * 97.0 + 31.0));
        float grain = tapeHash2(vec2(floor(x * 2.0) + 0.37, gl_FragCoord.y + clockField * 0.61)) * 2.0 - 1.0;
        luma += tapeTexture * 0.015 * mix(1.4, 0.8, clamp(luma, 0.0, 1.0)) * grain;
        luma = max(luma, 0.0);
      }
      color = tapeDecode(tapeGamut(luma, iq));
    }

    // Occasional oxide dropouts: a short white comet on one or two lines for
    // two fields, anywhere in the picture.
    float slot = floor(tapeTime / 2.7);
    float when = slot * 2.7 + 0.3 + tapeHash(slot * 5.0 + 1.0) * 2.0;
    if (tapeAmount > 0.0 && tapeHash(slot * 5.0 + 2.0) < 0.35
      && tapeTime >= when && tapeTime < when + 2.0 / 60.0) {
      float dropLine = floor(tapeHash(slot * 5.0 + 3.0) * lines);
      float d = x - tapeHash(slot * 5.0 + 4.0) * 620.0;
      float len = mix(30.0, 140.0, tapeHash(slot * 5.0 + 5.0));
      float weight = line == dropLine ? 1.0 : line == dropLine + 1.0 ? 0.45 : 0.0;
      if (weight > 0.0 && d >= 0.0 && d <= len) {
        float tail = 1.0 - d / len;
        color = tapeDecode(mix(tapeEncode(color), vec3(0.92),
          cos(PI * d / (4.0 * len)) * tail * tail * weight * tapeAmount));
      }
    }
    outputColor = vec4(color, inputColor.a);
  }
`

/** Tape playback before CRT bloom: tape character, chroma bleed, rare dropouts. */
export function createTape() {
  return new Effect('Tape', tapeShader, {
    blendFunction: BlendFunction.NORMAL,
    attributes: EffectAttribute.CONVOLUTION,
    uniforms: new Map<string, Uniform>([
      ['tapeTime', new Uniform(0)],
      ['tapeClock', new Uniform(0)],
      ['tapeLine', new Uniform(3)],
      ['tapeSize', new Uniform(new Vector2(1, 1))],
      ['tapeAmount', new Uniform(1)],
      ['chromaAmount', new Uniform(1)],
      ['tapeTexture', new Uniform(1)],
    ]),
  })
}
