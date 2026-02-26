import React, { useState, useMemo, useEffect } from "react";
import { getAppNow } from "../../../utils/appTime";
import { useStarStore } from "../../../store/useStarStore";
import { useUserStore } from "../../../store/useUserStore";
import { getFallbackAnalysis } from "../../../utils/fallbackAnalysis";
import { supabase } from "../../../supabaseClient";

export const LogViewsModal = ({ onClose, onLogClick }) => {
  const { stars } = useStarStore();
  const { user } = useUserStore();

  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // 初回マウント時にユーザーのアクティブなタグを取得
  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("t_tag")
          .select("id, tag_name")
          .eq("creator_id", user.id)
          .order("creation_date", { ascending: true });
        if (error) throw error;
        setAvailableTags(data || []);
      } catch (err) {
        console.error("タグ取得エラー:", err);
      }
    };
    fetchTags();
  }, [user]);

  // 現在表示中の年月（初期値は現在日時）
  const [currentDate, setCurrentDate] = useState(getAppNow());

  // 表示用データを作成
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const filteredStars = stars.filter((star) => {
      // created_at はISO形式で信頼できるため、こちらを優先する
      // display_date は "YY/MM/DD HH:mm" 形式でブラウザが正しくパースできないため使わない
      const date = new Date(star.created_at);
      if (isNaN(date.getTime())) return false;
      const inMonth = date >= startDate && date <= endDate;

      // タグで絞り込み
      const passTag = selectedTag ? (star.analysis_data?.tag === selectedTag) : true;

      return inMonth && passTag;
    });

    const monthStars = stars.filter((star) => {
      const date = new Date(star.created_at);
      if (isNaN(date.getTime())) return false;
      return date >= startDate && date <= endDate;
    });

    // 今月の星からタグを抽出（削除されたタグも含む）
    const tagsInMonth = [...new Set(monthStars.map(s => s.analysis_data?.tag).filter(Boolean))];

    const daysMap = {};
    const lastDay = endDate.getDate();

    for (let d = 1; d <= lastDay; d++) {
      daysMap[d] = [];
    }

    filteredStars.forEach((star) => {
      const date = new Date(star.created_at);
      const day = date.getDate();
      if (daysMap[day]) {
        daysMap[day].push(star);
      }
    });

    return { year, month: month + 1, daysMap, lastDay, tagsInMonth };
  }, [stars, currentDate, selectedTag]);

  // 月移動
  const now = getAppNow();

  // ログ画面で進める「最大月」を決定（現在のアプリ時間 または 未来に書かれた星の時間の、どちらか遅い方）
  let maxDate = new Date(now);
  if (stars && stars.length > 0) {
    const latestStarTime = Math.max(...stars.map(s => new Date(s.created_at).getTime()));
    if (latestStarTime > maxDate.getTime()) {
      maxDate = new Date(latestStarTime);
    }
  }

  const isMaxMonth =
    currentDate.getFullYear() > maxDate.getFullYear() ||
    (currentDate.getFullYear() === maxDate.getFullYear() &&
      currentDate.getMonth() >= maxDate.getMonth());

  const isMinMonth =
    currentDate.getFullYear() === 2025 && currentDate.getMonth() === 11;

  const handlePrevMonth = () => {
    if (isMinMonth) return;
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };
  const handleNextMonth = () => {
    if (isMaxMonth) return;
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  // 表示するタグの完全なリスト（現在のアクティブなタグ + 今月の星で使われている削除済みタグ）
  const allDisplayTags = useMemo(() => {
    const activeTagNames = availableTags.map(t => t.tag_name);
    const deletedButUsedTags = calendarData.tagsInMonth.filter(t => !activeTagNames.includes(t));
    return [...activeTagNames, ...deletedButUsedTags];
  }, [availableTags, calendarData.tagsInMonth]);

  // 感情ラベルを取得するヘルパー
  const getEmotionLabel = (star) => {
    if (star.analysis_data?.emotion) return star.analysis_data.emotion;
    if (star.mood_values) {
      const result = getFallbackAnalysis(star.mood_values);
      return result.emotion || "不明";
    }
    return "不明";
  };

  // 3 Good Things の数を取得
  const getGoodThingsCount = (star) => {
    const gt = star.analysis_data?.goodThings;
    if (!gt) return 0;
    let count = 0;
    if (gt.goodThing1) count++;
    if (gt.goodThing2) count++;
    if (gt.goodThing3) count++;
    return count;
  };

  // 日セルの描画
  const renderDayCell = (day) => {
    const dayStars = calendarData.daysMap[day];
    const hasStar = dayStars.length > 0;
    // 同日に複数ある場合は最新の1件のみ
    const star = hasStar ? dayStars[dayStars.length - 1] : null;

    return (
      <div
        key={day}
        style={{
          backgroundColor: hasStar
            ? "rgba(255,255,255,0.2)"
            : "rgba(255,255,255,0.05)",
          color: hasStar ? "#fff" : "#aaa",
          borderRadius: "10px",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: hasStar ? 1 : 0.5,
          transition: "transform 0.2s",
          cursor: hasStar ? "pointer" : "default",
          boxShadow: "inset 0 0 5px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => {
          if (hasStar && star && onLogClick) {
            e.stopPropagation();
            onLogClick(star);
          }
        }}
        onMouseEnter={(e) => {
          if (hasStar) e.currentTarget.style.transform = "scale(1.01)";
        }}
        onMouseLeave={(e) => {
          if (hasStar) e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{day}日</div>

        {hasStar && star ? (
          <>
            <div
              style={{
                fontSize: "0.8rem",
                textAlign: "center",
                margin: "5px 0",
              }}
            >
              {getEmotionLabel(star)}
            </div>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "4px" }}
            >
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor:
                      idx < getGoodThingsCount(star)
                        ? "#fff"
                        : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{ flex: 1 }}></div>
        )}
      </div>
    );
  };

  const days = Array.from({ length: calendarData.lastDay }, (_, i) => i + 1);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        color: "#fff",
        fontFamily: "Kiwi Maru",
      }}
      onClick={onClose}
    >
      <style>{`
                /* ===== モバイル用 (600px未満) ===== */
                .log-modal-wrapper {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    border-radius: 0 !important;
                    background-color: rgba(0,0,0,0.2) !important;
                    padding: 16px !important;
                }
                .log-header-desktop { display: none !important; }
                .log-header-mobile { display: flex !important; }
                .log-close-desktop { display: none !important; }
                .log-grid-container {
                    grid-template-columns: repeat(3, 1fr) !important;
                    grid-auto-rows: 92px !important;
                    overflow-y: auto !important;
                }

                /* ===== デスクトップ用 (600px以上) ===== */
                @media (min-width: 600px) {
                    .log-modal-wrapper {
                        width: 90% !important;
                        height: 85vh !important;
                        max-width: 1100px !important;
                        border-radius: 24px !important;
                        background-color: rgba(0, 0, 0, 0.5) !important;
                        padding: 1rem 3rem 2rem 3rem !important;
                    }
                    .log-header-desktop { display: flex !important; }
                    .log-header-mobile { display: none !important; }
                    .log-grid-container {
                        grid-template-columns: repeat(7, 1fr) !important;
                        overflow: hidden !important;
                    }
                }
            `}</style>

      <div
        className="log-modal-wrapper"
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 0 30px rgba(0,0,0,0.6)",
          overflow: "hidden",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== デスクトップ用ヘッダー（横一列） ===== */}
        <div
          className="log-header-desktop"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* 左: ログ一覧 | */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.3rem",
                color: "#fff",
                letterSpacing: "0r  em",
                fontFamily: "Kiwi Maru",
              }}
            >
              ログ一覧
            </h2>
            <div
              style={{
                width: "1px",
                height: "24px",
                backgroundColor: "rgba(255,255,255,0.3)",
              }}
            ></div>
          </div>

          {/* 中央: ◄ 月 年 ► */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <button
              onClick={handlePrevMonth}
              disabled={isMinMonth}
              style={{
                background: "transparent",
                border: "none",
                color: isMinMonth
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.5)",
                cursor: isMinMonth ? "not-allowed" : "pointer",
                padding: "4px 8px",
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                if (!isMinMonth) e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                if (!isMinMonth)
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ width: "24px", height: "24px" }}
              >
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <span
              style={{
                fontSize: "1.4rem",
                fontWeight: "200",
                color: "#fff",
                minWidth: "180px",
                textAlign: "center",
                display: "inline-block",
                letterSpacing: "0rem",
                fontFamily: "Kiwi Maru",
              }}
            >
              {calendarData.month}月 {calendarData.year}年
            </span>
            <button
              onClick={handleNextMonth}
              disabled={isMaxMonth}
              style={{
                background: "transparent",
                border: "none",
                color: isMaxMonth
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.5)",
                cursor: isMaxMonth ? "not-allowed" : "pointer",
                padding: "4px 8px",
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                if (!isMaxMonth) e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                if (!isMaxMonth)
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ width: "24px", height: "24px" }}
              >
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </div>

          {/* 右: タグ絞り込み ＆ ✕ */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {allDisplayTags.length > 0 && (
              <select
                value={selectedTag || ""}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "20px",
                  color: "#fff",
                  padding: "4px 12px",
                  fontSize: "0.9rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="" style={{ color: "#000" }}>すべてのタグ</option>
                {allDisplayTags.map(tag => (
                  <option key={tag} value={tag} style={{ color: "#000" }}>
                    #{tag}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: "20px",
                cursor: "pointer",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
              }
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===== モバイル用ヘッダー ===== */}
        <div
          className="log-header-mobile"
          style={{
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            paddingTop: "20px",
            paddingBottom: "10px",
          }}
        >
          {/* ピル型タイトル + 閉じるボタン */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              paddingLeft: "16px",
              paddingRight: "16px",
            }}
          >
            <div style={{ flex: 1 }}></div>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "24px",
                padding: "10px 40px",
              }}
            >
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  letterSpacing: "0.1rem",
                }}
              >
                ログ
              </span>
            </div>
            <div
              style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
            >
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "22px",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* 年月ナビゲーション */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "1.1rem",
            }}
          >
            <button
              onClick={handlePrevMonth}
              disabled={isMinMonth}
              style={{
                background: "transparent",
                border: "none",
                color: isMinMonth ? "rgba(255,255,255,0.15)" : "#fff",
                fontSize: "1.3rem",
                cursor: isMinMonth ? "not-allowed" : "pointer",
                padding: "4px 8px",
              }}
            >
              {"<"}
            </button>
            <span
              style={{
                letterSpacing: "0.1em",
                minWidth: "160px",
                textAlign: "center",
                display: "inline-block",
              }}
            >
              {calendarData.year}年 {calendarData.month}月
            </span>
            <button
              onClick={handleNextMonth}
              disabled={isMaxMonth}
              style={{
                background: "transparent",
                border: "none",
                color: isMaxMonth ? "rgba(255,255,255,0.15)" : "#fff",
                fontSize: "1.3rem",
                cursor: isMaxMonth ? "not-allowed" : "pointer",
                padding: "4px 8px",
              }}
            >
              {">"}
            </button>
          </div>

          {/* モバイル用: タグ絞り込み */}
          {allDisplayTags.length > 0 && (
            <div style={{ marginTop: "4px" }}>
              <select
                value={selectedTag || ""}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "20px",
                  color: "#fff",
                  padding: "4px 12px",
                  fontSize: "0.9rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="" style={{ color: "#000" }}>すべてのタグ</option>
                {allDisplayTags.map(tag => (
                  <option key={tag} value={tag} style={{ color: "#000" }}>
                    #{tag}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ===== カレンダーグリッド ===== */}
        <div
          className="log-grid-container"
          style={{
            flex: 1,
            display: "grid",
            gap: "8px",
            padding: "8px",
          }}
        >
          {days.map(renderDayCell)}
        </div>
      </div>
    </div>
  );
};
