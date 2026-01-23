import { CameraControls, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { SkyBox } from "./SkyBox";
import { Suspense } from "react";


export const Experience = () => {
  return (
    <>
      <Suspense fallback={null}>
        <SkyBox />
        <ambientLight intensity={1} />
        <fog attach="fog" args={['#101020', 10, 150]} />
      </Suspense>

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
          two: 0,
          three: 0
        }}
        imgui={false}
      />

    </>
  );
};
