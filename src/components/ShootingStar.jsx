import * as THREE from 'three'
import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Trail, Float } from '@react-three/drei'
import { useFutureMessageStore } from '../store/useFutureMessageStore'

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
    const enterSpeed = 2.5 // Smooth interpolation speed
    const exitSpeed = 1.0  // ゆっくり退場

    // Subscribe to store to know when to exit
    // We need a way to trigger exit. The Modal will likely call a store action that we can listen to here?
    // Or we pass a prop. But the Modal is separate.
    // Ideally, the store has a state `isShootingStarLeaving`.
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
            // Lerp towards target
            currentPos.lerp(targetPos, delta * enterSpeed)
            // Check distance to switch to idle
            if (currentPos.distanceTo(targetPos) < 1.0) {
                setPhase('idle')
            }
        } else if (phase === 'idle') {
            // 待機中 - ユーザーのクリックを待つ
        } else if (phase === 'exiting') {
            // 加速しながら退場（8秒かけてゆっくり飛び去る）
            exitTimer.current += delta
            const t = Math.min(exitTimer.current / 8.0, 1.0) // 0→1 over 8 seconds
            const accel = 1 + t * 1 // 加速度: 1x → 2x
            currentPos.lerp(exitPos, delta * exitSpeed * accel)

            // 8秒経過で完了
            if (exitTimer.current > 8.0) {
                setPhase('gone')
                hideShootingStar()
            }
        }
    })

    if (phase === 'gone') return null

    return (
        <group>
            {/* Trail Effect */}
            <Trail
                width={3} // Width of the trail
                length={12} // Length of the trail
                color={new THREE.Color(1, 0.8, 0.4)} // Gold/Yellowish
                attenuation={(width) => width * 0.5} // Taper off
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
                    <sphereGeometry args={[1.5, 32, 32]} />
                    <meshBasicMaterial color={[2, 2, 1]} toneMapped={false} /> {/* HDR boost */}

                    {/* Glow Halo */}
                    <mesh scale={[2, 2, 2]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshBasicMaterial color={[1, 0.5, 0.2]} transparent opacity={0.3} side={THREE.BackSide} />
                    </mesh>
                </mesh>
            </Trail>
        </group>
    )
}
