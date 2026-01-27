import { CameraControls, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { SkyBox } from "./SkyBox";
import { MyStars } from "./MyStars";
import { UserAddedStars } from "./UserAddedStars";
import { Suspense } from "react";


// Custom component to clamp camera position manually
const FrameLimiter = () => {
  useFrame(({ camera }) => {
    // Hard limits for position (panning)
    // Background is 1000x500. 
    // Skybox valid area is roughly -500..500.
    // We clamp slightly wider than star generation (-320..320) to allow centering stars at the edge.
    // Max visible width at max zoom (Z=100) is approx 250 units.
    // 320 + 125 = 445 < 500, so edges are still hidden.
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -320, 320);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, -160, 160);
  });
  return null;
}

export const Experience = ({ userStars = [] }) => {
  return (
    <>
      <Suspense fallback={null}>
        <SkyBox />
        {/* <MyStars /> - Temporarily disabled to focus on UserStars */}
        <UserAddedStars stars={userStars} />
        <ambientLight intensity={1} />
        <fog attach="fog" args={['#101020', 10, 150]} />
      </Suspense>

      <FrameLimiter />

      <CameraControls
        minZoom={0.5}        // 最小ズーム倍率 (これ以上縮小できない)
        maxZoom={2}          // 最大ズーム倍率 (これ以上拡大できない)
        minDistance={10}     // カメラの最小距離 (被写体に近づける限界)
        maxDistance={100}    // カメラの最大距離 (被写体から離れられる限界 - これで黒い背景が見えるのを防ぐ)
        azimuthRotateSpeed={0} // 水平方向の回転速度 (0 = 回転無効)
        polarRotateSpeed={0}   // 垂直方向の回転速度 (0 = 回転無効)
        truckSpeed={5}         // 平行移動(ドラッグ)の速度
        mouseButtons={{
          left: 2,   // 左クリック: 2 = TRUCK (平行移動)
          middle: 0, // ミドルクリック: 0 = 無効
          right: 0,  // 右クリック: 0 = 無効
          wheel: 16  // ホイールスクロール: 16 = ZOOM (ズーム)
        }}
        touches={{
          one: 2,    // 1本指タッチ: 2 = TRUCK (平行移動)
          two: 16,   // 2本指タッチ: 16 = ZOOM (ピンチズーム)
          three: 0   // 3本指タッチ: 0 = 無効
        }}
        imgui={false} // デバッグUIの表示 (false = 非表示)
      />

    </>
  );
};
