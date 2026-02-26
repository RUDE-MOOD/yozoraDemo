import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

console.log("Testing shaderMaterial...");

try {
    const Material = shaderMaterial(
        {
            time: 0,
            baseBrightness: 1.0,
            color: new THREE.Color(1.0, 1.0, 1.0),
            random: 0.0,
        },
        `
      varying vec2 vUv;
      varying vec3 vColor;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 localPosition = vec4(position, 1.0);
        
        #ifdef USE_INSTANCING
          vec4 mPosition = instanceMatrix * localPosition;
          vColor = instanceColor;
        #else
          vec4 mPosition = localPosition;
          vColor = color;
        #endif
        
        vWorldPosition = (modelMatrix * mPosition).xyz;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * mPosition;
      }
    `,
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

        float core = exp(-d * 6.0);
        float center = exp(-d * d * 80.0);
        core = core * 0.6 + center * 0.9;

        float spikeH = 0.02 / (abs(uv.y) + 0.02) * (1.0 - smoothstep(0.0, 0.4, abs(uv.x)));
        float spikeV = 0.02 / (abs(uv.x) + 0.02) * (1.0 - smoothstep(0.0, 0.4, abs(uv.y)));
        float spikes = pow(spikeH + spikeV, 1.5);

        float brightness = (core * 1.2 + spikes * 0.8) * baseBrightness;

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
    `
    );

    const mat = new Material();
    console.log("VERTEX:\\n", mat.vertexShader);
    console.log("FRAGMENT:\\n", mat.fragmentShader);

} catch (e) {
    console.error("ERROR", e);
}
