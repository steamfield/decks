import { useSlide } from "@steamfield/decks";
import { ink, Scene3D, theme } from "@steamfield/decks/kit";
import { duration, ease } from "@steamfield/decks/motion";
import type { ComponentProps } from "react";
import { channels, engraving, silhouette } from "./Fish";

function blockFace() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 540;
  const brush = canvas.getContext("2d");
  if (!brush) throw new Error("Cannot draw the linocut block without a 2D canvas");
  const { accents } = theme();
  brush.scale(2, 2);
  brush.fillStyle = ink("amber", 2);
  brush.fillRect(0, 0, 600, 270);
  brush.fillStyle = accents.blue;
  brush.fill(new Path2D(silhouette));
  brush.fillStyle = ink("amber", 2);
  for (const cut of engraving) brush.fill(new Path2D(cut));
  brush.fill(new Path2D("M117 135a12 12 0 1 0 -24 0a12 12 0 1 0 24 0"));
  brush.fillStyle = accents.blue;
  brush.fill(new Path2D("M108 135a5 5 0 1 0 -10 0a5 5 0 1 0 10 0"));
  brush.strokeStyle = ink("amber", 2);
  brush.lineWidth = 4;
  brush.lineCap = "round";
  for (const { d } of channels) brush.stroke(new Path2D(d));
  return canvas;
}

const setup: ComponentProps<typeof Scene3D>["setup"] = ({ three, scene, camera }, tl, beat) => {
  const { text } = theme();
  const texture = new three.CanvasTexture(blockFace());
  texture.colorSpace = three.SRGBColorSpace;
  const edge = new three.MeshBasicMaterial({ color: ink("amber", 1) });
  const top = new three.MeshBasicMaterial({ map: texture });
  const stock = new three.MeshBasicMaterial({ color: text.highlight });
  const bamboo = new three.MeshStandardMaterial({ color: ink("amber", 3), roughness: 0.85 });
  const grip = new three.MeshStandardMaterial({ color: text.primary });
  const block = new three.Mesh(new three.BoxGeometry(6, 0.32, 2.7), [
    edge,
    edge,
    top,
    edge,
    edge,
    edge,
  ]);
  const sheet = new three.Mesh(new three.BoxGeometry(6.4, 0.035, 3.15), stock);
  const pad = new three.Mesh(new three.CylinderGeometry(0.76, 0.8, 0.14, 48), bamboo);
  const handle = new three.Mesh(new three.TorusGeometry(0.28, 0.085, 12, 32, Math.PI), grip);
  handle.position.y = 0.075;
  pad.add(handle);
  const lamp = new three.DirectionalLight(text.highlight, 2);
  lamp.position.set(-3, 5, 4);
  scene.add(block, sheet, pad, lamp, new three.AmbientLight(text.highlight, 1.4));
  camera.fov = 32;
  camera.position.set(4.3, 5.6, 9.4);
  camera.lookAt(0, 0.65, 0);
  camera.updateProjectionMatrix();
  beat(0);
  sheet.position.set(-0.95, 1.5, -0.65);
  sheet.rotation.z = -0.12;
  pad.position.set(-2.2, 2.4, -0.4);
  const land = { duration: duration.slow, ease: ease.settle };
  tl.to(sheet.position, { x: 0, y: 0.18, z: 0, ...land });
  tl.to(sheet.rotation, { z: 0, ...land }, "<");
  tl.to(pad.position, { x: -2.3, y: 0.27, z: -0.4, ...land }, "<");
  beat(1);
  const rub = { duration: duration.slow, ease: ease.draw };
  tl.to(pad.position, {
    motionPath: {
      path: [
        { x: -0.7, z: -0.52 },
        { x: 1.15, z: -0.25 },
        { x: 2.45, z: -0.05 },
      ],
    },
    ...rub,
  });
  beat(2);
  tl.to(pad.position, {
    motionPath: {
      path: [
        { x: 1.3, z: 0.34 },
        { x: -0.65, z: 0.52 },
        { x: -2.3, z: 0.23 },
      ],
    },
    ...rub,
  });
  beat(3);
  return () => {
    for (const mesh of [block, sheet, pad, handle]) mesh.geometry.dispose();
    for (const material of [edge, top, stock, bamboo, grip]) material.dispose();
    texture.dispose();
  };
};

export function PrintPress() {
  const { clicks } = useSlide();
  const pose = ["ready", "contact", "rubbed", "return"][clicks];
  return (
    <div>
      <Scene3D
        setup={setup}
        label="A sheet settles onto the inked block and a baren rubs its back."
        poster={<img src={`./press-${pose}.png`} alt="" />}
      />
    </div>
  );
}
