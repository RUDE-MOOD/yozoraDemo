import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { Effects } from "./components/Effects";
import { UI } from "./components/UI";
import { Leva } from "leva";

function App() {
  return (
    <>
      <Leva hidden />
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]} // Optimize for mobile (clamp at 2x)
      >
        <color attach="background" args={['#101020']} />
        <Experience />
        <Effects />
      </Canvas>
      <UI />
    </>
  );
}

export default App;
