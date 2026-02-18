import * as THREE from 'three'
import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { Billboard, shaderMaterial } from '@react-three/drei'
import { useFutureMessageStore } from '../store/useFutureMessageStore'
import { useStarStore } from '../store/useStarStore'

// ══════════════════════════════════════════════════════
// NagareboshiMaterial: 流星描画用カスタムシェーダー
// 十字光芒の星核 + 3色グラデーショントレイル
// ══════════════════════════════════════════════════════
const NagareboshiMaterial = shaderMaterial(
    {
        time: 0,
        trailDir: new THREE.Vector2(-0.6, 0.8),
        trailLength: 0.6,
        speed: 2.0,
        starSize: 0.7,
        meteorColor: new THREE.Color(0.6, 0.85, 1.0),
        brightness: 1.0,
    },
    // ── Vertex Shader ──
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // ── Fragment Shader ──
    `
    uniform float time;
    uniform vec2 trailDir;
    uniform float trailLength;
    uniform float speed;
    uniform float starSize;
    uniform vec3 meteorColor;
    uniform float brightness;

    varying vec2 vUv;

    // 回転行列
    mat2 Rot(float a) {
        float s = sin(a), c = cos(a);
        return mat2(c, -s, s, c);
    }

    // 十字光芒（Nagareboshiの Star 関数）
    float Star(vec2 uv, float flare) {
        float d = length(uv);
        float m = .05 / d;
        float rays = max(0., 1. - abs(uv.x * uv.y * 75.0));
        m += rays * 2.0 * flare;
        m *= smoothstep(1.2, 0.1, d);
        return m;
    }

    // 線分への最短距離（Nagareboshiの sdSegment 関数）
    float sdSegment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h) * 1.5;
    }

    void main() {
        // UV: 中心を原点、-1〜1に正規化
        vec2 uv = (vUv - 0.5) * 2.0;

        // 頭部は原点、尾部はtrailDir方向に伸びる
        vec2 head = vec2(0.0);
        vec2 tail = trailDir * trailLength;

        vec3 col = vec3(0.0);

        // ── Trail（尾） ──
        vec2 pa = uv - head;
        vec2 ba = tail - head;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float dTrail = sdSegment(uv, head, tail);

        // 3色グラデーション: 頭部=明るい白 → 中間=シアン → 尾部=ラベンダー
        vec3 warmWhite = vec3(1.0, 0.98, 1.1);
        vec3 softCyan = vec3(0.6, 0.9, 1.0);
        vec3 lavender = vec3(0.75, 0.65, 1.0);
        vec3 midColor = mix(warmWhite, softCyan, smoothstep(0.0, 0.5, h));
        vec3 finalTrailColor = mix(midColor, lavender, smoothstep(0.4, 1.0, h));
        // 細い明るいコア + 広いグロー
        float trailCore = exp(-dTrail * 250.0 / starSize) * 2.0;
        float trailGlow = exp(-dTrail * 40.0 / starSize) * 0.3;
        // 頭部→尾部のフェードアウト
        float fade = pow(1.0 - h, 4.0);

        col += finalTrailColor * (trailCore + trailGlow) * fade * 0.8;

        // ── Head（頭部の十字光芒） ──
        vec2 headUV = uv * 45.0 / starSize;
        float rotSpeed = time * (3.0 + speed);
        headUV *= Rot(rotSpeed * 0.6);
        float starLight = Star(headUV, 200.5);
        // 核心: 暖かい白にシアンを少し混ぜた光
        vec3 headColor = mix(vec3(0.7, 0.95, 1.0), vec3(1.0, 0.97, 0.95), 0.5);

        col += headColor * starLight * 0.008;

        // 全体の明るさ調整
        col *= brightness;

        // アルファ: 明るさに基づいて計算
        float alpha = max(col.r, max(col.g, col.b));
        alpha = smoothstep(0.005, 0.05, alpha);

        if (alpha < 0.01) discard;

        gl_FragColor = vec4(col, alpha);
    }
    `
)

extend({ NagareboshiMaterial })

// ══════════════════════════════════════════════════════
// ShootingStar コンポーネント
// フェーズ: entering → idle → exiting → gone
// ビジュアル: NagareboshiMaterialによるBillboard描画
// ══════════════════════════════════════════════════════
export function ShootingStar({ onOpenDisplayModal }) {
    const groupRef = useRef()
    const materialRef = useRef()
    const { camera, controls } = useThree()

    // Animation Phase: 'entering' -> 'idle' -> 'exiting' -> 'gone'
    const [phase, setPhase] = useState('entering')

    // 速度追跡用
    const prevPosRef = useRef(new THREE.Vector3())
    const trailDirRef = useRef(new THREE.Vector2(-0.6, 0.8))
    const currentTrailLength = useRef(0.6)
    const isFirstFrame = useRef(true)

    // カメラの現在位置を基準にした相対位置（マウント時に1回だけ計算）
    const startPos = useMemo(() => new THREE.Vector3(
        camera.position.x - 100,
        camera.position.y + 50,
        camera.position.z - 100
    ), [])
    const targetPos = useMemo(() => new THREE.Vector3(
        camera.position.x + 5,
        camera.position.y + 5,
        camera.position.z - 30
    ), [])
    // 退場方向: 進入軌道と同じ方向（正規化）
    const exitDirection = useMemo(() =>
        new THREE.Vector3().subVectors(targetPos, startPos).normalize()
        , [])

    // Speed factors
    const enterSpeed = 2.5
    // 速度 (units/sec) — 進入はlerpで約176単位を2秒でカバー→平均約40 units/sec相当
    const exitSpeed = 40

    const { isShootingStarLeaving, hideShootingStar } = useFutureMessageStore()

    // 退場完了後、最新の星にカメラを戻すために使用
    const { stars, setFocusTarget } = useStarStore()

    // 退場タイマー
    const exitTimer = useRef(0)

    // カメラ基底ベクトル（3D速度→2Dスクリーン空間の投影用）
    const cameraRight = useMemo(() => new THREE.Vector3(), [])
    const cameraUp = useMemo(() => new THREE.Vector3(), [])
    const cameraFwd = useMemo(() => new THREE.Vector3(), [])
    const tempVec3 = useMemo(() => new THREE.Vector3(), [])
    const tempDir = useMemo(() => new THREE.Vector2(), [])

    useFrame((state, delta) => {
        if (!groupRef.current || !materialRef.current) return

        // 時間更新
        materialRef.current.time += delta

        // If store says leaving and we are not yet exiting, switch phase
        if (isShootingStarLeaving && phase === 'idle') {
            setPhase('exiting')
            exitTimer.current = 0
        }

        const currentPos = groupRef.current.position

        // ── フェーズごとの位置更新（既存ロジックそのまま） ──
        if (phase === 'entering') {
            currentPos.lerp(targetPos, delta * enterSpeed)
            if (currentPos.distanceTo(targetPos) < 1.0) {
                setPhase('idle')
            }
        } else if (phase === 'idle') {
            // 待機中 - ユーザーのクリックを待つ
        } else if (phase === 'exiting') {
            exitTimer.current += delta
            // 同じ軌道方向に一定速度で移動
            currentPos.addScaledVector(exitDirection, exitSpeed * delta)

            // カメラが流星を追従（レイヤー境界内のみ）
            // 進行方向に少しオフセット → 核心が画面中央〜やや右に映る
            const inBounds = Math.abs(currentPos.x) < 320 && Math.abs(currentPos.y) < 160
            if (controls && inBounds) {
                const ox = exitDirection.x * 8
                const oy = exitDirection.y * 8
                controls.setLookAt(
                    currentPos.x + ox, currentPos.y + oy, currentPos.z + 20,
                    currentPos.x + ox, currentPos.y + oy, currentPos.z,
                    true // smooth transition
                )
            }

            // 5秒後に消える
            if (exitTimer.current > 2.0) {
                // 退場完了：最新の星の位置にカメラを戻す（打ち上げ後と同じzoom）
                if (stars.length > 0) {
                    const lastStar = stars[stars.length - 1]
                    setFocusTarget(lastStar.position)
                }
                setPhase('gone')
                hideShootingStar()
            }
        }

        // ── 速度からトレイル方向を計算 ──
        if (isFirstFrame.current) {
            prevPosRef.current.copy(currentPos)
            isFirstFrame.current = false
            return
        }

        // 3D速度ベクトル
        const velocity = tempVec3.subVectors(currentPos, prevPosRef.current)
        const speed3D = velocity.length()

        if (speed3D > 0.01) {
            // カメラの基底ベクトルを抽出
            camera.matrixWorld.extractBasis(cameraRight, cameraUp, cameraFwd)

            // 3D速度をカメラ平面に投影 → 2Dスクリーン方向
            const vx = velocity.dot(cameraRight)
            const vy = velocity.dot(cameraUp)

            // トレイル方向 = 速度の逆方向（尾は頭部の後ろ）
            tempDir.set(-vx, -vy)
            if (tempDir.length() > 0.001) {
                tempDir.normalize()
                // スムーズに方向を更新
                trailDirRef.current.lerp(tempDir, 0.15)
                trailDirRef.current.normalize()
            }

            // トレイル長 = 速度に比例（上限あり）
            currentTrailLength.current = THREE.MathUtils.lerp(
                currentTrailLength.current,
                Math.min(speed3D * 0.25, 1.0),
                0.12
            )
        } else {
            // 停止中: トレイルを徐々に短く
            currentTrailLength.current = THREE.MathUtils.lerp(
                currentTrailLength.current,
                0.03,
                delta * 2.0
            )
        }

        prevPosRef.current.copy(currentPos)

        // ── シェーダーUniform更新 ──
        materialRef.current.trailDir = trailDirRef.current
        materialRef.current.trailLength = currentTrailLength.current
        materialRef.current.speed = Math.min(speed3D * 15, 5.0)
        // 明るさ: idle中は少し暗く、退場中は最後の2秒でフェードアウト
        if (phase === 'idle') {
            materialRef.current.brightness = 0.7
        } else if (phase === 'exiting' && exitTimer.current > 3.0) {
            const fadeProg = Math.min((exitTimer.current - 3.0) / 2.0, 1.0)
            materialRef.current.brightness = 1.0 - fadeProg
        } else {
            materialRef.current.brightness = 1.0
        }
    })

    if (phase === 'gone') return null

    return (
        <group ref={groupRef} position={startPos}>
            {/* ── Nagareboshiシェーダーによる流星ビジュアル ── */}
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                <mesh scale={[120, 120, 1]}>
                    <planeGeometry args={[1, 1]} />
                    <nagareboshiMaterial
                        ref={materialRef}
                        transparent
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </Billboard>

            {/* ── クリック検出用の不可視メッシュ ── */}
            <mesh
                onClick={(e) => {
                    e.stopPropagation()
                    if (phase === 'idle') onOpenDisplayModal()
                }}
                onPointerOver={() => { if (phase === 'idle') document.body.style.cursor = 'pointer' }}
                onPointerOut={() => document.body.style.cursor = 'auto'}
                visible={false}
            >
                <sphereGeometry args={[4, 8, 8]} />
                <meshBasicMaterial />
            </mesh>
        </group>
    )
}
