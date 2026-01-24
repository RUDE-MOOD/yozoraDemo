import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'

// --- MyStarMaterial: 星の描画を行うシェーダー ---
// shaderMaterialを使ってThree.jsのShaderMaterialを作成しています。
// 頂点シェーダー(Vertex Shader)とフラグメントシェーダー(Fragment Shader)で構成されています。
const MyStarMaterial = shaderMaterial(
  {
    // Uniforms: 全ての星で共通の値
    time: 0,              // 時間 (アニメーションの進行に使用)
    baseBrightness: 1.0,  // 基本の輝度 (全体的な明るさの調整)
  },
  // --- Vertex Shader (頂点シェーダー) ---
  // 各インスタンス(星)の位置やサイズを計算し、画面上のどこに描画するかを決定します。
  `
    // Attributes: JavaScript側から渡される、各インスタンスごとの個別データ
    attribute vec3 aOffset;  // 各星の中心位置 (X, Y, Z)
    attribute float aScale;  // 各星の大きさ (スケール倍率)
    attribute vec3 aColor;   // 各星の色 (RGB)
    attribute float aRandom; // 各星のランダム値 (アニメーションのタイミングずらし用)

    // Varyings: フラグメントシェーダーに渡すデータ
    varying vec2 vUv;        // テクスチャ座標 (0.0 ~ 1.0)
    varying vec3 vColor;     // 色情報
    varying float vRandom;   // ランダム値

    void main() {
      // UV座標と属性データをVaryingに渡す
      vUv = uv;
      vColor = aColor;
      vRandom = aRandom;

      // --- Billboarding (ビルボード処理) ---
      // 板ポリゴン(Plane)が常にカメラの方を向くようにする計算です。
      
      // 1. 星の中心位置を「ビュー座標系(カメラから見た座標)」に変換
      vec4 mvPosition = modelViewMatrix * vec4(aOffset, 1.0);

      // 2. 頂点の位置をビュー座標系で直接加算
      // これにより、Planeの回転が無視され、常にカメラに対して垂直(正面)になります。
      // aScaleを使って星ごとの大きさを反映させます。
      mvPosition.xyz += position * aScale;

      // 最終的な描画位置を決定
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // --- Fragment Shader (フラグメントシェーダー) ---
  // ピクセルごとの色や透明度を計算し、星の見た目(光り方)を作ります。
  `
    uniform float time;             // 時間
    uniform float baseBrightness;   // 基本輝度
    
    varying vec2 vUv;       // UV座標
    varying vec3 vColor;    // 星の色
    varying float vRandom;  // ランダム値

    void main() {
      // UV座標を中心(0.0)基準に変換 (-0.5 ~ 0.5)
      vec2 uv = vUv - 0.5;
      float d = length(uv); // 中心からの距離

      // --- 1. Central Glow (中心の発光) ---
      // 星の中心にある丸い光の玉を描画します。
      // exp(指数関数)を使うことで、ガウス分布のような自然で柔らかな光の減衰を作ります。
      float core = exp(-d * 6.0);        // Broad glow: 全体に広がる柔らかな光
      float center = exp(-d * d * 80.0); // Bright nucleus: 中心の一点にある強い核のような光
      core = core * 0.6 + center * 0.9;  // 2つの光をブレンド

      // --- 2. Cross Spikes (レンズフレア/光条) ---
      // カメラのレンズ越しに強い光を見た時に出る「十字」の光を描画します。
      
      // 水平方向の光条
      // abs(uv.y): Y軸(縦)の中心に近いほど明るく
      // smoothstep(abs(uv.x)): X軸(横)に離れると消える
      float spikeH = 0.02 / (abs(uv.y) + 0.02) * (1.0 - smoothstep(0.0, 0.4, abs(uv.x)));
      
      // 垂直方向の光条
      float spikeV = 0.02 / (abs(uv.x) + 0.02) * (1.0 - smoothstep(0.0, 0.4, abs(uv.y)));
      
      float spikes = spikeH + spikeV;
      spikes = pow(spikes, 1.5); // powでコントラストを上げ、光条を鋭くする

      // --- Combine (合成) ---
      // 丸い光(core)と十字の光(spikes)を足し合わせます。
      float brightness = (core * 1.2 + spikes * 0.8) * baseBrightness;

      // --- Twinkle effect (瞬き) ---
      // 星がキラキラ瞬くアニメーション。
      // vRandomを使うことで、全ての星が同時に点滅せず、バラバラに光るようにします。
      float twinkle = sin(time * 1.5 + vRandom * 10.0) * 0.15 + 0.85;
      brightness *= twinkle;

      // 最終的な色を決定 (色 × 明るさ)
      vec3 finalColor = vColor * brightness;

      // --- Alpha Masking (透明度処理) ---
      // 明るさが低い部分は透明にして、四角いポリゴンの枠が見えないようにします。
      float alpha = smoothstep(0.05, 1.0, brightness);
      
      // 境界をさらにぼかして滑らかにする
      alpha *= 1.0 - smoothstep(0.4, 0.5, d);

      // ほぼ透明なピクセルは描画しない(パフォーマンス向上)
      if (alpha < 0.01) discard;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

// GLSLをReact Three Fiberで使えるように拡張
extend({ MyStarMaterial })

// --- MyStars Component ---
// count: 生成する星の数 (デフォルト1000個)
export function MyStars({ count = 1000 }) {
  const materialRef = useRef()
  const meshRef = useRef()

  // --- ランダムデータの生成 ---
  // useMemoを使い、コンポーネントの再レンダリング時以外はデータを再生成しないようにします。
  const { offsets, colors, scales, randoms } = useMemo(() => {
    // データ格納用の配列を確保
    const offsets = new Float32Array(count * 3) // 位置 (x, y, z) なので3倍
    const colors = new Float32Array(count * 3)  // 色 (r, g, b) なので3倍
    const scales = new Float32Array(count * 1)  // サイズは1つ
    const randoms = new Float32Array(count * 1) // ランダム値も1つ

    const baseColor = new THREE.Color()

    for (let i = 0; i < count; i++) {
      // --- Position (位置) ---
      // 画面全体に広がるようにランダム配置
      const x = (Math.random() - 0.5) * 800 // 横幅: -400 ~ 400
      const y = (Math.random() - 0.5) * 400 // 縦幅: -200 ~ 200
      const z = -10 + (Math.random() - 0.5) * 15 // 奥行き: -17.5 ~ -2.5 (Z=-10付近)

      offsets[i * 3 + 0] = x
      offsets[i * 3 + 1] = y
      offsets[i * 3 + 2] = z

      // --- Color (色) ---
      // 確率で色を変化させる
      const randomType = Math.random()
      if (randomType > 0.9) {
        // ピンク/マゼンタ系 (10%)
        baseColor.setHSL(0.8 + Math.random() * 0.15, 0.9, 0.8)
      } else if (randomType > 0.75) {
        // ゴールド/オレンジ系 (15%)
        baseColor.setHSL(0.08 + Math.random() * 0.12, 0.9, 0.8)
      } else if (randomType > 0.5) {
        // シアン/グリーン系 (25%)
        baseColor.setHSL(0.45 + Math.random() * 0.1, 0.8, 0.8)
      } else {
        // 青/白系 (50%) - 基本色
        baseColor.setHSL(0.6 + Math.random() * 0.1, 0.6 + Math.random() * 0.4, 0.8 + Math.random() * 0.2)
      }

      colors[i * 3 + 0] = baseColor.r
      colors[i * 3 + 1] = baseColor.g
      colors[i * 3 + 2] = baseColor.b

      // --- Scale (サイズ) ---
      // 大きさをランダムに変化 (2.0 ~ 6.0倍)
      scales[i] = 2.0 + Math.random() * 4.0

      // --- Random (アニメーション用) ---
      // 瞬きのタイミングをずらすための0.0~1.0のランダム値
      randoms[i] = Math.random()
    }

    return { offsets, colors, scales, randoms }
  }, [count])

  // --- Animation Loop ---
  // 毎フレーム実行され、シェーダーの time uniform を更新します。
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.time += delta
    }
  })

  // --- Render ---
  // InstancedMeshを使って大量の星を一度に描画します。
  return (
    <group name="Layer5_MyStars">
      {/* 
         InstancedMesh: 
         args: [geometry, material, count] 
         frustumCulled={false}: 星を個別に動かしているため、自動カリング(画面外判定)を無効化して消えるのを防ぐ
      */}
      <instancedMesh ref={meshRef} args={[null, null, count]} position={[0, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[1, 1]}>
          {/* 
             instancedBufferAttribute: 
             各インスタンスごとの個別データをGPUに渡すための設定
             attach="attributes-名前" でシェーダー内の attribute 変数と紐付きます
          */}
          <instancedBufferAttribute attach="attributes-aOffset" args={[offsets, 3]} />
          <instancedBufferAttribute attach="attributes-aColor" args={[colors, 3]} />
          <instancedBufferAttribute attach="attributes-aScale" args={[scales, 1]} />
          <instancedBufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
        </planeGeometry>

        {/* カスタムシェーダーマテリアル */}
        <myStarMaterial
          ref={materialRef}
          transparent                   // 透明度を有効にする
          depthWrite={false}            // 深度バッファに書き込まない (他の透明なオブジェクトと正しく重なるように)
          blending={THREE.AdditiveBlending} // 加算合成 (光が重なると明るくなる)
        />
      </instancedMesh>
    </group>
  )
}
