import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { DistantStars } from '../stars/DistantStars'

// FBM Nebula Shader — faithful port from GLSL Sandbox
// Uses virtual resolution to replicate gl_FragCoord coordinate space exactly
const NebulaMaterial = shaderMaterial(
  {
    time: 0,
    resolution: new THREE.Vector2(1920, 1080),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader — kept as close to the original as possible
  `
    precision highp float;

    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    #define NUM_OCTAVES 4

    float random(vec2 pos) {
      return fract(sin(dot(pos.xy, vec2(13.9898, 78.233))) * 43758.5453123);
    }

    float noise(vec2 pos) {
      vec2 i = floor(pos);
      vec2 f = fract(pos);
      float a = random(i + vec2(0.0, 0.0));
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 pos) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(0.8776, 0.4794, -0.4794, 0.8776);
      for (int i = 0; i < NUM_OCTAVES; i++) {
        float dir = mod(float(i), 2.0) > 0.5 ? 1.0 : -1.0;
        v += a * noise(pos - 0.05 * dir * time);
        pos = rot * pos * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main(void) {
      // Reconstruct gl_FragCoord equivalent from vUv
      vec2 fragCoord = vUv * resolution;

      vec2 p = (fragCoord.xy * 3.0 - resolution.xy) / min(resolution.x, resolution.y);
      p -= vec2(12.0, 0.0);

      float t = 0.0, d;
      float time2 = 1.0;

      // 最適化: fbm呼び出しを5→3に削減（q.yとr.yを近似）
      float qx = fbm(p + 0.00 * time2);
      vec2 q = vec2(qx, qx * 0.8 + 0.1);
      float rx = fbm(p + q + vec2(1.7, 1.2) + 0.15 * time2);
      vec2 r = vec2(rx, rx * 0.9 + 0.05);
      float f = fbm(p + r);

      // DS: hornidev
      vec3 color = mix(
        vec3(1.0, 1.0, 2.0),
        vec3(1.0, 1.0, 1.0),
        clamp((f * f) * 5.5, 1.2, 15.5)
      );

      color = mix(
        color,
        vec3(1.0, 1.0, 1.0),
        clamp(length(q), 2.0, 2.0)
      );

      color = mix(
        color,
        vec3(0.3, 0.2, 1.0),
        clamp(length(r.x), 0.0, 5.0)
      );

      color = (f * f * f * 1.0 + 0.5 * 1.7 * 0.0 + 0.9 * f) * color;

      vec2 uv = fragCoord.xy / resolution.xy;
      float alpha = 50.0 - max(pow(100.0 * distance(uv.x, -1.0), 0.0), pow(2.0 * distance(uv.y, 0.5), 5.0));
      gl_FragColor = vec4(color * 100.0, color.r);
      gl_FragColor = vec4(color, alpha * color.r);
    }
  `
)

extend({ NebulaMaterial })

export function SkyBoxUpGrade() {
  const materialRef = useRef()
  const { size } = useThree()

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.time = clock.elapsedTime
      // Pass actual canvas pixel resolution to match original coordinate space
      materialRef.current.resolution.set(
        size.width * window.devicePixelRatio,
        size.height * window.devicePixelRatio
      )
    }
  })

  return (
    <group name="SkyBoxUpGrade">
      <mesh position={[0, 0, -50]}>
        <planeGeometry args={[1000, 500]} />
        <nebulaMaterial
          ref={materialRef}
          key={NebulaMaterial.key}
          depthWrite={false}
        />
      </mesh>
      {/* 遠景の星 — z=-5でカメラに近い → 星が大きく見える */}
      <DistantStars position={[0, 0, -5]} size={2.5} />
    </group>
  )
}
