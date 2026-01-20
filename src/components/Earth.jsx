import { MeshReflectorMaterial, Float, Sparkles, Icosahedron } from "@react-three/drei";

export const Earth = () => {
  return (
    <group position={[0, -2, 0]}>
      {/* The Water Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[200, 64]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024} // Reduced for mobile performance
          mixBlur={1}
          mixStrength={80}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#ffffff"
          metalness={0.5}
          mirror={1}
          distortion={1} // High distortion for waves
          distortionScale={2}
          temporalDistortion={0.1} // Speed of movement
        />
      </mesh>



      <Sparkles
        scale={[50, 20, 50]}
        position={[0, 10, 0]}
        count={500}
        size={10}
        speed={1}
        opacity={0.7}
        color="#ffffff"
      />
    </group>
  );
};