import { OrbitControls } from "@react-three/drei";
import { SkyDome } from "./Skydome";
import { Earth } from "./Earth";
import { Suspense } from "react";


export const Experience = () => {
  return (
    <>
      <Suspense fallback={null}>
        <SkyDome />
        <Earth />
        <ambientLight intensity={1} />
        <fog attach="fog" args={['#101020', 10, 150]} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 2}
        autoRotate={true}
        autoRotateSpeed={0.05}
      />

    </>
  );
};
