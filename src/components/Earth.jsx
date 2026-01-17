import * as THREE from 'three'

export const Earth = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <circleGeometry args={[200, 64]} />
      <meshBasicMaterial color="#1a2f1a" />
    </mesh>
  );
};