import * as THREE from "three";


export const starDataMaker = ({ text }) => {

    const now = new Date();
    // 日付のフォーマット: YY/MM/DD HH:mm (例: 26/1/26 16:25)
    // Monthは0始まりなので+1する
    // getYear() は1900年からの経過年数、getFullYear() は2026を返す
    // '26'が欲しいので、full yearの末尾2桁を切り出す
    const year = now.getFullYear().toString().slice(-2);
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const dateStr = `${year}/${month}/${day} ${hours}:${minutes}`;

    // ランダムな位置設定
    // カメラの移動可能範囲内(-300~300, -150~150)に収まるように制限する
    // これにより、生成された星にカメラで確実に近づけるようにする
    const x = (Math.random() - 0.5) * 600;
    const y = (Math.random() - 0.5) * 300;
    const z = -10 + (Math.random() - 0.5) * 15;

    // ランダムな色設定 (MyStarsと同じロジック)
    const randomType = Math.random();
    const color = new THREE.Color();
    if (randomType > 0.9) {
        color.setHSL(0.8 + Math.random() * 0.15, 0.9, 0.8);
    } else if (randomType > 0.75) {
        color.setHSL(0.08 + Math.random() * 0.12, 0.9, 0.8);
    } else if (randomType > 0.5) {
        color.setHSL(0.45 + Math.random() * 0.1, 0.8, 0.8);
    } else {
        color.setHSL(0.6 + Math.random() * 0.1, 0.6 + Math.random() * 0.4, 0.8 + Math.random() * 0.2);
    }
    const starData = {
        id: crypto.randomUUID(),
        position: [x, y, z],
        color: color,
        scale: 2.0 + Math.random() * 4.0,
        random: Math.random(),
        date: dateStr,
        text: text
    };
    return starData;
};
