import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'

/**
 * 遠景流星エフェクト — DistantNagareboshi
 *
 * DistantStars と同層に配置する背景演出用コンポーネント。
 * 約15秒間隔で小さな流星が左から右へ走り、渐変フェードアウトして消える。
 *
 * 実装:
 *  - 同時に最大 POOL_SIZE 本の流星を管理（オブジェクトプール方式）
 *  - 各流星は独立した ShaderMaterial mesh
 *  - 核心（ヘッド）+ グラデーション尾（テール）を1つの plane shader で描画
 */

// --- 流星シェーダー ---
const MeteorMaterial = shaderMaterial(
    {
        progress: 0.0,  // 0→1: ライフタイム進捗
        opacity: 1.0,   // 全体の不透明度（フェードアウト用）
        color: new THREE.Color('#ffffff'),
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader — 右が明るいヘッド、左に渐変するテール
    `
    uniform float progress;
    uniform float opacity;
    uniform vec3 color;
    varying vec2 vUv;

    void main() {
      // テール: 左(0)→右(1)にかけて明るくなるグラデーション
      float tail = pow(vUv.x, 3.0);

      // 縦方向のソフトエッジ（中心が最も明るい）
      float verticalFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
      verticalFade = pow(verticalFade, 2.0);

      // ヘッドのグロー（右端に小さな明るい点）
      float headDist = distance(vUv, vec2(1.0, 0.5));
      float headGlow = smoothstep(0.15, 0.0, headDist) * 2.0;

      float alpha = (tail * verticalFade + headGlow) * opacity;

      if (alpha < 0.01) discard;

      // ヘッド部分は少し明るく
      vec3 finalColor = color + headGlow * 0.3;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

extend({ MeteorMaterial })

// --- 定数 ---
const POOL_SIZE = 2         // 同時に管理する流星の最大数
const SPAWN_INTERVAL = 15.0 // 平均出現間隔（秒）
const SPAWN_JITTER = 5.0    // 出現間隔のランダム幅（±秒）
const LIFETIME_MIN = 0.4    // 最短ライフタイム（秒）
const LIFETIME_MAX = 0.8    // 最長ライフタイム（秒）
const FADE_OUT_RATIO = 0.3  // ライフタイムの最後30%でフェードアウト

// 流星の長さ（テール込み）と太さ
const METEOR_LENGTH = 8.0
const METEOR_THICKNESS = 0.15

// 流星の移動距離（ライフタイム中に進む水平距離）
const TRAVEL_DISTANCE = 40.0

// 流星のZ位置（DistantStars z=-5 より少し手前）
const METEOR_Z = -4.5

// 流星の角度（0° = 水平右方向、正 = 下向き）
const ANGLE_MIN = 5    // 度
const ANGLE_MAX = 15   // 度

// --- 単体の流星 ---
function Meteor({ meteorRef }) {
    const matRef = useRef()
    const meshRef = useRef()

    // meteorRef にマテリアルとメッシュの参照を公開
    if (meteorRef) {
        meteorRef.current = { matRef, meshRef }
    }

    return (
        <mesh ref={meshRef} visible={false} renderOrder={1}>
            <planeGeometry args={[METEOR_LENGTH, METEOR_THICKNESS]} />
            <meteorMaterial
                ref={matRef}
                key={MeteorMaterial.key}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    )
}

/**
 * カメラの可視範囲を計算する
 * @param {THREE.Camera} camera
 * @returns {{ left, right, top, bottom }} ワールド座標での可視範囲
 */
function getVisibleBounds(camera) {
    const dist = camera.position.z - METEOR_Z
    // perspective camera: visible height = 2 * dist * tan(fov/2)
    const vFov = THREE.MathUtils.degToRad(camera.fov)
    const halfH = dist * Math.tan(vFov / 2)
    const halfW = halfH * camera.aspect
    return {
        left: camera.position.x - halfW,
        right: camera.position.x + halfW,
        top: camera.position.y + halfH,
        bottom: camera.position.y - halfH,
    }
}

// --- メインコンポーネント ---
export function DistantNagareboshi() {
    // 流星プールの参照
    const poolRefs = useRef(
        Array.from({ length: POOL_SIZE }, () => ({ current: null }))
    ).current

    // 各流星の状態
    const states = useRef(
        Array.from({ length: POOL_SIZE }, () => ({
            active: false,
            elapsed: 0,
            lifetime: 0,
            startX: 0,
            startY: 0,
            angle: 0,
        }))
    ).current

    // 次のスポーン時刻
    const nextSpawn = useRef(
        SPAWN_INTERVAL * 0.5 + Math.random() * SPAWN_JITTER
    )

    // 経過時間
    const clock = useRef(0)

    useFrame(({ camera }, delta) => {
        clock.current += delta

        // カメラの可視範囲を取得
        const bounds = getVisibleBounds(camera)
        const viewW = bounds.right - bounds.left
        const viewH = bounds.top - bounds.bottom

        // --- スポーン判定 ---
        if (clock.current >= nextSpawn.current) {
            // 空いているスロットを探す
            const freeIdx = states.findIndex((s) => !s.active)
            if (freeIdx !== -1) {
                const s = states[freeIdx]
                s.active = true
                s.elapsed = 0
                s.lifetime =
                    LIFETIME_MIN + Math.random() * (LIFETIME_MAX - LIFETIME_MIN)
                // 可視範囲の左端付近から出現（テール分を考慮して少し左から）
                s.startX = bounds.left - METEOR_LENGTH
                // Y座標は可視範囲内でランダム
                s.startY =
                    bounds.bottom + Math.random() * viewH
                s.angle =
                    ((ANGLE_MIN + Math.random() * (ANGLE_MAX - ANGLE_MIN)) *
                        Math.PI) /
                    180
            }

            // 次の出現タイミング
            nextSpawn.current =
                clock.current +
                SPAWN_INTERVAL -
                SPAWN_JITTER +
                Math.random() * SPAWN_JITTER * 2
        }

        // --- 各流星を更新 ---
        for (let i = 0; i < POOL_SIZE; i++) {
            const s = states[i]
            const refs = poolRefs[i].current
            if (!refs) continue

            const mesh = refs.meshRef.current
            const mat = refs.matRef.current
            if (!mesh || !mat) continue

            if (!s.active) {
                mesh.visible = false
                continue
            }

            s.elapsed += delta
            const t = s.elapsed / s.lifetime // 0→1

            if (t >= 1) {
                // ライフタイム終了
                s.active = false
                mesh.visible = false
                continue
            }

            // 表示
            mesh.visible = true

            // 位置: 左→右 + 微妙に下向き
            const dx = TRAVEL_DISTANCE * t
            mesh.position.set(
                s.startX + dx * Math.cos(s.angle),
                s.startY - dx * Math.sin(s.angle),
                METEOR_Z
            )

            // 角度（テールが進行方向の後ろに伸びるように）
            mesh.rotation.z = -s.angle

            // フェードアウト（末尾30%で opacity を 1→0 にする）
            if (t > 1 - FADE_OUT_RATIO) {
                mat.opacity = (1 - t) / FADE_OUT_RATIO
            } else {
                mat.opacity = 1.0
            }

            mat.progress = t
        }
    })

    return (
        <group name="DistantNagareboshi">
            {poolRefs.map((ref, i) => (
                <Meteor key={i} meteorRef={ref} />
            ))}
        </group>
    )
}

