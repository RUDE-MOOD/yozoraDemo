import { Canvas } from "@react-three/fiber";
import { useState, useEffect } from "react";
import { Experience } from "./components/Experience";
import { Effects } from "./components/Effects";
import { UI } from "./components/UI";
import { Leva, useControls } from "leva";
import { useStarStore } from './store/useStarStore';
import { LoginModal } from './components/LoginModal';
import { LoginSuccessScreen } from './components/LoginSuccessScreen';
import { RegisterModal } from './components/RegisterModal';
import { RegisterSuccessScreen } from './components/RegisterSuccessScreen';

// テスト用アカウント（TODO: Supabase認証に置き換え）
const TEST_ACCOUNT = {
  email: 'test@a.com',
  password: '1234abcd',
}

function App() {
  // Zustand storeから星のデータと追加関数を取得
  const { stars, addStar, fetchStars, focusTarget } = useStarStore();

  // Dummy control to ensure Leva panel appears
  useControls({ debugPanel: true });

  // 起動時にsupabaseから星のデータを読み込む
  useEffect(() => {
    fetchStars();
  }, []);

  const [starClickHandler, setStarClickHandler] = useState(() => null);

  // 画面フェーズ: 'login' → 'register' → 'registerSuccess' → 'app'
  //              'login' → 'success' → 'app'
  const [phase, setPhase] = useState('login');

  // Yozora 3Dシーンの表示（registerSuccessのグリッチ中にバックグラウンドで表示開始）
  const [showApp, setShowApp] = useState(false);

  // 星クリックハンドラーをセットする関数
  const handleSetStarClickHandler = (handler) => {
    console.log('handleSetStarClickHandler called with:', handler);
    setStarClickHandler(() => handler);
  };

  return (
    <>
      {phase === 'login' && (
        <LoginModal
          onLogin={async (email, password) => {
            // TODO: Supabase認証ロジックに置き換え
            if (email === TEST_ACCOUNT.email && password === TEST_ACCOUNT.password) {
              setPhase('success');
            } else {
              throw new Error('メールアドレスまたはパスワードが正しくありません');
            }
          }}
          onRegister={() => {
            setPhase('register');
          }}
          onSkip={() => {
            setShowApp(true);
            setPhase('app');
          }}
        />
      )}

      {phase === 'register' && (
        <RegisterModal
          onRegister={async (formData) => {
            // TODO: Supabase登録ロジック
            console.log('Register:', formData);
            setPhase('registerSuccess');
          }}
          onBackToLogin={() => setPhase('login')}
        />
      )}

      {phase === 'success' && (
        <LoginSuccessScreen
          onStartApp={() => {
            setShowApp(true);
          }}
          onGlitchDone={() => {
            setPhase('app');
          }}
        />
      )}

      {/* Yozora 3Dシーン（showAppがtrueになったら表示開始） */}
      {(showApp || phase === 'app') && (
        <>
          <Leva hidden />
          <Canvas
            camera={{ position: [0, 0, 10], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
            dpr={[1, 1.5]}
          >
            <color attach="background" args={['#101020']} />
            <Experience userStars={stars} onStarClick={starClickHandler} focusTarget={focusTarget} />
            <Effects />
          </Canvas>
          <UI onSend={addStar} onStarClick={handleSetStarClickHandler} />
        </>
      )}

      {/* 登録成功画面（グリッチオーバーレイはYozoraの上に残る） */}
      {phase === 'registerSuccess' && (
        <RegisterSuccessScreen
          onStartApp={() => {
            // Yozoraをバックグラウンドで読み込み開始（グリッチの下で）
            setShowApp(true);
          }}
          onGlitchDone={() => {
            // グリッチ完全消失 → 通常のappフェーズへ
            setPhase('app');
          }}
        />
      )}
    </>
  );
}

export default App;

