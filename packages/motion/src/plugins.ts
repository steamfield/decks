import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, ScrambleTextPlugin, SplitText);

export {
  CustomEase,
  DrawSVGPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  ScrambleTextPlugin,
  SplitText,
};
