import * as THREE from 'three'
import { shaderMaterial, Billboard, Text } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useFutureMessageStore } from '../../../store/useFutureMessageStore'

// FutureStarMaterial: A distinct, pulsing shader for the Future Star
const FutureStarMaterial = shaderMaterial(
    {
        time: 0,
        baseBrightness: 1.5, // Brighter than normal stars
        color: new THREE.Color(0.6, 0.8, 1.0), // Cyan/Blueish tint
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
  `
)

extend({ FutureStarMaterial })

export function FutureStar({ position, onOpenInputModal }) {
    const materialRef = useRef()
    // const { isFutureStarVisible } = useFutureMessageStore() 
    // Visibility is controlled by parent for now, but local ref update is needed

    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.time += delta
        }
    })

    // Determine label text language? Keeping it simple English/Symbol for now or Japanese as requested.
    // "未来への手紙" (Letter to the future)

    return (
        <group position={position}>
            <Billboard>
                <mesh
                    scale={[1.5, 1.5, 1]} // Slightly larger
                    onClick={(e) => {
                        e.stopPropagation()
                        onOpenInputModal()
                    }}
                    onPointerOver={() => document.body.style.cursor = 'pointer'}
                    onPointerOut={() => document.body.style.cursor = 'auto'}
                >
                    <planeGeometry args={[1, 1]} />
                    <futureStarMaterial
                        ref={materialRef}
                        transparent
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
                <Text
                    position={[0, -1.0, 0]}
                    fontSize={0.3}
                    color="#aaddff"
                    anchorX="center"
                    anchorY="top"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    未来への手紙
                </Text>
            </Billboard>
        </group>
    )
}
