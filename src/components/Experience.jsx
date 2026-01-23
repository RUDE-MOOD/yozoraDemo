import { CameraControls, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { SkyBox } from "./SkyBox";
import { Suspense } from "react";


// Custom component to clamp camera position manually
const FrameLimiter = () => {
  useFrame(({ camera }) => {
    // Hard limits. 
    // Layer Width: 240 (Half: 120). Height: 120 (Half: 60).
    // Camera Z: 10. Background Z: -50. Total Dist: 60.
    // FOV 50 vertical.
    // Visible Height at -50 = 2 * 60 * tan(25deg) ~= 2 * 60 * 0.466 = 56.
    // Visible Width at -50 (Aspect ~2?) ... let's assume worst case 16:9.
    // Safe bet: X +/- 60, Y +/- 25.

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -60, 60);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, -25, 25);
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
        minZoom={1}
        maxZoom={1}
        azimuthRotateSpeed={0}
        polarRotateSpeed={0}
        truckSpeed={1}
        mouseButtons={{
          left: 2, // ACTION.TRUCK
          middle: 0,
          right: 0,
          wheel: 0
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
