import * as THREE from "three";
import { getAppNow } from "./appTime";

import { CONSTELLATIONS } from "../data/constellationData";

// 文字列から簡単なハッシュ値を生成（星座の配置を固定するため）
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * ムードデータから星を生成する
 * @param {Object} params - パラメータ
 * @param {Object} params.moodValues - スライダー値 (各0-100)
 *   - emotional: 情緒的安定性（つらい・どんより ↔ 心地いい・穏やか）
 *   - motivation: 動因の充足（無気力・不完全燃焼 ↔ やりきった・満足）
 *   - social: 社会的適応（孤独・物足りない ↔ 充足感・満タン）
 *   - physical: 生体的メカニズム（ずっしり重たい ↔ すっきり軽やか）
 *   - fulfillment: 刺激の受容（退屈・マンネリ ↔ 新鮮・充実していた）
 * @param {Array} params.existingStars - 現在画面に存在する星の配列
 * @returns {Object} starData - 星のデータ
 */
export const starDataMaker = ({ moodValues, existingStars = [] }) => {

    const now = getAppNow();
    // 日付のフォーマット: YY/MM/DD HH:mm (例: 26/1/26 16:25)
    const year = now.getFullYear().toString().slice(-2);
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const dateStr = `${year}/${month}/${day} ${hours}:${minutes}`;

    // --- 星座判定ロジック ---
    const isConstellationCandidate = (
        moodValues.emotional >= 50 &&
        moodValues.motivation >= 50 &&
        moodValues.social >= 50 &&
        moodValues.physical >= 50 &&
        moodValues.fulfillment >= 50
    );

    let targetConstellation = null;
    let targetNodeIndex = -1;

    if (isConstellationCandidate) {
        for (const c of CONSTELLATIONS) {
            // この星座に既に割り当てられているノードを特定
            const takenNodes = new Set();
            existingStars.forEach(s => {
                if (s.analysis_data?.constellation?.id === c.id) {
                    takenNodes.add(s.analysis_data.constellation.nodeIndex);
                }
            });

            // まだ空きがある場合
            if (takenNodes.size < c.starCount) {
                targetConstellation = c;
                for (let i = 0; i < c.starCount; i++) {
                    if (!takenNodes.has(i)) {
                        targetNodeIndex = i;
                        break;
                    }
                }
                break;
            }
        }
    }

    let position = [0, 0, 0];
    let assignedConstellation = null;

    if (targetConstellation) {
        // 星座のノードとして座標を計算
        // 星座全体が収まるボックスサイズ
        const boxWidth = 60;
        const boxHeight = 60;

        // 全体の移動可能範囲（ユーザー指定）
        // x= -320 ~ 320,  y = -160 ~ 160
        // はみ出さないように中心点の範囲を制限
        const minX = -320 + boxWidth / 2 + 10;
        const maxX = 320 - boxWidth / 2 - 10;
        const minY = -160 + boxHeight / 2 + 10;
        const maxY = 160 - boxHeight / 2 - 10;

        const hash = hashCode(targetConstellation.id);
        const prngX = (hash % 100) / 100; // 0.0 ~ 0.99
        const prngY = ((hash * 13) % 100) / 100;
        const prngZ = ((hash * 17) % 100) / 100;

        let centerX = minX + prngX * (maxX - minX);
        let centerY = minY + prngY * (maxY - minY);
        let baseZ = -10 + prngZ * 15; // -10 ~ 5 の間

        // イルカ座（delphinus）がウミヘビ座（hydra）と座標被り（ハッシュ衝突）するため、固定の別座標に手動設定
        if (targetConstellation.id === "delphinus") {
            centerX = 180;
            centerY = 50;
            baseZ = 0;
        }

        // 兎座（lepus）も他の星座と近い位置にあるため、右下の空きエリアに移動
        if (targetConstellation.id === "lepus") {
            centerX = 220;
            centerY = -100;
            baseZ = 0;
        }

        const nodeNormalized = targetConstellation.starPositions[targetNodeIndex];

        // 0~1の正規化座標から相対座標へ (-0.5は中心揃えのため)
        const localX = (nodeNormalized.x - 0.5) * boxWidth;
        // SVGのy=0は上端だが、3Dのy=0は中心、y>0は上。なので反転させる
        const localY = (0.5 - nodeNormalized.y) * boxHeight;

        position = [
            centerX + localX,
            centerY + localY,
            baseZ + (Math.random() - 0.5) * 2 // Zにわずかな揺らぎ
        ];

        assignedConstellation = {
            id: targetConstellation.id,
            nodeIndex: targetNodeIndex
        };
    } else {
        // 降格、または候補外の場合はランダム生成（衝突判定付き）
        // 星座の星の座標リストを取得
        const constellationPositions = existingStars
            .filter(s => s.analysis_data?.constellation)
            .map(s => s.position);

        let validPosition = false;
        let attempts = 0;
        let x, y, z;

        while (!validPosition && attempts < 50) {
            x = (Math.random() - 0.5) * 640; // -320 ~ 320
            y = (Math.random() - 0.5) * 320; // -160 ~ 160
            z = -10 + (Math.random() - 0.5) * 15; // -10 ~ 5

            validPosition = true;
            for (const pos of constellationPositions) {
                const dx = pos[0] - x;
                const dy = pos[1] - y;
                const dz = pos[2] - z;
                // 他の星座星とXY平面（または3D空間）で被らないようにする
                // 半径5程度（距離の2乗: 25）
                if ((dx * dx + dy * dy + dz * dz) < 25) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }
        position = [x, y, z];
    }

    // ムードに基づいた色生成
    const color = generateMoodColor(moodValues);

    // 充実感と体の状態に応じてスケールを調整
    const baseScale = assignedConstellation ? 2.5 : 2.0; // 星座の星は少しベースを大きく
    const fulfillmentBonus = (moodValues.fulfillment / 100) * 2.0;
    const physicalBonus = (moodValues.physical / 100) * 1.5;
    const scale = baseScale + fulfillmentBonus + physicalBonus + Math.random() * 0.5;

    // UUID生成
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const starData = {
        id: generateUUID(),
        position: position,
        color: color,
        scale: scale,
        random: Math.random(),
        created_at: now.toISOString(),
        display_date: dateStr,
        mood_values: moodValues  // スライダー値を保存
    };

    if (assignedConstellation) {
        starData.constellation = assignedConstellation;
    }

    return starData;
};

/**
 * ムード値から色を生成
 * @param {Object} moodValues - { emotional, motivation, social, physical, fulfillment }
 * @returns {THREE.Color} 生成された色
 */
function generateMoodColor(moodValues) {
    const { emotional, motivation, social, physical, fulfillment } = moodValues;

    // 【特殊ケース】全て100の場合 → ゴールド（黄金の輝き）
    if (emotional === 100 && motivation === 100 && social === 100 && physical === 100 && fulfillment === 100) {
        return new THREE.Color(0xFFD700);
    }

    // 【特殊ケース】全て0の場合 → 明るめのグレー
    if (emotional === 0 && motivation === 0 && social === 0 && physical === 0 && fulfillment === 0) {
        return new THREE.Color(0xA0A0A5);
    }

    // 各ムードパラメータに対応する基本色
    // emotional (心地よさ): 黄色
    const c1 = { r: 1, g: 1, b: 0 };
    // motivation (自分らしさ): 赤
    const c2 = { r: 1, g: 0, b: 0 };
    // social (心の充電): マゼンタ
    const c3 = { r: 1, g: 0, b: 1 };
    // physical (体の状態): シアン
    const c4 = { r: 0, g: 1, b: 1 };
    // fulfillment (充実感): 緑
    const c5 = { r: 0, g: 1, b: 0 };

    // Calculate weighted sum
    let r = 0, g = 0, b = 0;

    // Normalize weights (0-100 -> 0-1)
    const w1 = emotional / 100;
    const w2 = motivation / 100;
    const w3 = social / 100;
    const w4 = physical / 100;
    const w5 = fulfillment / 100;

    r = c1.r * w1 + c2.r * w2 + c3.r * w3 + c4.r * w4 + c5.r * w5;
    g = c1.g * w1 + c2.g * w2 + c3.g * w3 + c4.g * w4 + c5.g * w5;
    b = c1.b * w1 + c2.b * w2 + c3.b * w3 + c4.b * w4 + c5.b * w5;

    // Normalize by max component to brighten
    const max = Math.max(r, g, b);

    // If max is 0 (all sliders 0), return lighter grey
    if (max === 0) return new THREE.Color(0xA0A0A5);

    return new THREE.Color(r / max, g / max, b / max);
}
