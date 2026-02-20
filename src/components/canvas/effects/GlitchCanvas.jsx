import { useEffect, useRef } from "react";

// ══════════════════════════════════════════════════════
//  WebGL グリッチシェーダー (videoglitch.js ベース)
//  共通コンポーネント: LoginSuccess / RegisterSuccess で共用
// ══════════════════════════════════════════════════════

const VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289v3(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 xx = 2.0*fract(p*C.www)-1.0;
  vec3 h = abs(xx)-0.5;
  vec3 ox = floor(xx+0.5);
  vec3 a0 = xx-ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x  = a0.x*x0.x  + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0*dot(m, g);
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 2.0;
  float I = u_intensity;

  float noise = max(0.0, snoise(vec2(t, uv.y*0.3)) - 0.3) / 0.7;
  noise += (snoise(vec2(t*10.0, uv.y*2.4)) - 0.5) * 0.15;
  noise *= I;

  float alpha = I * 0.9;

  float interf = rand(vec2(uv.y * t)) * noise * 0.5;
  alpha += interf;

  if (floor(mod(gl_FragCoord.y * 0.25, 2.0)) == 0.0)
    alpha += 0.12 * noise;

  float flash = step(0.97, rand(vec2(t*0.1, floor(uv.y*20.0)))) * 0.25 * I;
  alpha += flash;

  float bar = step(0.95, rand(vec2(floor(uv.y*40.0), floor(t*3.0)))) * 0.35 * I;
  alpha += bar;

  vec3 dark  = vec3(0.08, 0.08, 0.10);
  vec3 light = vec3(0.9, 0.9, 0.9);
  vec3 color = mix(dark, light, clamp(interf + flash + bar, 0.0, 1.0));

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

/**
 * GlitchCanvas — フルスクリーン WebGL グリッチオーバーレイ
 *
 * @param {number} duration  減衰にかかる秒数（intensity 1→0）
 */
export function GlitchCanvas({ duration = 2.5 }) {
  const ref = useRef(null);
  const raf = useRef(null);
  const t0 = useRef(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const gl = c.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VERT);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, FRAG);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
      console.error("Glitch shader:", gl.getShaderInfoLog(fs));
    const pg = gl.createProgram();
    gl.attachShader(pg, vs);
    gl.attachShader(pg, fs);
    gl.linkProgram(pg);
    gl.useProgram(pg);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aP = gl.getAttribLocation(pg, "a_position");
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(pg, "u_resolution");
    const uT = gl.getUniformLocation(pg, "u_time");
    const uI = gl.getUniformLocation(pg, "u_intensity");

    const resize = () => {
      c.width = innerWidth;
      c.height = innerHeight;
      gl.viewport(0, 0, c.width, c.height);
    };
    resize();
    addEventListener("resize", resize);

    t0.current = performance.now();

    const loop = () => {
      const elapsed = (performance.now() - t0.current) / 1000;
      const p = Math.min(elapsed / duration, 1.0);
      const intensity = 1.0 - p * p * (3.0 - 2.0 * p);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uR, c.width, c.height);
      gl.uniform1f(uT, elapsed);
      gl.uniform1f(uI, intensity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (intensity > 0.005) raf.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      removeEventListener("resize", resize);
      cancelAnimationFrame(raf.current);
    };
  }, [duration]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 10001,
        pointerEvents: "none",
      }}
    />
  );
}
