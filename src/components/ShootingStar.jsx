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
    const exitSpeed = 4.0

    // Subscribe to store to know when to exit
    // We need a way to trigger exit. The Modal will likely call a store action that we can listen to here?
    // Or we pass a prop. But the Modal is separate.
    // Ideally, the store has a state `isShootingStarLeaving`.
    const { isShootingStarLeaving, hideShootingStar } = useFutureMessageStore()

    useFrame((state, delta) => {
        if (!meshRef.current) return

        // If store says leaving and we are not yet exiting, switch phase
        if (isShootingStarLeaving && phase === 'idle') {
            setPhase('exiting')
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
            // Floating handles the subtle movement, we just ensure it stays near target
            // (Float component wraps this mesh, so logic here acts on the inner mesh if needed, 
            // but modifying ref position directly works if Float is parent? No, Float modifies its group)
            // Actually, let's manually gently oscillate if we are not using Float wrapper for the main movement
            // For now, just stay put, let Float wrapper handle the "hover"
        } else if (phase === 'exiting') {
            // Accelerate away
            currentPos.lerp(exitPos, delta * exitSpeed)
            // If far enough, hide completely
            if (currentPos.distanceTo(startPos) > 300) { // Check distance from origin or just distance
                if (currentPos.distanceTo(exitPos) < 10) {
                    setPhase('gone')
                    hideShootingStar() // Reset store state
                }
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
