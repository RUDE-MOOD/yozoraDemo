// skyboxの色合いを変える関数
// ディフォルトのやつを除いて、3パターン用意する
// 1.ディフォルトテーマ（紫色）　2.青色テーマ　3.緑色テーマ

const themeData = {
    purple: {
        "colorTop": "#000000",
        "colorBottom": "#101035",
        "colorA": "#101035",
        "colorB": "#551a8b",
        "color": "#aaaaff",
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
    }
}

export { themeData }
