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
    const color = new THREE.Color();

    // emotional (情緒的安定性 0-100) → 基本色相
    // 0 (つらい・どんより): 青系 (0.6) → 100 (心地いい・穏やか): 暖色系 (0.1)
    let hue = 0.6 - (emotional / 100) * 0.5;

    // motivation (動因の充足): やりきり度合いで色相を微調整
    // 高いmotivationは達成感の暖色方向へ
    const motivationShift = ((motivation - 50) / 100) * 0.1;
    hue = Math.max(0, Math.min(1, hue - motivationShift));

    // fulfillment (刺激の受容 0-100) → saturation (彩度)
    // 0 (退屈・マンネリ): 0.3 → 100 (新鮮・充実): 1.0
    const saturation = 0.3 + (fulfillment / 100) * 0.7;

    // social + physical → lightness (明度)
    // 社会的充足と体の軽やかさの組み合わせで明るさを決定
    const avgBrightness = (social + physical) / 2;
    const lightness = 0.4 + (avgBrightness / 100) * 0.5;

    color.setHSL(hue, saturation, lightness);
    return color;
}
