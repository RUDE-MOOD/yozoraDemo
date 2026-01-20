import { Stars } from '@react-three/drei'
import * as THREE from 'three'

const GradientSky = () => {
  return (
    <mesh>
      <sphereGeometry args={[200, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        // depthWriteを使って、GradientSkyが他のオブジェクトを覆い隠さないようにする
        depthWrite={false}
        uniforms={{
          colorTop: { value: new THREE.Color('#000000') },
          colorBottom: { value: new THREE.Color('#101035') } // Deep glowing night blue
        }}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `}
        fragmentShader={`
          uniform vec3 colorTop;
          uniform vec3 colorBottom;
          varying vec3 vWorldPosition;
          void main() {
            vec3 pointOnSphere = normalize(vWorldPosition);
            // Gradient from bottom (y=-1) to top (y=1)
            // But usually we just want the horizon glow.
            // Let's map y from -1 to 1 to a 0-1 gradient
            float t = smoothstep(-0.5, 0.5, pointOnSphere.y);
            
            vec3 finalColor = mix(colorBottom, colorTop, t);
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `}
      />
    </mesh>
  )
}

export function SkyDome() {
  return (
    <>
      <GradientSky />
      {/* High performance procedural stars */}
      {/* 背景の星 */}
      <Stars
        radius={150} // Radius of the inner sphere (smaller than sky sphere)
        depth={50}   // Depth of star field
        count={5000} // Number of stars
        factor={10}   // Size factor
        saturation={0}
        fade         // Fade at edges
        speed={3}    // Twinkle speed
      />
    </>
  )
}

