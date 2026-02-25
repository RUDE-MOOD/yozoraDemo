import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useStarStore } from '../../store/useStarStore';
import { CONSTELLATIONS } from '../../data/constellationData';
import * as THREE from 'three';

// --- カスタムシェーダーマテリアル ---
// 距離カリングと流れる光の効果を組み合わせた軽量なラインマテリアル
const glowLineVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const glowLineFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity; // カメラからの距離に基づいてCPUから渡される透明度
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // uOpacityが0の場合は完全に描画をスキップ（軽量化）
  if (uOpacity <= 0.01) discard;

  // vUv.x が 0.0 -> 1.0 に向かって線の始点から終点
  // 流光効果: uTime と vUv.x を組み合わせて sin 波を作る
  float glow = sin(vUv.x * 20.0 - uTime * 5.0) * 0.5 + 0.5;
  
  // ベースの透明度に流光のエフェクトを乗算
  float finalAlpha = uOpacity * (0.3 + glow * 0.7);

  // 加算合成用の出力
  gl_FragColor = vec4(uColor, finalAlpha);
}
`;

function ShaderGlowingLine({ start, end, color = "#e0e0ff" }) {
    const materialRef = useRef();
    const { camera } = useThree();

    // ジオメトリの構築（uvを付与してシェーダーで位置を把握できるようにする）
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            start[0], start[1], start[2],
            end[0], end[1], end[2]
        ]);
        const uvs = new Float32Array([
            0, 0,
            1, 0
        ]);
        geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        return geo;
    }, [start, end]);

    // 線分の中点を計算（カメラとの距離判定用）
    const center = useMemo(() => new THREE.Vector3(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2
    ), [start, end]);

    // カスタムマテリアル
    const material = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: glowLineVertexShader,
        fragmentShader: glowLineFragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(color) },
            uOpacity: { value: 0.0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false, // 線同士の重なりでおかしくならないように
    }), [color]);

    useFrame((state, delta) => {
        if (!materialRef.current) return;

        // 流光アニメーション時間を更新
        materialRef.current.material.uniforms.uTime.value += delta;

        // 距離に基づくカリング（Culling）とフェード
        // ユーザーがズームアウトした時や、星座から遠い時は描画しない/薄くする
        const distance = camera.position.distanceTo(center);

        // 距離のしきい値（この距離より離れると透明になり始める）
        // boxWidth を 60 に縮小したので、カメラが100単位以上離れたらフェードアウトさせる
        const maxVisibleDistance = 150.0;
        const fadeStartDistance = 80.0;

        let targetOpacity = 0.0;

        if (distance < fadeStartDistance) {
            targetOpacity = 1.0;
        } else if (distance < maxVisibleDistance) {
            // fadeStartDistance から maxVisibleDistance に向かって 1.0 -> 0.0 に減少
            targetOpacity = 1.0 - ((distance - fadeStartDistance) / (maxVisibleDistance - fadeStartDistance));
        }

        // カメラが極端に引いている時（Zが大きいなど）も念のため隠す
        if (camera.position.z > 80) {
            targetOpacity *= Math.max(0, 1.0 - ((camera.position.z - 80) / 20));
        }

        materialRef.current.material.uniforms.uOpacity.value = targetOpacity;
    });

    return (
        <line geometry={geometry} material={material} ref={materialRef} />
    );
}

export function ConstellationLines() {
    const stars = useStarStore((state) => state.stars);

    if (!stars || stars.length === 0) return null;

    // 現在取得されている星の中で星座の一部である座標をグループ化
    const activeNodes = {};

    // Reactの再レンダリングループ内で重い処理を避けるため、一回のループでマップを構築
    stars.forEach(s => {
        const cConfig = s.analysis_data?.constellation;
        if (cConfig) {
            if (!activeNodes[cConfig.id]) {
                activeNodes[cConfig.id] = {};
            }
            activeNodes[cConfig.id][cConfig.nodeIndex] = s.position;
        }
    });

    return (
        <group>
            {CONSTELLATIONS.map(c => {
                const cNodes = activeNodes[c.id];
                if (!cNodes) return null;

                return (
                    <group key={`constellation-group-${c.id}`}>
                        {c.lines.map((lineDef, idx) => {
                            const [indexA, indexB] = lineDef;
                            const posA = cNodes[indexA];
                            const posB = cNodes[indexB];

                            // 線の両端の星が存在する場合のみ描画する
                            if (posA && posB) {
                                return (
                                    <ShaderGlowingLine
                                        key={`line-${c.id}-${idx}`}
                                        start={posA}
                                        end={posB}
                                        color="#e0e0ff"
                                    />
                                );
                            }
                            return null;
                        })}
                    </group>
                );
            })}
        </group>
    );
}
