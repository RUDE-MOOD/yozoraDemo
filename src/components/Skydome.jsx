import { useEnvironment } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect } from 'react'

export function SkyDome() {
  const texture = useEnvironment({ files: 'textures/puresky2k.exr' })

  useEffect(() => {
    texture.mapping = THREE.UVMapping
    texture.repeat.set(1, 0.5)
    texture.offset.set(0, 0.5)
    texture.needsUpdate = true
  }, [texture])

  return (

    // 半球体（ドーム）をベースにする
    <mesh>
      <sphereGeometry args={[200, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  )
}

