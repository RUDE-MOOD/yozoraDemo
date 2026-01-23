import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

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
        mat2 rot = mat2(cos(0.5), sin(0.5),
                        -sin(0.5), cos(00.5));
        for (int i = 0; i < 5; ++i) {
            v += a * noise(st);
            st = rot * st * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 st = vUv * 3.0; // Scale
        // Animate the noise
        float q = fbm(st + vec2(time * 0.05, time * 0.02));
        
        float brightness = smoothstep(0.2, 0.8, q);
        vec3 color = mix(colorA, colorB, q);
        
        gl_FragColor = vec4(color, brightness * 0.8); 
    }
  `
)

// --- Layer 3: Distant Stars Shader ---
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
        vec2 id = floor(uv);
        vec2 gv = fract(uv) - 0.5;

        float h = hash21(id); 
        
        // Jitter position to break grid alignment
        // Use a different hash or offset based on id
        float shiftX = hash21(id + vec2(1.0, 0.0)) - 0.5;
        float shiftY = hash21(id + vec2(0.0, 1.0)) - 0.5;
        gv += vec2(shiftX, shiftY) * 0.8; // Random offset up to 0.4 units

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
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i=0; i<4; i++) {
            v += a * noise(p);
            p = rot * p * 2.0;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 uv = vUv * 2.0;
        // Moving fog
        float q = fbm(uv + time * 0.05);
        
        float density = smoothstep(0.3, 0.7, q);
        
        gl_FragColor = vec4(color, density * opacity);
    }
  `
)

extend({ BackgroundMaterial, FluidMaterial, StarsMaterial, FogMaterial })

export function SkyBox() {
  const fluidRef = useRef()
  const starsRef = useRef()
  const fogRef = useRef()

  useFrame((state, delta) => {
    if (fluidRef.current) fluidRef.current.time += delta
    if (starsRef.current) starsRef.current.time += delta
    if (fogRef.current) fogRef.current.time += delta
  })

  return (
    <group name="SkyBox">
      {/* 1. Background Layer (Furthest) - Universe Color */}
      <mesh position={[0, 0, -50]} name="Layer1_Background">
        <planeGeometry args={[240, 120]} />
        <backgroundMaterial colorTop="#000000" colorBottom="#101035" />
      </mesh>

      {/* 2. Fluid Layer (Milky Way) - Slightly closer */}
      <mesh position={[0, 0.01, -40]} name="Layer2_Fluid">
        <planeGeometry args={[240, 120]} />
        <fluidMaterial
          ref={fluidRef}
          colorA="#101035"
          colorB="#551a8b"
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Distant Stars - Static noise with Twinkle */}
      <mesh position={[0, 0.02, -30]} name="Layer3_DistantStars">
        <planeGeometry args={[240, 120]} />
        <starsMaterial
          ref={starsRef}
          color="#ffffff"
          density={40.0}
          size={1.5}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* 4. Fog Layer - Volume illusion */}
      <mesh position={[0, 0.03, -20]} name="Layer4_Fog">
        <planeGeometry args={[240, 120]} />
        <fogMaterial
          ref={fogRef}
          color="#aaaaff"
          opacity={0.1}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
