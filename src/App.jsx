import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { PerspectiveCamera } from "@react-three/drei";
function App() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]} // Optimize for mobile (clamp at 2x)
      >
        <color attach="background" args={['#101020']} />
        <Experience />
      </Canvas>
    </>
  );
}

export default App;
