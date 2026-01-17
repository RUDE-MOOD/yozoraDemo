import { Environment, OrbitControls } from "@react-three/drei";


export const Experience = () => {
  return (
    <>
      <OrbitControls />
      <Environment preset="city" />
      <mesh position={[0, 0, 0]} rotation-y={Math.PI / 4}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 3, 5]} intensity={0.5} />
    </>
  );
};
