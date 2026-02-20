import React, { useState, useMemo } from "react";
import { useStarStore } from "../../../store/useStarStore";
import { getFallbackAnalysis } from "../../../utils/fallbackAnalysis";

export const LogViewsModal = ({ onClose }) => {
    const { stars } = useStarStore();

    // 現在表示中の年月（初期値は現在日時）
    const [currentDate, setCurrentDate] = useState(new Date());

    // 表示用データを作成
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed

        // ソート用の開始・終了日時
        // その月の1日 00:00:00
        const startDate = new Date(year, month, 1);
        // 翌月の1日 00:00:00 の直前（＝当月末）
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        // starsの中から、表示中の年月に該当するものをフィルタリング
        const filteredStars = stars.filter((star) => {
            // display_date があればそちらを優先するが、無効な日付の場合は created_at を使う
            let targetDateStr = star.display_date || star.created_at;
            let date = new Date(targetDateStr);
            let source = "display_date";

            // Invalid Date チェック
            if (isNaN(date.getTime())) {
                // display_date が無効なら created_at で再試行
                if (star.created_at) {
                    targetDateStr = star.created_at;
                    date = new Date(targetDateStr);
                    source = "created_at_fallback";
                }
            } else if (date.getFullYear() < 2000) {
                // 年が2000年未満（例: 1926年など）になってしまった場合も怪しいので created_at を試す
                if (star.created_at) {
                    const createdDate = new Date(star.created_at);
                    if (!isNaN(createdDate.getTime())) {
                        date = createdDate;
                        source = "created_at_year_fix";
                    }
                }
            }

            // それでも無効なら除外
            const isValid = !isNaN(date.getTime());

            if (!isValid) {
                console.log("Skipping invalid date:", star.id, targetDateStr);
                return false;
            }

            const isMatch = date >= startDate && date <= endDate;
            console.log("Check:", {
                id: star.id,
                source,
                finalDate: date.toString(),
                isMatch
            });

            return isMatch;
        });

        // 日付ごとにまとめる（同日に複数ある場合は最新を表示する、などのルールが必要だが、
        // ここでは単純に「その日のデータ」として扱う。同日複数なら配列にするか、あるいは1つだけ表示するか。）
        // 画像を見ると「1日」「2日」とあるので、日付ごとのカードを作る。
        // 日付 (1~31) をキーにしたMapを作る
        const daysMap = {};
        const lastDay = endDate.getDate();

        for (let d = 1; d <= lastDay; d++) {
            daysMap[d] = []; // その日のstarリスト
        }

        filteredStars.forEach((star) => {
            const targetDateStr = star.display_date || star.created_at;
            const date = new Date(targetDateStr);
            const day = date.getDate();
            if (daysMap[day]) {
                daysMap[day].push(star);
            }
        });

        return {
            year,
            month: month + 1, // 表示用は1-12
            daysMap,
            lastDay,
        };
    }, [stars, currentDate]);

    // 月移動
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // 感情ラベルを取得するヘルパー
    const getEmotionLabel = (star) => {
        // 1. analysis_data.emotion があればそれを使う
        if (star.analysis_data && star.analysis_data.emotion) {
            return star.analysis_data.emotion;
        }
        // 2. mood_values があれば、そこから再計算（フォールバック）
        if (star.mood_values) {
            const result = getFallbackAnalysis(star.mood_values);
            return result.emotion || "不明";
        }
        return "不明";
    };

    // 3 Good Things の数を取得
    const getGoodThingsCount = (star) => {
        // analysis_data.goodThings を確認
        let gt = star.analysis_data?.goodThings;

        // もし無くて、t_starsに直接保存されているパターンがあるならここでも見るが、
        // 基本はanalysis_dataに入っているはず。
        if (!gt) return 0;

        let count = 0;
        if (gt.goodThing1) count++;
        if (gt.goodThing2) count++;
        if (gt.goodThing3) count++;
        return count;
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
                color: "#fff",
                fontFamily: "sans-serif",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "90%",
                    maxWidth: "800px",
                    height: "80vh",
                    backgroundColor: "#1a1a2e", // ベース背景色（ダーク系）
                    borderRadius: "20px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                    overflow: "hidden"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "15px",
                        right: "15px",
                        background: "transparent",
                        border: "none",
                        color: "#fff",
                        fontSize: "24px",
                        cursor: "pointer",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10
                    }}
                >
                    ✕
                </button>

                {/* Header: Log Title & Month Nav */}
                <div style={{ marginBottom: "20px", textAlign: "center" }}>
                    <h2 style={{ margin: "0 0 10px 0", fontSize: "1.5rem", fontWeight: "normal", color: "#ddd" }}>
                        ログ一覧
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", fontSize: "1.2rem" }}>
                        <button
                            onClick={handlePrevMonth}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#fff",
                                fontSize: "1.5rem",
                                cursor: "pointer",
                                padding: "0 10px"
                            }}
                        >
                            {"<"}
                        </button>
                        <span style={{ fontWeight: "bold" }}>
                            {calendarData.month}月 {calendarData.year}年
                        </span>
                        <button
                            onClick={handleNextMonth}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#fff",
                                fontSize: "1.5rem",
                                cursor: "pointer",
                                padding: "0 10px"
                            }}
                        >
                            {">"}
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "grid",
                        // モバイルは3列、デスクトップは7列（レスポンシブ）
                        gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                        // 画面幅に応じて列数を制御したいが、inline styleだとmedia queryが使えない。
                        // 簡易的に minmax で調整するか、window widthを監視するか。
                        // ここではflex wrap的なgridにするか、画像に合わせて固定的なcolumn数を目指すか。
                        // 画像1は3列、画像2は7列。
                        // CSS Gridの auto-fill は便利だが、列数を強制するには repeat(7, 1fr) などが必要。
                        // ここではstyleタグを使ってメディアクエリを注入するか、あるいは汎用的なgridにする。
                        // 一旦、スマホファーストで3列ベース -> PCで広がる形にする。
                        gap: "10px",
                        padding: "10px",
                    }}
                    className="log-grid-container" // クラス名を付与してstyleタグで制御
                >
                    <style>{`
                .log-grid-container {
                    grid-template-columns: repeat(3, 1fr) !important;
                }
                @media (min-width: 600px) {
                    .log-grid-container {
                        grid-template-columns: repeat(7, 1fr) !important;
                    }
                }
            `}</style>

                    {/* Days */}
                    {Array.from({ length: calendarData.lastDay }, (_, i) => i + 1).map((day) => {
                        const dayStars = calendarData.daysMap[day];
                        const hasStar = dayStars.length > 0;
                        // 複数ある場合は最後の1つ（最新）を表示すると仮定
                        const star = hasStar ? dayStars[dayStars.length - 1] : null;

                        return (
                            <div
                                key={day}
                                style={{
                                    backgroundColor: hasStar ? "#3a3a4e" : "rgba(255,255,255,0.05)",
                                    color: hasStar ? "#fff" : "#aaa",
                                    borderRadius: "10px",
                                    padding: "8px",
                                    minHeight: "80px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    opacity: hasStar ? 1 : 0.5,
                                    transition: "transform 0.2s",
                                    cursor: hasStar ? "pointer" : "default",
                                }}
                                onMouseEnter={(e) => {
                                    if (hasStar) e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                    if (hasStar) e.currentTarget.style.transform = "scale(1)";
                                }}
                            >
                                <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{day}日</div>

                                {hasStar && star ? (
                                    <>
                                        <div style={{ fontSize: "0.8rem", textAlign: "center", margin: "5px 0" }}>
                                            {getEmotionLabel(star)}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "center", gap: "4px" }}>
                                            {/* Good Things Dots */}
                                            {Array.from({ length: 3 }).map((_, idx) => {
                                                const goodThingsCount = getGoodThingsCount(star);
                                                return (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            width: "8px",
                                                            height: "8px",
                                                            borderRadius: "50%",
                                                            backgroundColor: idx < goodThingsCount ? "#fff" : "rgba(255,255,255,0.3)",
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ flex: 1 }}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
