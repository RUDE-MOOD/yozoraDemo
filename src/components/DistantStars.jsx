import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

// --- 遠景の星レイヤー (Layer 3) ---
// 瞬く星々を描画する独立コンポーネント
// SkyBox / SkyBoxUpGrade の両方で利用可能
const StarsMaterial = shaderMaterial(
    {
        time: 0,
        color: new THREE.Color('#ffffff'),
        size: 2.0,
        density: 20.0
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
    uniform float size;
    uniform float density;
    varying vec2 vUv;

    float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    void main() {
        vec2 uv = vUv * density;
        uv.x *= 2.0; // correct for 1000:500 plane aspect ratio → circular stars
        vec2 id = floor(uv);
        vec2 gv = fract(uv) - 0.5;

        float h = hash21(id); 
        
        // Jitter position to break grid alignment
        float shiftX = hash21(id + vec2(1.0, 0.0)) - 0.5;
        float shiftY = hash21(id + vec2(0.0, 1.0)) - 0.5;
        gv += vec2(shiftX, shiftY) * 0.8;

        // Size variation
        float r = size * 0.01 * h; 
        
        // Twinkle
        float twinkle = sin(time * 2.0 + h * 100.0) * 0.5 + 0.5;
        r *= 0.5 + 0.5 * twinkle;

        float d = length(gv);
        float circle = smoothstep(r, r - 0.01, d);

        float alpha = circle * h; 

        if (alpha < 0.01) discard;

        gl_FragColor = vec4(color, alpha);
    }
  `
)

extend({ StarsMaterial })

export function DistantStars({
    position = [0, 0.02, -5],
    color = '#ffffff',
    density = 160.0,
    size = 1.5
}) {
    const starsRef = useRef()

    useFrame((state, delta) => {
        if (starsRef.current) starsRef.current.time += delta
    })

    return (
        <mesh position={position} name="Layer3_DistantStars">
            <planeGeometry args={[1000, 500]} />
            <starsMaterial
                ref={starsRef}
                key={StarsMaterial.key}
                color={color}
                density={density}
                size={size}
                transparent
                depthWrite={false}
            />
        </mesh>
    )
}
