import * as THREE from "three";
import { shaderMaterial, Text } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useUserStore } from "../../../store/useUserStore";

// --- SingleStarMaterial ---
// MyStarMaterialを単一の星用に調整したシェーダー
// 個別のプロパティ（Attributes）の代わりに、Uniformsを使用して各値を設定します
const SingleStarMaterial = shaderMaterial(
  {
    time: 0,
    baseBrightness: 1.0,
    color: new THREE.Color(1.0, 1.0, 1.0),
    random: 0.0,
  },
  // Vertex Shader
  `
    uniform vec3 color; // explicitly declare uniform used in fallback
    
    varying vec2 vUv;
    varying vec3 vColor;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 localPosition = vec4(position, 1.0);
      
      #ifdef USE_INSTANCING
        vec4 mPosition = instanceMatrix * localPosition;
        #ifdef USE_INSTANCING_COLOR
          vColor = instanceColor;
        #else
          vColor = color;
        #endif
      #else
        vec4 mPosition = localPosition;
        vColor = color;
      #endif
      
      // modelMatrix is defined by Three.js
      vWorldPosition = (modelMatrix * mPosition).xyz;
      
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * mPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform float baseBrightness;
    uniform vec3 color;
    uniform float random;
    
    varying vec2 vUv;
    varying vec3 vColor;
    varying vec3 vWorldPosition;

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

      // Twinkle (瞬き) - use world position x + y for random phase if instanced
      #ifdef USE_INSTANCING
        float r = fract(sin(dot(vWorldPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float twinkle = sin(time * 1.5 + r * 10.0) * 0.15 + 0.85;
      #else
        float twinkle = sin(time * 1.5 + random * 10.0) * 0.15 + 0.85;
      #endif
      brightness *= twinkle;

      vec3 finalColor = vColor * brightness;

      float alpha = smoothstep(0.05, 1.0, brightness);
      alpha *= 1.0 - smoothstep(0.4, 0.5, d);

      if (alpha < 0.01) discard;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
);

extend({ SingleStarMaterial });

export function UserStar({
  position,
  color,
  scale,
  random,
  date,
  starData,
  onStarClick,
}) {
  const materialRef = useRef();
  const { showStarDate } = useUserStore();

  // マウント時に、この星が新しく作られたものか判定（isJustCreatedフラグ）
  const isNewRef = useRef(starData?.isJustCreated === true);
  const elapsedRef = useRef(0);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.time += delta;

      if (isNewRef.current) {
        elapsedRef.current += delta;
        // 1.5秒待機（カメラが移動する時間）後、1.5秒かけてフェードイン
        const progress = Math.min(
          Math.max((elapsedRef.current - 1.5) / 1.5, 0.0),
          1.0,
        );
        materialRef.current.baseBrightness = progress;
      } else {
        materialRef.current.baseBrightness = 1.0;
      }
    }
  });

  const handleClick = (e) => {
    // クリックされた星の情報しか表示されない
    e.stopPropagation();
    // ＝＝＝＝＝＝＝＝＝＝＝
    console.log("=== Star clicked! ===");
    console.log(`日付：${date}、座標:${position}`);
    console.log("onStarClick:", onStarClick);
    console.log("starData:", starData);

    // モーダルを開く
    if (onStarClick && starData) {
      console.log("Calling onStarClick with starData");
      onStarClick(starData);
    } else {
      console.warn("onStarClick or starData is missing!");
    }
  };

  return (
    <group position={position}>
      <mesh scale={[scale, scale, 1]} onClick={handleClick}>
        <planeGeometry args={[1, 1]} />
        <singleStarMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color={color}
          random={random}
        />
      </mesh>
      {/* 日付ラベル */}
      {showStarDate && (
        <Text
          position={[0, -scale * 0.6, 0]} // 星の下に配置
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {date}
        </Text>
      )}
    </group>
  );
}