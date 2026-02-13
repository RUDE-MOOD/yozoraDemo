import * as THREE from "three";

/**
 * ムードデータから星を生成する
 * @param {Object} params - パラメータ
 * @param {Object} params.moodValues - スライダー値 (各0-100)
 *   - emotional: 情緒的安定性（つらい・どんより ↔ 心地いい・穏やか）
 *   - motivation: 動因の充足（無気力・不完全燃焼 ↔ やりきった・満足）
 *   - social: 社会的適応（孤独・物足りない ↔ 充足感・満タン）
 *   - physical: 生体的メカニズム（ずっしり重たい ↔ すっきり軽やか）
 *   - fulfillment: 刺激の受容（退屈・マンネリ ↔ 新鮮・充実していた）
 * @returns {Object} starData - 星のデータ
 */
export const starDataMaker = ({ moodValues }) => {

    const now = new Date();
    // 日付のフォーマット: YY/MM/DD HH:mm (例: 26/1/26 16:25)
    const year = now.getFullYear().toString().slice(-2);
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const dateStr = `${year}/${month}/${day} ${hours}:${minutes}`;

    // ランダムな位置設定
    // カメラの移動可能範囲内(-300~300, -150~150)に収まるように制限する
    const x = (Math.random() - 0.5) * 600;
    const y = (Math.random() - 0.5) * 300;
    const z = -10 + (Math.random() - 0.5) * 15;

    // ムードに基づいた色生成
    // comfort: 心地よさ (0=つらい/寒色系, 100=心地よい/暖色系)
    // intensity: 感情の強さ (0=無感情/彩度低, 100=抑えきれない/彩度高)
    // connection: つながり (0=孤独/明度低, 100=つながり/明度高)
    const color = generateMoodColor(moodValues);

    // 充実感と体の状態に応じてスケールを調整
    const baseScale = 2.0;
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
        position: [x, y, z],
        color: color,
        scale: scale,
        random: Math.random(),
        created_at: now.toISOString(),
        display_date: dateStr,
        mood_values: moodValues  // スライダー値を保存
    };
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
