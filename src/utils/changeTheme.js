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
    colorTop: "#000000",
    colorBottom: "#001133",
    colorA: "#001133",
    colorB: "#0077be",
    color: "#aaccff",
  },
  green: {
    colorTop: "#000000",
    colorBottom: "#051a05",
    colorA: "#051a05",
    colorB: "#2e8b57",
    color: "#ccffcc",
  },
  space: {
    colorTop: "#000000",
    colorBottom: "#0d0221",
    colorA: "#240046",
    colorB: "#5a189a",
    color: "#e0aaff",
  },
  orange: {
    colorTop: "#21050c",
    colorBottom: "#dc2f02",
    colorA: "#9d0208",
    colorB: "#faa307",
    color: "#ffba08",
  },
  red: {
    colorTop: "#21050c",
    // メインカラー
    colorBottom: "#dc2f02",
    // 上半色
    colorA: "#d62839",
    // セカンダリーカラー
    colorB: "#0000FF",
    // 背景霧
    color: "#175676",
  },
  bright_blue: {
    colorTop: "#000000",
    // メインカラー
    colorBottom: "#0077be",
    // 上半色
    colorA: "#ffffff",
    // セカンダリーカラー
    colorB: "#0000FF",
    // 背景霧
    color: "#0077be",
  },
};

export { themeData };
