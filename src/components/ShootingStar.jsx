import * as THREE from 'three'
import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import { useFutureMessageStore } from '../store/useFutureMessageStore'

// ── 火花パーティクル: 流れ星の周囲にキラキラ ──
function Sparkles({ parentRef, count = 12 }) {
    const sparklesRef = useRef([])
    const velocities = useRef([])

    // 初期化
    useMemo(() => {
        velocities.current = Array.from({ length: count }, () => ({
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2,
            life: Math.random(),
            speed: 0.3 + Math.random() * 0.7,
        }))
    }, [count])

    useFrame((_, delta) => {
        if (!parentRef.current) return
        const origin = parentRef.current.position

        sparklesRef.current.forEach((spark, i) => {
            if (!spark) return
            const v = velocities.current[i]
            v.life -= delta * v.speed

            if (v.life <= 0) {
                // リセット: 親の位置に戻る
                spark.position.copy(origin)
                v.life = 0.5 + Math.random() * 0.5
                v.x = (Math.random() - 0.5) * 3
                v.y = (Math.random() - 0.5) * 3
                v.z = (Math.random() - 0.5) * 3
            }

            // 移動 + フェードアウト
            spark.position.x += v.x * delta * 2
            spark.position.y += v.y * delta * 2
            spark.position.z += v.z * delta * 2
            spark.material.opacity = v.life * 0.8
            spark.scale.setScalar(v.life * 0.6)
        })
    })

    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <mesh key={i} ref={(el) => (sparklesRef.current[i] = el)}>
                    <sphereGeometry args={[0.15, 8, 8]} />
                    <meshBasicMaterial
                        color={[3, 2.5, 1.5]}
                        transparent
                        opacity={0.8}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </>
    )
}

export function ShootingStar({ onOpenDisplayModal }) {
    const meshRef = useRef()
    const { camera } = useThree()
    // Animation Phase: 'entering' -> 'idle' -> 'exiting' -> 'gone'
    const [phase, setPhase] = useState('entering')

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
    const exitPos = useMemo(() => new THREE.Vector3(
        camera.position.x + 200,
        camera.position.y - 100,
        camera.position.z + 200
    ), [])

    // Speed factors
    const enterSpeed = 2.5
    const exitSpeed = 1.0  // ゆっくり退場

    const { isShootingStarLeaving, hideShootingStar } = useFutureMessageStore()

    // 退場タイマー
    const exitTimer = useRef(0)

    useFrame((state, delta) => {
        if (!meshRef.current) return

        // If store says leaving and we are not yet exiting, switch phase
        if (isShootingStarLeaving && phase === 'idle') {
            setPhase('exiting')
            exitTimer.current = 0
        }

        const currentPos = meshRef.current.position

        if (phase === 'entering') {
            currentPos.lerp(targetPos, delta * enterSpeed)
            if (currentPos.distanceTo(targetPos) < 1.0) {
                setPhase('idle')
            }
        } else if (phase === 'idle') {
            // 待機中 - ユーザーのクリックを待つ
        } else if (phase === 'exiting') {
            exitTimer.current += delta
            const t = Math.min(exitTimer.current / 8.0, 1.0)
            const accel = 1 + t * 1
            currentPos.lerp(exitPos, delta * exitSpeed * accel)

            if (exitTimer.current > 8.0) {
                setPhase('gone')
                hideShootingStar()
            }
        }
    })

    if (phase === 'gone') return null

    return (
        <group>
            {/* 外側トレイル: 橙赤 → フェードアウト（幅広・長い） */}
            <Trail
                width={5}
                length={20}
                color={new THREE.Color(1.5, 0.6, 0.2)}
                attenuation={(width) => width * 0.3}
            >
                {/* 内側トレイル: 白 → ゴールド（細く・明るい） */}
                <Trail
                    width={1.5}
                    length={18}
                    color={new THREE.Color(2, 1.8, 1.2)}
                    attenuation={(width) => width * 0.5}
                >
                    <mesh
                        ref={meshRef}
                        position={startPos}
                        onClick={(e) => {
                            e.stopPropagation()
                            if (phase === 'idle') onOpenDisplayModal()
                        }}
                        onPointerOver={() => document.body.style.cursor = 'pointer'}
                        onPointerOut={() => document.body.style.cursor = 'auto'}
                    >
                        {/* コア: 小さく極めて明るい白い点 */}
                        <sphereGeometry args={[0.5, 16, 16]} />
                        <meshBasicMaterial
                            color={[4, 3.5, 2.5]}
                            toneMapped={false}
                        />

                        {/* 内側グロー: 暖かい黄金 */}
                        <mesh scale={[2.5, 2.5, 2.5]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshBasicMaterial
                                color={[2, 1.5, 0.5]}
                                transparent
                                opacity={0.25}
                                side={THREE.BackSide}
                                depthWrite={false}
                                blending={THREE.AdditiveBlending}
                                toneMapped={false}
                            />
                        </mesh>

                        {/* 外側グロー: 柔らかいオレンジ */}
                        <mesh scale={[4, 4, 4]}>
                            <sphereGeometry args={[1, 12, 12]} />
                            <meshBasicMaterial
                                color={[1.2, 0.5, 0.15]}
                                transparent
                                opacity={0.12}
                                side={THREE.BackSide}
                                depthWrite={false}
                                blending={THREE.AdditiveBlending}
                                toneMapped={false}
                            />
                        </mesh>
                    </mesh>
                </Trail>
            </Trail>

            {/* 火花パーティクル */}
            <Sparkles parentRef={meshRef} count={10} />
        </group>
    )
}
