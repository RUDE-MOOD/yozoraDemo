// skyboxの色合いを変える関数
// ディフォルトのやつを除いて、2パターン用意する
// 1.ディフォルトテーマ（紫色）　2.青色テーマ　3.緑色テーマ

const themeData = {
    purple: {
        colorTop: "#8900f2",
        colorBottom: "#bc00dd",
        colorA: "#1a0b2e",
        colorB: "#be95c4",
        color: "#b388eb",
    },
    blue: {
        "colorTop": "#000000",
        "colorBottom": "#001133",
        "colorA": "#001133",
        "colorB": "#0077be",
        "color": "#aaccff",
    },
    green: {
        "colorTop": "#000000",
        "colorBottom": "#051a05",
        "colorA": "#051a05",
        "colorB": "#2e8b57",
        "color": "#ccffcc",
    },
    space: {
        "colorTop": "#000000",        // 完全な黒（無限の彼方）
        "colorBottom": "#0d0221",     // 非常に深い紫（宇宙の深淵）
        "colorA": "#240046",          // 濃い藍色（星雲のベース）
        "colorB": "#5a189a",          // 鮮やかな紫（輝く星雲）
        "color": "#e0aaff",           // 淡いラベンダー（フォグ・光）
    },
    orange: {
        "colorTop": "#21050c",
        "colorBottom": "#dc2f02",
        "colorA": "#9d0208",
        "colorB": "#faa307",
        "color": "#ffba08",
    },

}

export { themeData }