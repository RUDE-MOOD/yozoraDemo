import { useState, useEffect } from 'react';
import { StarDetailModal } from './StarDetailModal';
import { supabase } from '../supabaseClient';
import { ThemeSelectionModal } from './ThemeSelectionModal';
import { getFallbackAnalysis } from '../utils/fallbackAnalysis';
import { FutureMessageInputModal } from './FutureMessageInputModal';
import { FutureMessageDisplayModal } from './FutureMessageDisplayModal';
import { useFutureMessageStore } from '../store/useFutureMessageStore';
import { useStarStore } from '../store/useStarStore';

// スライダー質問の定義（5つ）
const MOOD_QUESTIONS = [
  {
    id: 'emotional',      // 情緒的安定性
    question: '今の気持ちは心地いい？',
    leftLabel: 'つらい・どんより',
    rightLabel: '心地いい・穏やか',
  },
  {
    id: 'motivation',     // 動因の充足
    question: '今日は「自分らしく」過ごせた？',
    leftLabel: '無気力・不完全燃焼',
    rightLabel: 'やりきった・満足',
  },
  {
    id: 'social',         // 社会的適応
    question: '今日の「心の満たされ方」は？',
    leftLabel: '孤独・物足りない',
    rightLabel: '充足感・満タン',
  },
  {
    id: 'physical',       // 生体的メカニズム
    question: '今の「体」の状態は？',
    leftLabel: 'ずっしり重たい',
    rightLabel: 'すっきり軽やか',
  },
  {
    id: 'fulfillment',    // 刺激の受容
    question: '今日の「充実感」はどうだった？',
    leftLabel: '退屈・マンネリ',
    rightLabel: '新鮮・充実していた',
  },
];

// 初期スライダー値
const INITIAL_MOOD_VALUES = {
  emotional: 50,    // 情緒的安定性
  motivation: 50,   // 動因の充足
  social: 50,       // 社会的適応
  physical: 50,     // 生体的メカニズム
  fulfillment: 50,  // 刺激の受容
};

export const UI = ({ onSend, onStarClick }) => {
  // メニューの開閉状態
  const [menuOpen, setMenuOpen] = useState(false);
  // ユーザーメニューの開閉状態
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // 日記モーダルの開閉状態
  const [diaryOpen, setDiaryOpen] = useState(false);
  // テーマ選択モーダルの開閉状態
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  // スライダーの値（0-100）
  const [moodValues, setMoodValues] = useState(INITIAL_MOOD_VALUES);
  // 星の詳細確認モーダルの開閉状態
  const [starOpen, setStarOpen] = useState(false);
  // 選択された星のデータ
  const [selectedStarData, setSelectedStarData] = useState(null);
  // 送信時、重複送信を防ぐためのフラグ
  const [isSending, setIsSending] = useState(false);
  // 今日のいいこと
  const [goodThing1, setGoodThing1] = useState('');
  const [goodThing2, setGoodThing2] = useState('');
  const [goodThing3, setGoodThing3] = useState('');
  // スマホ用: 0=スライダー, 1=テキスト入力
  const [mobileDiaryStep, setMobileDiaryStep] = useState(0);

  // Future Message Store
  const {
    isFutureStarVisible,
    futureStarPosition,
    triggerShootingStarCheck,
    debug_setFutureStarVisible,
    debug_setShootingStarVisible,
    debug_loadMockMessage
  } = useFutureMessageStore();

  const { setFocusTarget } = useStarStore();

  // Debug Modals
  const [debugOpen, setDebugOpen] = useState(false);

  // スライダー値の更新
  const handleSliderChange = (id, value) => {
    setMoodValues(prev => ({ ...prev, [id]: value }));
  };

  // 今日の日付をフォーマット
  const getFormattedDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // 日記モーダルを閉じる（ステップもリセット）
  const closeDiaryModal = () => {
    setDiaryOpen(false);
    setMobileDiaryStep(0);
  };

  // 星の詳細を表示する関数
  const showStarDetails = (starData) => {
    console.log('showStarDetails called with:', starData);
    setSelectedStarData(starData);
    setStarOpen(true);
  };

  // 親コンポーネントにコールバックを渡す
  useEffect(() => {
    if (onStarClick) {
      console.log('Setting star click handler');
      onStarClick(showStarDetails);
    }
  }, []); // 依存配列を空にして、マウント時のみ実行

  // handleSend
  const handleSend = async () => {
    // 連打防止
    if (isSending) return;
    // 送信開始
    setIsSending(true);

    try {
      const goodThings = { goodThing1, goodThing2, goodThing3 };
      let analysisResult = null;
      // 1. Gemini APIを呼び出す (Supabase Edge Function)
      // スライダー値と今日のいいことから星からの手紙を生成
      try {
        const { data, error } = await supabase.functions.invoke('analyze-diary', {
          body: { moodValues, goodThings }
        });
        if (error) {
          console.error("Gemini API Error:", error);
        } else if (data && data.success) {
          console.log("✅ Analysis Result:", data);
          analysisResult = data;
        }
        // API失敗時はフォールバックで星からの手紙を生成
        if (!analysisResult) {
          analysisResult = getFallbackAnalysis(moodValues, goodThings);
        }
      } catch (apiError) {
        console.error("API Call Failed:", apiError);
        analysisResult = getFallbackAnalysis(moodValues, goodThings);
      }
      // 2. 結果と共にデータベースに保存する (APIが失敗しても日記は保存される)
      if (onSend) {
        await onSend(moodValues, analysisResult, goodThings);
      }
      console.log("Mood Entry Saved!");

      // カメラが日記星にフォーカスして安定してから流れ星チェック（1.5秒後）
      setTimeout(() => {
        triggerShootingStarCheck(moodValues);
      }, 1500);

      // 3. フォームをリセットして閉じる
      setMoodValues(INITIAL_MOOD_VALUES);
      setGoodThing1('');
      setGoodThing2('');
      setGoodThing3('');
      setMobileDiaryStep(0);
      setDiaryOpen(false);

      // 4. Trigger Check for Future Message (Shooting Star)
      // We need to access the store (but hooks can't be used inside callbacks easily if not defined at top)
      // So we assume the store hook is used in the component
    } catch (error) {
      console.error("Critical Error in handleSend:", error);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSending(false);
    }
  };//handleSend

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
              className="w-full text-left py-3 text-white/90 hover:bg-white/10 transition-colors duration-200 font-sans tracking-widest text-xs"
              style={{ paddingLeft: '1rem', paddingRight: '1.25rem' }}
            >
              日記を書く
            </button>
          </div>
        )}
      </div>

      {/* --- ユーザーメニュー (User Menu) - 左下 --- */}
      <div className="fixed bottom-6 left-6 z-[1000]">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shadow-purple-900/20 hover:bg-white/20 transition-all duration-300"
        >
          {/* 人のアイコン (User Icon) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
          {/* 未来への手紙バッジ (FutureStar通知ドット) */}
          {isFutureStarVisible && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(100,210,255,0.8)] animate-pulse" />
          )}
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-12 left-0 w-40 bg-[#1a1a3a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up origin-bottom-left">
            {/* 未来への手紙メニュー項目（FutureStarが表示中のみ） */}
            {isFutureStarVisible && futureStarPosition && (
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  setFocusTarget(futureStarPosition);
                }}
                className="w-full text-left py-3 text-cyan-300/90 hover:bg-cyan-500/10 transition-colors duration-200 font-sans tracking-widest text-xs"
                style={{ paddingLeft: '1rem', paddingRight: '1.25rem' }}
              >
                未来への手紙
              </button>
            )}
            <button
              onClick={() => {
                setUserMenuOpen(false);
                setThemeModalOpen(true);
              }}
              className={`w-full text-left py-3 text-white/90 hover:bg-white/10 transition-colors duration-200 font-sans tracking-widest text-xs${isFutureStarVisible ? ' border-t border-white/5' : ''}`}
              style={{ paddingLeft: '1rem', paddingRight: '1.25rem' }}
            >
              テーマ
            </button>
            <button
              onClick={() => {
                setUserMenuOpen(false);
                // TODO: 設定機能
              }}
              className="w-full text-left py-3 text-white/90 hover:bg-white/10 transition-colors duration-200 font-sans tracking-widest text-xs border-t border-white/5"
              style={{ paddingLeft: '1rem', paddingRight: '1.25rem' }}
            >
              ログ
            </button>
            <button
              onClick={() => {
                setUserMenuOpen(false);
                // TODO: ログアウト機能
              }}
              className="w-full text-left py-3 text-white/90 hover:bg-white/10 transition-colors duration-200 font-sans tracking-widest text-xs border-t border-white/5"
              style={{ paddingLeft: '1rem', paddingRight: '1.25rem' }}
            >
              設定
            </button>
            <button
              onClick={() => {
                setUserMenuOpen(false);
                setDebugOpen(true);
              }}
              className="w-full text-left py-3 text-red-400/90 hover:bg-white/10 transition-colors duration-200 font-sans tracking-widest text-xs border-t border-white/5"
              style={{ paddingLeft: '1rem', paddingRight: '1.25rem' }}
            >
              デバッグ
            </button>
          </div>
        )}
      </div>

      {/* --- Debug Panel --- */}
      {debugOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDebugOpen(false)}>
          <div className="bg-[#1a1a3a] border border-white/20 p-6 rounded-2xl w-80 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-center border-b border-white/10 pb-2">デバッグツール</h3>

            <div className="space-y-2">
              <p className="text-xs text-white/50">未来への手紙（入力）</p>
              <button
                onClick={() => {
                  if (!isFutureStarVisible) {
                    debug_setFutureStarVisible(true);
                  }
                  setTimeout(() => {
                    const pos = useFutureMessageStore.getState().futureStarPosition;
                    if (pos) setFocusTarget(pos);
                  }, 100);
                  setDebugOpen(false);
                }}
                className="w-full py-2 bg-blue-500/20 text-blue-200 rounded hover:bg-blue-500/40 text-sm"
              >
                {isFutureStarVisible ? '未来星にフォーカス' : '未来星を強制表示＆フォーカス'}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-white/50">流れ星（過去のメッセージ取得）</p>
              <button
                onClick={() => { debug_loadMockMessage(); debug_setShootingStarVisible(true); setDebugOpen(false); }}
                className="w-full py-2 bg-pink-500/20 text-pink-200 rounded hover:bg-pink-500/40 text-sm"
              >
                流れ星を強制表示（モック）
              </button>
            </div>

            <button
              onClick={() => setDebugOpen(false)}
              className="w-full py-2 mt-4 bg-white/10 text-white rounded hover:bg-white/20 text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* --- 日記モーダル (Mood Diary Modal) --- */}
      {diaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:items-center">
          {/* 背景のバックドロップ (クリックで閉じる) */}
          <div
            className="absolute inset-0 bg-[#050510]/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeDiaryModal}
          ></div>

          {/* モーダルコンテンツ */}
          <div
            className="relative w-full max-w-sm md:max-w-3xl mx-6 bg-gradient-to-b from-[#151530]/90 to-[#2a2a50]/90 backdrop-blur-2xl border border-white/10 rounded-t-3xl md:rounded-[32px] shadow-2xl shadow-blue-900/30 transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] md:max-h-[85vh] overflow-y-auto mt-auto md:mt-0 min-h-[70vh] md:min-h-0"
            style={{ padding: '24px' }}
          >

            {/* ヘッダー: スマホは戻る矢印+日付、PCは日付+X */}
            <div className="relative z-10 flex items-center justify-between mb-6 min-h-[44px]">
              {/* 左: スマホ戻る / PCはスペース */}
              <div className="w-12 flex-shrink-0 flex md:hidden">
                <button
                  type="button"
                  onClick={() => (mobileDiaryStep === 1 ? setMobileDiaryStep(0) : closeDiaryModal())}
                  className="flex items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] text-white/90 hover:text-white active:opacity-70 transition-opacity touch-manipulation"
                  aria-label={mobileDiaryStep === 1 ? '戻る' : '閉じる'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div className="hidden md:block w-12 flex-shrink-0" />

              {/* 中央: 日付 */}
              <h2 className="flex-1 text-center text-white/95 font-sans text-xl md:text-lg tracking-[0.15em] font-light drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {getFormattedDate()}
              </h2>

              {/* 右: PCは閉じるX / スマホはスペース（左右バランス用） */}
              <div className="w-12 flex-shrink-0 flex justify-end">
                <button
                  type="button"
                  onClick={closeDiaryModal}
                  className="hidden md:flex items-center justify-center w-10 h-10 text-white/50 hover:text-white transition-colors"
                  aria-label="閉じる"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              {/* コンテンツ: スマホはステップ切替、PCは左右2カラムで全表示 */}
              <div className="flex flex-col md:flex-row md:gap-8">
                {/* 左: スライダー質問リスト（スマホステップ0 / PC常時） */}
                <div
                  className={`flex-1 space-y-6 min-w-0 ${mobileDiaryStep === 1 ? 'hidden md:block' : 'block'
                    }`}
                >
                  {MOOD_QUESTIONS.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-white/90 text-sm font-sans tracking-wide text-center md:text-left">
                        {q.question}
                      </p>
                      <div className="relative px-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={moodValues[q.id]}
                          onChange={(e) => handleSliderChange(q.id, parseInt(e.target.value))}
                          className="mood-slider w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${moodValues[q.id]}%, rgba(255,255,255,0.2) ${moodValues[q.id]}%, rgba(255,255,255,0.2) 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-white/50 text-xs font-sans">
                        <span>{q.leftLabel}</span>
                        <span>{q.rightLabel}</span>
                      </div>
                    </div>
                  ))}

                  {/* スマホステップ0: →ボタンで次へ */}
                  <div className="flex md:hidden justify-end items-center mt-8">
                    <button
                      onClick={() => setMobileDiaryStep(1)}
                      className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-all duration-300"
                      aria-label="次へ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 右: 今日のいいこと入力 + 打ち上げボタン（スマホステップ1 / PC常時） */}
                <div
                  className={`flex flex-1 flex-col gap-5 md:gap-4 ${mobileDiaryStep === 0 ? 'hidden md:flex' : 'flex'
                    }`}
                >
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-sans tracking-wide block">
                      今日のいいこと1 <span className="text-white/50">(必須)</span>
                    </label>
                    <input
                      type="text"
                      value={goodThing1}
                      onChange={(e) => setGoodThing1(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-4 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-sans tracking-wide block">
                      今日のいいこと2 <span className="text-white/50">(任意)</span>
                    </label>
                    <input
                      type="text"
                      value={goodThing2}
                      onChange={(e) => setGoodThing2(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-4 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-sans tracking-wide block">
                      今日のいいこと3 <span className="text-white/50">(任意)</span>
                    </label>
                    <input
                      type="text"
                      value={goodThing3}
                      onChange={(e) => setGoodThing3(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-4 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  {/* 打ち上げボタン */}
                  <div className="mt-6 md:mt-auto flex justify-center md:justify-start">
                    <button
                      onClick={handleSend}
                      disabled={isSending || !goodThing1.trim()}
                      className="w-full md:w-auto min-w-[200px] px-8 py-4 md:py-3 bg-transparent border-2 border-white text-white rounded-2xl font-sans tracking-widest text-sm font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isSending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          送信中...
                        </span>
                      ) : (
                        '打ち上げ'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- テーマ選択モーダル (Theme Selection Modal) --- */}
      <ThemeSelectionModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />

      {/* --- 星の詳細確認モーダル (Star Detail Modal) --- */}
      <StarDetailModal
        isOpen={starOpen}
        onClose={() => {
          setStarOpen(false);
          setSelectedStarData(null);
        }}
        starData={selectedStarData}
      />

      {/* --- 未来への手紙入力モーダル --- */}
      <FutureMessageInputModal />

      {/* --- 過去の自分からの手紙表示モーダル --- */}
      <FutureMessageDisplayModal />
    </>
  );
};
