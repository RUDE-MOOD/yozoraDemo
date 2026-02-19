/*
  [未来の自分へのメッセージ入力モーダル - リデザイン版]

  ＝＝＝ 概要 ＝＝＝
  未来の自分に向けたメッセージを入力するモーダル。
  すりガラスデザイン + 埋め込み3D光球 + ドラッグで送信。

  ＝＝＝ 構成（上から下） ＝＝＝
  1. 「上にスワイプすると送れます」提示テキスト
  2. X 閉じるボタン（右上）
  3. 埋め込みR3F Canvas（ドラッグ可能な光球 — FutureStar.jsxと同一シェーダー）
  4. ↑↑ 矢印アイコン
  5. 説明テキスト
  6. テキストエリア（メッセージ入力）

  ＝＝＝ 送信インタラクション ＝＝＝
  - PCの場合: マウス左ボタンで星をドラッグ → モーダル外に出すと送信 → 離すと元に戻る
  - スマホの場合: タッチで星をドラッグ → モーダル外に出すと送信 → 離すと元に戻る
  - テキストが空の場合は送信不可
*/

import { useState, useRef, useCallback, useEffect } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { Billboard, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useFutureMessageStore } from "../../../store/useFutureMessageStore";

// --- 光球シェーダー（FutureStar.jsxと同一のオーブ型シェーダー） ---
const FuturePreviewMaterial = shaderMaterial(
  {
    time: 0,
    baseBrightness: 1.5,
    color: new THREE.Color(0.6, 0.8, 1.0),
    pulseSpeed: 2.0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform float baseBrightness;
    uniform vec3 color;
    uniform float pulseSpeed;
    
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv - 0.5;
      float d = length(uv);

      // Unique Glow pattern (More intense, halo-like)
      float core = exp(-d * 4.0);
      float ring = smoothstep(0.3, 0.35, d) * smoothstep(0.4, 0.35, d) * 0.5;
      float center = exp(-d * d * 60.0);
      
      float brightness = (core + center + ring) * baseBrightness;

      // Pulse animation
      float pulse = sin(time * pulseSpeed) * 0.2 + 0.8;
      brightness *= pulse;
      
      // Color shift
      vec3 finalColor = color + vec3(sin(time), cos(time), sin(time * 0.5)) * 0.1;
      finalColor *= brightness;

      float alpha = smoothstep(0.05, 1.0, brightness);
      alpha *= 1.0 - smoothstep(0.45, 0.5, d);

      if (alpha < 0.01) discard;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
);

extend({ FuturePreviewMaterial });

// --- 埋め込み3D光球（FutureStar.jsxと同じ外観） ---
function FutureStarPreview() {
  const materialRef = useRef();

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.time += delta;
    }
  });

  return (
    <Billboard>
      <mesh scale={[3, 3, 1]}>
        <planeGeometry args={[1, 1]} />
        <futurePreviewMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
}

// --- メインコンポーネント ---
export const FutureMessageInputModal = () => {
  const { isInputModalOpen, setInputModalOpen, saveFutureMessage, loading } =
    useFutureMessageStore();
  const [message, setMessage] = useState("");

  // ドラッグ状態
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const starContainerRef = useRef(null);
  const modalRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  // --- 送信処理 ---
  const handleSend = useCallback(async () => {
    if (!message.trim() || loading) return;
    await saveFutureMessage(message);
    setMessage("");
    setInputModalOpen(false);
  }, [message, loading, saveFutureMessage, setInputModalOpen]);

  // --- モーダル外判定 ---
  const isOutsideModal = useCallback((clientX, clientY) => {
    if (!modalRef.current) return false;
    const rect = modalRef.current.getBoundingClientRect();
    return (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    );
  }, []);

  // ===== マウスイベント（PC） =====
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseMove = useCallback((e) => {
    setDragOffset({
      x: e.clientX - startPosRef.current.x,
      y: e.clientY - startPosRef.current.y,
    });
  }, []);

  const handleMouseUp = useCallback(
    (e) => {
      if (isOutsideModal(e.clientX, e.clientY) && message.trim()) {
        handleSend();
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
      setIsDragging(false);
    },
    [message, isOutsideModal, handleSend],
  );

  // ===== タッチイベント（スマホ） =====
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - startPosRef.current.x,
      y: touch.clientY - startPosRef.current.y,
    });
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const touch = e.changedTouches[0];
      if (isOutsideModal(touch.clientX, touch.clientY) && message.trim()) {
        handleSend();
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
      setIsDragging(false);
    },
    [message, isOutsideModal, handleSend],
  );

  // グローバルイベントリスナー（ドラッグ中はウィンドウ全体で追跡）
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  if (!isInputModalOpen) return null;

  // 星が十分ドラッグされているか（送信可能な視覚フィードバック用）
  const dragDistance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);
  const isNearEdge = dragDistance > 80;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* バックドロップ */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={() => setInputModalOpen(false)}
      />

      {/* モーダル本体 */}
      <div
        ref={modalRef}
        className="relative w-full max-w-sm mx-auto bg-black/30 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl shadow-black/40"
        style={{ padding: "32px" }}
      >
        {/* 上部テキスト: 「上にスワイプすると送れます」 */}
        {/* <p className="text-white/60 text-xs text-center tracking-[0.15em] font-sans mb-2">
          上にスワイプすると送れます
        </p> */}

        {/* 閉じるボタン */}
        <div className="absolute top-5 right-5">
          <button
            onClick={() => setInputModalOpen(false)}
            className="text-white/50 hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
            aria-label="閉じる"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ドラッグ可能な3D光球 */}
        <div className="flex justify-center mb-2">
          <div
            ref={starContainerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="cursor-grab active:cursor-grabbing select-none touch-none"
            style={{
              width: 120,
              height: 120,
              position: "relative",
              transform: isDragging
                ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${isNearEdge ? 1.1 : 1.0})`
                : "translate(0, 0) scale(1)",
              transition: isDragging
                ? "none"
                : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              opacity: isDragging && isNearEdge ? 0.8 : 1,
              zIndex: isDragging ? 100 : 1,
            }}
          >
            <Canvas
              gl={{ alpha: true, antialias: true }}
              camera={{ position: [0, 0, 3], fov: 50 }}
              style={{
                background: "transparent",
                pointerEvents: "none",
                width: "100%",
                height: "100%",
              }}
            >
              <FutureStarPreview />
            </Canvas>
          </div>
        </div>

        {/* ↑↑ 矢印アイコン */}
        <div className="flex justify-center gap-1 mb-4 text-white/40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
            />
          </svg>
        </div>

        {/* 説明テキスト */}
        <p
          className="text-white/80 text-sm text-center leading-relaxed font-sans mb-5 px-2"
          style={{ padding: "20px", fontSize: "12px" }}
        >
          今の気持ちや未来の自分に伝えたいことを書いてください。
          <br />
          この星はあなたが落ち込んでいる時に再び現れます。
        </p>

        {/* テキストエリア */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="未来の自分へ..."
          maxLength={500}
          className="w-full h-32 px-4 py-3 bg-white/15 border-0 rounded-xl text-white/90 placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors resize-none scrollbar-hidden"
          style={{ padding: "10px" }}
        />

        {/* テキストが空の場合のヒント */}
        {!message.trim() && (
          <p
            className="text-white/30 text-xs text-center mt-3 font-sans"
            style={{ paddingTop: "20px" }}
          >
            メッセージを入力してから星を上にスワイプしてください
          </p>
        )}
      </div>
    </div>
  );
};
