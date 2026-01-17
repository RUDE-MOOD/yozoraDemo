import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { PerspectiveCamera } from "@react-three/drei";
function App() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >

        <Experience />
      </Canvas>
    </>
  );
}

export default App;
