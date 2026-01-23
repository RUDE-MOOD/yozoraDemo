import { CameraControls, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { SkyBox } from "./SkyBox";
import { Suspense } from "react";


// Custom component to clamp camera position manually
const FrameLimiter = () => {
  useFrame(({ camera }) => {
    // Hard limits. 
    // Layer Width: 1000 (Half: 500). Height: 500 (Half: 250).
    // Camera Z: 10. Background Z: -50. Total Dist: 60.
    // Safe bet: X +/- 400, Y +/- 200.

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -400, 400);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, -200, 200);
  });
  return null;
}

export const Experience = () => {
  return (
    <>
      <Suspense fallback={null}>
        <SkyBox />
        <ambientLight intensity={1} />
        <fog attach="fog" args={['#101020', 10, 150]} />
      </Suspense>

      <FrameLimiter />

      <CameraControls
        minZoom={0.5}
        maxZoom={2}
        azimuthRotateSpeed={0}
        polarRotateSpeed={0}
        truckSpeed={5} //ドラッグ速度
        mouseButtons={{
          left: 2, // ACTION.TRUCK
          middle: 0,
          right: 0,
          wheel: 16 // ACTION.ZOOM (Controls magnification/zoom ratio)
        }}
        touches={{
          one: 2, // ACTION.TRUCK
          two: 0,
          three: 0
        }}
        imgui={false}
      />

    </>
  );
};
