import * as THREE from "three";

/**
 * ムードデータから星を生成する
 * @param {Object} params - パラメータ
 * @param {Object} params.moodValues - スライダー値 { comfort, intensity, connection, control, energy } (各0-100)
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

    // 感情の強さとエネルギーに応じてスケールを調整
    const baseScale = 2.0;
    const intensityBonus = (moodValues.intensity / 100) * 2.0;
    const energyBonus = (moodValues.energy / 100) * 1.5;
    const scale = baseScale + intensityBonus + energyBonus + Math.random() * 0.5;

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
 * @param {Object} moodValues - { comfort, intensity, connection, control, energy }
 * @returns {THREE.Color} 生成された色
 */
function generateMoodColor(moodValues) {
    const { comfort, intensity, connection, control, energy } = moodValues;
    const color = new THREE.Color();

    // comfort (0-100) → 基本色相
    // 0 (つらい): 青系 (0.6) → 100 (心地よい): 暖色系 (0.1)
    let hue = 0.6 - (comfort / 100) * 0.5;

    // control: コントロール度合いで色相を微調整
    // 高いcontrolは色を安定させる（紫〜青方向へ）
    // 低いcontrolは色を不安定に（赤〜オレンジ方向へ）
    const controlShift = ((control - 50) / 100) * 0.1;
    hue = Math.max(0, Math.min(1, hue + controlShift));

    // intensity (0-100) → saturation (彩度)
    // 0 (無感情): 0.3 → 100 (抑えきれない): 1.0
    const saturation = 0.3 + (intensity / 100) * 0.7;

    // connection + energy → lightness (明度)
    // つながりとエネルギーの組み合わせで明るさを決定
    const avgBrightness = (connection + energy) / 2;
    const lightness = 0.4 + (avgBrightness / 100) * 0.5;

    color.setHSL(hue, saturation, lightness);
    return color;
}
