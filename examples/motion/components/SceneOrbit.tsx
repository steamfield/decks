import { resolveTheme, Scene3D } from "@steamfield/decks/kit";
import { duration, ease } from "@steamfield/decks/motion";
import { type ComponentProps, useId } from "react";
import "./SceneOrbit.css";

const { ramps } = resolveTheme();
const setup: ComponentProps<typeof Scene3D>["setup"] = ({ three, scene, camera }, tl, beat) => {
  const sphere = new three.Mesh(
    new three.SphereGeometry(0.75, 48, 32),
    new three.MeshStandardMaterial({ color: ramps.emerald[2] }),
  );
  const ring = new three.Mesh(
    new three.TorusGeometry(0.7, 0.17, 24, 64),
    new three.MeshStandardMaterial({ color: ramps.slate[2] }),
  );
  const cube = new three.Mesh(
    new three.BoxGeometry(1.4, 1.4, 1.4),
    new three.MeshStandardMaterial({ color: ramps.amber[1] }),
  );
  sphere.position.set(-2, 0.05, 0.5);
  ring.position.set(0, 0.35, -0.65);
  cube.position.set(2.15, -0.15, 0.25);

  const key = new three.DirectionalLight("white", 2);
  key.position.set(-3, 5, 5);
  const pivot = new three.Group();
  pivot.add(camera);
  scene.add(sphere, ring, cube, key, new three.AmbientLight("white", 1.2), pivot);
  camera.fov = 35;
  camera.position.z = 12;
  beat(0);
  tl.to(camera.position, { z: 12.3, duration: duration.quick, ease: ease.settle });
  tl.to(camera.position, { z: 7.85, duration: duration.base, ease: ease.settle });
  tl.to(camera.position, { z: 8, duration: duration.quick, ease: ease.settle });
  beat(1);
  tl.to(pivot.rotation, { y: Math.PI / 6, duration: duration.slow, ease: ease.settle });
  beat(2);
  return () => {
    for (const mesh of [sphere, ring, cube]) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  };
};

function Poster() {
  const light = useId();
  return (
    <svg width="100%" height="100%" viewBox="-600 -300 1200 600" aria-hidden="true">
      <defs>
        <radialGradient id={light} cx="32%" cy="24%" r="80%">
          <stop stopColor={ramps.emerald[3]} />
          <stop offset="1" stopColor={ramps.emerald[0]} />
        </radialGradient>
      </defs>
      <ellipse cx="-222" cy="-6" rx="86" ry="84" fill={`url(#${light})`} />
      <ellipse
        cx="39"
        cy="-39"
        rx="72"
        ry="78"
        fill="none"
        stroke={ramps.slate[2]}
        strokeWidth="36"
      />
      <path d="M115 -81 L330 -91 V141 L115 125 Z" fill={ramps.amber[2]} />
      <path d="M330 -91 L368 -75 V116 L330 141 Z" fill={ramps.amber[0]} />
    </svg>
  );
}

export function SceneOrbit() {
  return (
    <div className="orbit-studio">
      <Scene3D label="Three studio forms" setup={setup} poster={<Poster />} />
    </div>
  );
}
