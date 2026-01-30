import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { Experience } from "./components/Experience";
import { Effects } from "./components/Effects";
import { UI } from "./components/UI";
import { Leva } from "leva";
import { useStarStore } from './store/useStarStore';

function App() {
  // Zustand storeから星のデータと追加関数を取得
  const { stars, addStar } = useStarStore();
  // 星の詳細表示関数への参照を保持（関数を状態として保存）
  const [starClickHandler, setStarClickHandler] = useState(() => null);

  // 星クリックハンドラーをセットする関数
  const handleSetStarClickHandler = (handler) => {
    console.log('handleSetStarClickHandler called with:', handler);
    setStarClickHandler(() => handler);
  };

  return (
    <>
      <Leva hidden />
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]} // Optimize for mobile (clamp at 2x)
      >
        <color attach="background" args={['#101020']} />
        <Experience userStars={stars} onStarClick={starClickHandler} />
        <Effects />
      </Canvas>
      <UI onSend={addStar} onStarClick={handleSetStarClickHandler} />
    </>
  );
}

export default App;
