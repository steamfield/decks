import { resolveTheme, Scene3D } from "@steamfield/decks/kit";
import { duration, ease } from "@steamfield/decks/motion";
import type { ComponentProps } from "react";

const { ramps } = resolveTheme();

// Three server racks, the middle one in the accent; the camera moves in on click 1.
const setup: ComponentProps<typeof Scene3D>["setup"] = ({ three, scene, camera }, tl, beat) => {
  const geometry = new three.BoxGeometry(1.2, 2.6, 1.2);
  const quiet = new three.MeshStandardMaterial({ color: ramps.slate[1] });
  const loud = new three.MeshStandardMaterial({ color: ramps.rose[2] });
  const racks = [-2, 0, 2].map((x) => {
    const rack = new three.Mesh(geometry, x === 0 ? loud : quiet);
    rack.position.x = x;
    return rack;
  });
  const key = new three.DirectionalLight("white", 2);
  key.position.set(-3, 5, 5);
  scene.add(...racks, key, new three.AmbientLight("white", 1));
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  beat(0);
  tl.to(camera.position, { z: 4.5, duration: duration.slow, ease: ease.settle });
  beat(1);
  return () => {
    geometry.dispose();
    quiet.dispose();
    loud.dispose();
  };
};

function RackPoster() {
  return (
    <svg width="100%" height="100%" viewBox="-600 -300 1200 600" aria-hidden="true">
      {[-281, 0, 281].map((x) => (
        <rect
          key={x}
          x={x - 98}
          y={-192}
          width={196}
          height={385}
          fill={x === 0 ? ramps.rose[2] : ramps.slate[1]}
        />
      ))}
    </svg>
  );
}

export function RackScene() {
  return (
    <div style={{ width: "100%", height: 640 }}>
      <Scene3D
        label="Three server racks; the middle one is highlighted"
        setup={setup}
        poster={<RackPoster />}
      />
    </div>
  );
}
