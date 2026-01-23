import { CameraControls, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { SkyBox } from "./SkyBox";
import { Suspense } from "react";


// Custom component to clamp camera position manually
const FrameLimiter = () => {
  useFrame(({ camera }) => {
    // Hard limits for position (panning)
    // Background is 1000x500. 
    // Clamp X to -400..400 and Y to -200..200 to keep edges hidden.
    // We do NOT clamp Z here, to allow zooming via CameraControls.
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -300, 300);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, -150, 150);
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
        minZoom={0.5}        // Limit zoom level
        maxZoom={2}          // Limit max zoom
        minDistance={10}     // Closest distance (camera start is 10)
        maxDistance={100}    // Furthest distance (prevents infinite shrink)
        azimuthRotateSpeed={0}
        polarRotateSpeed={0}
        truckSpeed={5}
        mouseButtons={{
          left: 2,
          middle: 0,
          right: 0,
          wheel: 16
        }}
        touches={{
          one: 2,
          two: 16, // 16: ZOOM
          three: 0
        }}
        imgui={false}
      />

    </>
  );
};
