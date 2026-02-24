import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { DistantStars } from '../stars/DistantStars'

// テーマ変更用
import { useThemeStore } from '../../../store/useThemeStore'

// --- Layer 1: Background Shader (Vertical Gradient) ---
const BackgroundMaterial = shaderMaterial(
  {
    colorTop: new THREE.Color('#000000'),
    colorBottom: new THREE.Color('#101035')
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
    uniform vec3 colorTop;
    uniform vec3 colorBottom;
    varying vec2 vUv;
    void main() {
      // Simple vertical gradient
      // vUv.y goes from 0 (bottom) to 1 (top)
      float t = smoothstep(0.0, 1.0, vUv.y); 
      vec3 finalColor = mix(colorBottom, colorTop, t);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)

// --- Layer 2: Fluid/Galaxy Shader (Noise) ---
const FluidMaterial = shaderMaterial(
  {
    time: 0,
    colorA: new THREE.Color('#1a1a3a'),
    colorB: new THREE.Color('#4b0082') // Deep Indigo
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
    uniform vec3 colorA;
    uniform vec3 colorB;
    varying vec2 vUv;

    // Pseudo-random function
    float random (in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // 2D Noise
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    // Fractional Brownian Motion
    float fbm (in vec2 st) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        // Rotate to reduce axial bias
        mat2 rot = mat2(0.8776, 0.4794,
                        -0.4794, 0.8776);
        for (int i = 0; i < 3; ++i) {
            v += a * noise(st);
            st = rot * st * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 st = vUv * 12.0; // Scale adjusted for 1000x500 geometry (was 3.0 for 240x120)
        // Animate the noise
        float q = fbm(st + vec2(time * 0.05, time * 0.02));
        
        float brightness = smoothstep(0.2, 0.8, q);
        vec3 color = mix(colorA, colorB, q);
        
        gl_FragColor = vec4(color, brightness * 0.8); 
    }
  `
)



// --- Layer 4: Fog/Volume Shader ---
const FogMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('#aaaaff'),
    opacity: 0.2
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
    uniform vec3 color;
    uniform float opacity;
    varying vec2 vUv;

    // Duplicated noise functions to avoid dependency issues in shader string
    float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash21(i + vec2(0.0,0.0)), hash21(i + vec2(1.0,0.0)), u.x),
                   mix(hash21(i + vec2(0.0,1.0)), hash21(i + vec2(1.0,1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8776, 0.4794, -0.4794, 0.8776);
        for (int i=0; i<3; i++) {
            v += a * noise(p);
            p = rot * p * 2.0;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 uv = vUv * 8.0; // Scale adjusted for 1000x500 geometry (was 2.0 for 240x120)
        // Moving fog
        float q = fbm(uv + time * 0.05);
        
        float density = smoothstep(0.3, 0.7, q);
        
        gl_FragColor = vec4(color, density * opacity);
    }
  `
)

extend({ BackgroundMaterial, FluidMaterial, FogMaterial })

export function SkyBox() {
  const fluidRef = useRef()
  const fogRef = useRef()

  const { currentTheme } = useThemeStore()

  useFrame((state, delta) => {
    if (fluidRef.current) fluidRef.current.time += delta
    if (fogRef.current) fogRef.current.time += delta
  })

  return (
    <group name="SkyBox">
      {/* 1. Background Layer (Furthest) - Universe Color */}
      {/* 
         第一層: 背景レイヤー 
         一番奥に配置される宇宙のベースカラー。
         position Z: -50 (一番遠い)
      */}
      <mesh position={[0, 0, -50]} name="Layer1_Background">
        <planeGeometry args={[1000, 500]} />
        <backgroundMaterial
          colorTop={currentTheme.colorTop}
          colorBottom={currentTheme.colorBottom}
        />
      </mesh>

      {/* 2. Fluid Layer (Milky Way) - Slightly closer */}
      {/* 
         第二層: 流体/天の川レイヤー
         ノイズを使った流れるような星雲の表現。
         position Z: -40 
         depthWrite={false}: 奥にある物体を隠さないようにする設定
      */}
      <mesh position={[0, 0.01, -40]} name="Layer2_Fluid">
        <planeGeometry args={[1000, 500]} />
        <fluidMaterial
          ref={fluidRef}
          colorA={currentTheme.colorA}
          colorB={currentTheme.colorB}
          transparent
          blending={THREE.AdditiveBlending} // 加算合成: 光り輝くような表現
          depthWrite={false}
        />
      </mesh>

      {/* 3. Distant Stars - 独立コンポーネント */}
      <DistantStars />

      {/* 4. Fog Layer - Volume illusion */}
      {/* 
         第四層: フォグ(霧)レイヤー
         前に配置することで奥行き感を出す薄い霧。
         position Z: -20 (一番手前)
         opacity: 透明度 (0.2 = 薄い, 1.0 = 不透明)
      */}
      <mesh position={[0, 0.03, -20]} name="Layer4_Fog">
        <planeGeometry args={[1000, 500]} />
        <fogMaterial
          ref={fogRef}
          color={currentTheme.color}
          opacity={0.1}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
