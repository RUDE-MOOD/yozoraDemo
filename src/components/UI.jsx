import { useState } from 'react';

export const UI = ({ onSend }) => {
  // メニューの開閉状態
  const [menuOpen, setMenuOpen] = useState(false);
  // 日記モーダルの開閉状態
  const [diaryOpen, setDiaryOpen] = useState(false);
  // 日記の入力テキスト
  const [diaryText, setDiaryText] = useState('');

  // 送信ハンドラー
  const handleSend = () => {
    if (onSend && diaryText.trim() !== '') {
      onSend(diaryText);
    }
    console.log("Diary Entry Sent:", diaryText);
    setDiaryText('');
    setDiaryOpen(false);
  };

  return (
    <>
      {/* --- トップナビゲーション (Top Navigation) --- */}
      <div className="fixed top-6 right-6 z-[1000]">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-900/20 hover:bg-white/20 transition-all duration-300"
        >
          <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div>
          <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div>
          <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div>
        </button>

        {menuOpen && (
          <div className="absolute top-12 right-0 w-40 bg-[#1a1a3a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fade-in-down origin-top-right">
            <button
              onClick={() => {
                setMenuOpen(false);
                setDiaryOpen(true);
              }}
              className="w-full text-left px-5 py-3 text-white/90 hover:bg-white/10 transition-colors duration-200 font-sans tracking-widest text-xs"
            >
              日記を書く
            </button>
          </div>
        )}
      </div>

      {/* --- 日記モーダル (Diary Modal) --- */}
      {diaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景のバックドロップ (クリックで閉じる) */}
          <div
            className="absolute inset-0 bg-[#050510]/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setDiaryOpen(false)}
          ></div>

          {/* モーダルコンテンツ */}
          <div className="relative w-full max-w-sm mx-8 bg-gradient-to-b from-[#151530]/80 to-[#2a2a50]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl shadow-blue-900/30 transform transition-all duration-300 scale-100 opacity-100">

            {/* ヘッダーと閉じるボタン */}
            <div className="relative text-center mb-8 mt-2 flex items-center justify-center">
              <h2 className="text-white/90 font-sans text-lg tracking-[0.2em] font-light drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                今日のこと
              </h2>

              {/* 閉じる "X" ボタン - ヘッダー行に対して相対配置 */}
              <button
                onClick={() => setDiaryOpen(false)}
                className="absolute right-0 text-white/40 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* テキスト入力コンテナ (アニメーション用) */}
            <div className="relative w-full h-56 bg-black/20 rounded-2xl overflow-hidden mb-2">

              {/* レイヤー1: 表示レイヤー (テキストアニメーション) */}
              <div
                className="absolute inset-0 p-6 font-sans text-base leading-relaxed text-white/90 whitespace-pre-wrap break-words pointer-events-none"
                aria-hidden="true"
              >
                {diaryText.split('').map((char, index) => (
                  <span
                    key={index}
                    // inline-blockだと折り返しがずれるためinlineに変更
                    className="animate-char inline"
                    style={{ animationDelay: '0ms' }}
                  >
                    {char}
                  </span>
                ))}
                {/* 文字がない時のプレースホルダー表示 */}
                {diaryText.length === 0 && (
                  <span className="text-white/30">今日はどんな星を見つけましたか？...</span>
                )}
              </div>

              {/* レイヤー2: 入力レイヤー (透明だが操作可能) */}
              <textarea
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                className="absolute inset-0 w-full h-full p-6 bg-transparent text-transparent caret-white resize-none focus:outline-none focus:ring-1 focus:ring-white/10 rounded-2xl font-sans text-base leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* フッターボタン */}
            <div className="flex justify-end items-center mt-6">
              <button
                onClick={handleSend}
                className="px-10 py-3 bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-400 hover:to-purple-400 text-white rounded-full shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 tracking-widest text-sm font-medium border border-white/20"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
