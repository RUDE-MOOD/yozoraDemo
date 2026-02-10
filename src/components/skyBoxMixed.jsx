import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { SkyBox } from './SkyBox'
import { DistantStars } from './DistantStars'

// SkyBoxUpGradeと同じネビュラシェーダー（透明度制御用にopacity uniformを追加）
const NebulaFilterMaterial = shaderMaterial(
    {
        time: 0,
        resolution: new THREE.Vector2(1920, 1080),
        opacity: 0.35,  // フィルターとしての透明度
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader — ネビュラ + opacity制御
    `
    precision highp float;

    uniform float time;
    uniform vec2 resolution;
    uniform float opacity;
    varying vec2 vUv;

    #define NUM_OCTAVES 6

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
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < NUM_OCTAVES; i++) {
        float dir = mod(float(i), 2.0) > 0.5 ? 1.0 : -1.0;
        v += a * noise(pos - 0.05 * dir * time);
        pos = rot * pos * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main(void) {
      vec2 fragCoord = vUv * resolution;
      vec2 p = (fragCoord.xy * 3.0 - resolution.xy) / min(resolution.x, resolution.y);
      p -= vec2(12.0, 0.0);

      float t = 0.0, d;
      float time2 = 1.0;

      vec2 q = vec2(0.0);
      q.x = fbm(p + 0.00 * time2);
      q.y = fbm(p + vec2(1.0));
      vec2 r = vec2(0.0);
      r.x = fbm(p + 1.0 * q + vec2(1.7, 1.2) + 0.15 * time2);
      r.y = fbm(p + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time2);
      float f = fbm(p + r);

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

      // opacity uniformでフィルターの強さを制御
      float alpha = opacity * color.r;
      gl_FragColor = vec4(color, alpha);
    }
  `
)

extend({ NebulaFilterMaterial })

export function SkyBoxMixed() {
    const filterRef = useRef()
    const { size } = useThree()

    useFrame(({ clock }) => {
        if (filterRef.current) {
            filterRef.current.time = clock.elapsedTime
            filterRef.current.resolution.set(
                size.width * window.devicePixelRatio,
                size.height * window.devicePixelRatio
            )
        }
    })

    return (
        <group name="SkyBoxMixed">
            {/* ベース: 従来のSkyBox（Layer1~4） */}
            <SkyBox />

            {/* フィルター: ネビュラシェーダーを半透明で上に重ねる */}
            {/* z=-15: SkyBoxのFog(z=-20)より手前に配置 */}
            <mesh position={[0, 0.04, -15]}>
                <planeGeometry args={[1000, 500]} />
                <nebulaFilterMaterial
                    ref={filterRef}
                    key={NebulaFilterMaterial.key}
                    opacity={0.35}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* 遠景の星 */}
            <DistantStars position={[0, 0, -5]} size={2.5} />
        </group>
    )
}
