import * as THREE from 'three'
import { shaderMaterial, Billboard, Text } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'

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
)

extend({ SingleStarMaterial })

export function UserStar({ position, color, scale, random, date }) {
  const materialRef = useRef()

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.time += delta
    }
  })

  const handleClick = (e) => {
    e.stopPropagation();
    console.log('Star clicked!');
    console.log(`日付：${date}、座標:${position}`);

  };

  return (
    <group position={position}>
      <Billboard>
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
      </Billboard>
    </group>
  )
}
