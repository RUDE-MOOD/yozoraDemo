/**
 * マイセイザ（My Constellations）モーダル
 *
 * ＝＝＝ 概要 ＝＝＝
 * ユーザーが完成した・進行中の星座を一覧で表示し、
 * 各星座の詳細情報を閲覧できるモーダルコンポーネント。
 *
 * ＝＝＝ レスポンシブ構成 ＝＝＝
 * - モバイル（<768px）: step式全画面ナビゲーション
 *   step0 = リスト / step1 = 詳細
 * - PC（≥768px）: 左にリスト + 右に詳細の2カラム
 *
 * ＝＝＝ デザイン ＝＝＝
 * ProfileModal / StarDetailModal と同じグラスモーフィズム
 */

import { useState } from "react";
import { CONSTELLATIONS } from "../../../data/constellationData";
import { useStarStore } from "../../../store/useStarStore";

// --- 星座図を描画するSVGコンポーネント ---
function ConstellationDiagram({
  constellation,
  size = 160,
  showLines = true,
  className = "",
}) {
  const padding = 16;
  const innerSize = size - padding * 2;
  const filledIndices = constellation.filledIndices || [];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {/* 接続線 */}
      {showLines &&
        constellation.lines.map(([a, b], i) => {
          const sA = constellation.starPositions[a];
          const sB = constellation.starPositions[b];
          return (
            <line
              key={`line-${i}`}
              x1={padding + sA.x * innerSize}
              y1={padding + sA.y * innerSize}
              x2={padding + sB.x * innerSize}
              y2={padding + sB.y * innerSize}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />
          );
        })}

      {/* 星（ドット） */}
      {constellation.starPositions.map((pos, i) => {
        const isFilled = filledIndices.includes(i);
        return (
          <g key={`star-${i}`}>
            {/* グロー */}
            <circle
              cx={padding + pos.x * innerSize}
              cy={padding + pos.y * innerSize}
              r={isFilled ? 5 : 3}
              fill={
                isFilled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"
              }
            />
            {/* コア */}
            <circle
              cx={padding + pos.x * innerSize}
              cy={padding + pos.y * innerSize}
              r={isFilled ? 2.5 : 1.8}
              fill={
                isFilled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"
              }
            />
          </g>
        );
      })}
    </svg>
  );
}

// --- 星座カード（リスト表示用） ---
function ConstellationCard({ constellation, onClick }) {
  const isCompleted = !!constellation.completedDate;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 text-left group"
      style={{ padding: "0 10px" }}
    >
      {/* 左: テキスト */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white/95 text-xl font-bold tracking-wide mb-2">
          {constellation.name}
        </h3>
        {isCompleted ? (
          <p className="text-white/40 text-xs tracking-wide">
            {constellation.completedDate}に完成
          </p>
        ) : (
          <p className="text-white/40 text-xs tracking-wide">
            {constellation.filledStars}/{constellation.starCount} 星
          </p>
        )}
      </div>

      {/* 右: 星座図（小） */}
      <div className="flex-shrink-0">
        <ConstellationDiagram
          constellation={constellation}
          size={100}
          showLines={isCompleted}
        />
      </div>
    </button>
  );
}

// --- 星座詳細ビュー ---
function ConstellationDetail({ constellation, onBack, onViewConstellation }) {
  const isCompleted = !!constellation.completedDate;

  return (
    <div className="flex flex-col h-full">
      {/* モバイル戻るボタン（PCでは非表示） */}
      <div className="flex md:hidden items-center mb-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 text-white/70 hover:text-white transition-colors"
          aria-label="戻る"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-white/70 text-sm tracking-wide">マイセイザ</span>
      </div>

      {/* 詳細コンテンツ（スクロール可能） */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden pr-1">
        {/* 星座図（大） */}
        <div className="flex justify-center mb-6">
          <ConstellationDiagram
            constellation={constellation}
            size={240}
            showLines={true}
          />
        </div>

        {/* 星座名 + 進捗 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white/95 text-2xl font-bold tracking-wide">
              {constellation.name}
            </h2>
            {isCompleted ? (
              <span className="text-white/40 text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10">
                完成
              </span>
            ) : (
              <span
                className="text-white/40 text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10"
                style={{ padding: "3px 10px" }}
              >
                {constellation.filledStars}/{constellation.starCount}
              </span>
            )}
          </div>
          {isCompleted && (
            <p className="text-white/30 text-xs tracking-wide">
              {constellation.completedDate}に完成
            </p>
          )}
        </div>

        {/* 概要 */}
        <div className="mb-6">
          <p
            className="text-white/70 text-sm leading-relaxed whitespace-pre-line"
            style={{ margin: "10px" }}
          >
            {constellation.description}
          </p>
        </div>

        {/* 特徴 */}
        {constellation.features && (
          <div className="mb-6">
            <h3 className="text-white/90 text-lg font-bold mb-3 tracking-wide">
              特徴
            </h3>
            <p
              className="text-white/70 text-sm leading-relaxed whitespace-pre-line"
              style={{ margin: "10px" }}
            >
              {constellation.features}
            </p>
          </div>
        )}

        {/* 由来と歴史 */}
        {constellation.history && (
          <div className="mb-6">
            <h3 className="text-white/90 text-lg font-bold mb-3 tracking-wide">
              由来と歴史
            </h3>
            <p
              className="text-white/70 text-sm leading-relaxed whitespace-pre-line"
              style={{ margin: "10px" }}
            >
              {constellation.history}
            </p>
          </div>
        )}

        {/* 完成時: 星座を見るボタン */}
        {isCompleted && (
          <div className="flex justify-center mt-4 mb-8">
            <button
              onClick={onViewConstellation}
              className="px-6 py-3 bg-transparent border-2 border-white/50 text-white/90 rounded-2xl text-sm tracking-widest hover:bg-white/10 transition-all duration-300"
            >
              星座を見る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- メインコンポーネント ---
export function ConstellationModal({ isOpen, onClose }) {
  // 選択中の星座（null = リスト表示）
  const [selectedId, setSelectedId] = useState(null);

  const { stars, setFocusTarget } = useStarStore();

  if (!isOpen) return null;

  // 現在の星データに基づいて星座情報を拡張
  const enrichedConstellations = CONSTELLATIONS.map((c) => {
    const filledIndices = [];
    let completedDate = null;

    stars.forEach((s) => {
      if (s.analysis_data?.constellation?.id === c.id) {
        filledIndices.push(s.analysis_data.constellation.nodeIndex);
      }
    });

    const isCompleted = filledIndices.length >= c.starCount;
    if (isCompleted) {
      const dates = stars
        .filter((s) => s.analysis_data?.constellation?.id === c.id)
        .map((s) => new Date(s.created_at).getTime());

      if (dates.length > 0) {
        const maxDate = new Date(Math.max(...dates));
        completedDate = `${maxDate.getFullYear()}/${String(maxDate.getMonth() + 1).padStart(2, "0")}/${String(maxDate.getDate()).padStart(2, "0")}`;
      }
    }

    return {
      ...c,
      filledStars: filledIndices.length,
      filledIndices,
      completedDate,
    };
  });

  const selectedConstellation = selectedId
    ? enrichedConstellations.find((c) => c.id === selectedId)
    : null;

  // モーダルを閉じる（状態もリセット）
  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  const handleViewConstellation = (c) => {
    const cStars = stars.filter(
      (s) => s.analysis_data?.constellation?.id === c.id,
    );
    if (cStars.length > 0) {
      let sumX = 0,
        sumY = 0,
        sumZ = 0;
      cStars.forEach((s) => {
        sumX += s.position[0];
        sumY += s.position[1];
        sumZ += s.position[2];
      });
      const center = [
        sumX / cStars.length,
        sumY / cStars.length,
        sumZ / cStars.length,
      ];
      setFocusTarget(center);
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 md:justify-start md:pl-8"
      onClick={handleClose}
    >
      {/* バックドロップ */}
      <div className="absolute inset-0 transition-opacity duration-300" />

      {/* === モバイルレイアウト === */}
      <div
        className="relative z-10 md:hidden w-full h-full bg-black/30 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-full flex flex-col"
          style={{ padding: "24px 24px 32px" }}
        >
          {!selectedConstellation ? (
            /* --- リスト画面 (モバイル) --- */
            <>
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white/95 text-xl font-bold tracking-[0.15em]">
                  マイセイザ
                </h2>
                <button
                  onClick={handleClose}
                  className="text-white/50 hover:text-white transition-colors w-10 h-10 flex items-center justify-center"
                  aria-label="閉じる"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* 星座リスト */}
              <div className="flex-1 overflow-y-auto scrollbar-hidden flex flex-col gap-3 pb-6">
                {enrichedConstellations.map((c) => (
                  <ConstellationCard
                    key={c.id}
                    constellation={c}
                    onClick={() => setSelectedId(c.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            /* --- 詳細画面 (モバイル) --- */
            <ConstellationDetail
              constellation={selectedConstellation}
              onBack={() => setSelectedId(null)}
              onViewConstellation={() =>
                handleViewConstellation(selectedConstellation)
              }
            />
          )}
        </div>
      </div>

      {/* === PCレイアウト（2カラム） === */}
      <div
        className="relative z-10 hidden md:flex items-start gap-4 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左パネル: リスト */}
        <div
          className="w-80 bg-black/30 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl shadow-black/40 max-h-[85vh] overflow-y-auto scrollbar-hidden animate-slide-in-left"
          style={{ padding: "24px", marginLeft: "1rem" }}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-white/95 text-lg font-bold tracking-[0.15em]"
              style={{ padding: "10px", letterSpacing: "0rem" }}
            >
              マイセイザ
            </h2>
            <button
              onClick={handleClose}
              className="text-white/50 hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
              aria-label="閉じる"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 星座リスト */}
          <div className="flex flex-col gap-3 pb-6">
            {enrichedConstellations.map((c) => (
              <ConstellationCard
                key={c.id}
                constellation={c}
                onClick={() => setSelectedId(c.id)}
              />
            ))}
          </div>
        </div>

        {/* 右パネル: 詳細（選択時のみ） */}
        {selectedConstellation && (
          <div
            className="w-96 bg-black/30 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl shadow-black/40 max-h-[85vh] overflow-y-auto scrollbar-hidden animate-slide-in-left"
            style={{ padding: "24px 28px", animationDelay: "0.05s" }}
          >
            <ConstellationDetail
              constellation={selectedConstellation}
              onBack={() => setSelectedId(null)}
              onViewConstellation={() =>
                handleViewConstellation(selectedConstellation)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
