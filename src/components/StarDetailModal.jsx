/*
  [星の詳細モーダル - リデザイン版]

  ＝＝＝ 概要 ＝＝＝
  ユーザーが3D空間上の星をクリックした際に、
  その星の詳細情報を表示するモーダルコンポーネント。
  すりガラス（グラスモーフィズム）デザインを採用。

  ＝＝＝ 構成 ＝＝＝
  1. AI褒め言葉カード（モーダル上部に独立浮動）
  2. メインモーダル本体:
     - 埋め込み3D星プレビュー（R3F Canvas）
     - 日付（年/月/日のみ）
     - 感情
     - 3 Good Things

  ＝＝＝ データフロー ＝＝＝
  UserStar.jsx → UserAddedStars.jsx → Experience.jsx → App.jsx → UI.jsx → StarDetailModal.jsx
  
  starDataの中身:
  {
    id, position, color, scale, random, date, display_date, text,
    mood_values, analysis_data: { emotion, feedback, goodThings }
  }
*/

import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Billboard, shaderMaterial } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { getFallbackAnalysis } from '../utils/fallbackAnalysis';

// --- SingleStarMaterial（UserStar.jsxと同一のシェーダー） ---
const PreviewStarMaterial = shaderMaterial(
    {
        time: 0,
        baseBrightness: 1.0,
        color: new THREE.Color(1.0, 1.0, 1.0),
        random: 0.0,
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
    uniform float random;
    
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv - 0.5;
      float d = length(uv);

      // Glow (発光)
      float core = exp(-d * 6.0);
      float center = exp(-d * d * 80.0);
      core = core * 0.6 + center * 0.9;

      // Spikes (光条/レンズフレア)
      float spikeH = 0.02 / (abs(uv.y) + 0.02) * (1.0 - smoothstep(0.0, 0.4, abs(uv.x)));
      float spikeV = 0.02 / (abs(uv.x) + 0.02) * (1.0 - smoothstep(0.0, 0.4, abs(uv.y)));
      float spikes = pow(spikeH + spikeV, 1.5);

      float brightness = (core * 1.2 + spikes * 0.8) * baseBrightness;

      // Twinkle (瞬き)
      float twinkle = sin(time * 1.5 + random * 10.0) * 0.15 + 0.85;
      brightness *= twinkle;

      vec3 finalColor = color * brightness;

      float alpha = smoothstep(0.05, 1.0, brightness);
      alpha *= 1.0 - smoothstep(0.4, 0.5, d);

      if (alpha < 0.01) discard;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ PreviewStarMaterial });

// --- 埋め込み3D星コンポーネント ---
function StarPreview({ color, random: starRandom }) {
    const materialRef = useRef();

    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.time += delta;
        }
    });

    const starColor = color
        ? new THREE.Color(color.r, color.g, color.b)
        : new THREE.Color(1, 1, 1);

    return (
        <Billboard>
            <mesh scale={[2.5, 2.5, 1]}>
                <planeGeometry args={[1, 1]} />
                <previewStarMaterial
                    ref={materialRef}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    color={starColor}
                    random={starRandom || 0.5}
                />
            </mesh>
        </Billboard>
    );
}

// --- 日付フォーマット（年/月/日のみ） ---
function formatDateOnly(displayDate) {
    if (!displayDate) return '';
    // "26/1/27 16:02" → "2026/01/27" or similar
    // Try to parse and reformat
    const parts = displayDate.split(' ')[0]; // Remove time portion
    if (!parts) return displayDate;

    const segments = parts.split('/');
    if (segments.length === 3) {
        // YY/MM/DD → YYYY/MM/DD
        const year = segments[0].length <= 2 ? `20${segments[0]}` : segments[0];
        const month = segments[1].padStart(2, '0');
        const day = segments[2].padStart(2, '0');
        return `${year}/${month}/${day}`;
    }
    return parts;
}

// --- メインコンポーネント ---
export const StarDetailModal = ({ isOpen, onClose, starData }) => {
    if (!isOpen || !starData) return null;

    // 感情分析データ取得（なければフォールバック）
    const analysis = starData.analysis_data || {};
    const moodValuesForAnalysis = analysis.moodValues ?? starData.mood_values;
    let displayAnalysis = null;
    if (analysis.emotion && analysis.feedback) {
        displayAnalysis = { emotion: analysis.emotion, feedback: analysis.feedback };
    } else if (moodValuesForAnalysis) {
        const fallback = getFallbackAnalysis(moodValuesForAnalysis, analysis.goodThings);
        displayAnalysis = { emotion: fallback.emotion, feedback: fallback.feedback };
    }
    const hasAnalysis = !!displayAnalysis;

    // Good Things取得
    const goodThings = analysis.goodThings || {};
    const goodThingsList = [goodThings.goodThing1, goodThings.goodThing2, goodThings.goodThing3].filter(Boolean);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* バックドロップ */}
            <div
                className="absolute inset-0 bg-black/20 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* モーダル全体コンテナ（AI褒め言葉 + 本体を縦に並べる） */}
            <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-sm mx-auto">

                {/* ===== AI褒め言葉カード（独立浮動） ===== */}
                {hasAnalysis && displayAnalysis.feedback && (
                    <div className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 max-h-[120px] overflow-y-auto scrollbar-hidden">
                        <p className="text-white/90 text-sm leading-relaxed text-center font-sans">
                            {displayAnalysis.feedback}
                        </p>
                    </div>
                )}

                {/* ===== メインモーダル本体 ===== */}
                <div className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl shadow-black/40 max-h-[70vh] overflow-y-auto scrollbar-hidden">
                    <div className="px-6 py-8">

                        {/* 閉じるボタン (X) */}
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={onClose}
                                className="text-white/50 hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
                                aria-label="閉じる"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* 埋め込み3D星プレビュー */}
                        <div className="flex justify-center mb-6">
                            <div style={{ width: 100, height: 100 }}>
                                <Canvas
                                    gl={{ alpha: true, antialias: true }}
                                    camera={{ position: [0, 0, 3], fov: 50 }}
                                    style={{ background: 'transparent' }}
                                >
                                    <StarPreview
                                        color={starData.color}
                                        random={starData.random}
                                    />
                                </Canvas>
                            </div>
                        </div>

                        {/* 日付 */}
                        <div className="text-center mb-6">
                            <p className="text-white/50 text-xs tracking-[0.2em] font-sans mb-1">日付</p>
                            <p className="text-white/95 text-lg font-sans tracking-wide">
                                {formatDateOnly(starData.display_date)}
                            </p>
                        </div>

                        {/* 感情 */}
                        {hasAnalysis && displayAnalysis.emotion && (
                            <div className="text-center mb-6">
                                <p className="text-white/50 text-xs tracking-[0.2em] font-sans mb-1">感情</p>
                                <p className="text-white/95 text-lg font-sans tracking-wide">
                                    {displayAnalysis.emotion}
                                </p>
                            </div>
                        )}

                        {/* 3 Good Things */}
                        {goodThingsList.length > 0 && (
                            <div className="mb-4">
                                <p className="text-white/50 text-xs tracking-[0.2em] font-sans mb-3 text-center">3 Good Things</p>
                                <div className="space-y-2.5">
                                    {goodThingsList.map((thing, index) => (
                                        <div key={index} className="flex items-start gap-3 px-2">
                                            <span className="text-white/60 text-sm mt-0.5 flex-shrink-0">•</span>
                                            <p className="text-white/90 text-sm leading-relaxed font-sans break-words min-w-0">
                                                {thing}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};
