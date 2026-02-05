import { useState, useEffect } from 'react';
import { StarDetailModal } from './StarDetailModal';
import { supabase } from '../supabaseClient';
import { useThemeStore } from '../store/useThemeStore';

// スライダー質問の定義（5つ）
const MOOD_QUESTIONS = [
  {
    id: 'comfort',
    question: '今の気持ちはどれくらい心地いい？',
    leftLabel: 'とてもつらい',
    rightLabel: 'とても心地いい',
  },
  {
    id: 'intensity',
    question: '気持ちはどれくらい強く動いている？',
    leftLabel: '無感情',
    rightLabel: '抑えきれない',
  },
  {
    id: 'connection',
    question: '人や世界とのつながりを感じている？',
    leftLabel: '孤独',
    rightLabel: 'つながっている',
  },
  {
    id: 'control',
    question: '自分をコントロールできている？',
    leftLabel: '混乱',
    rightLabel: '冷静',
  },
  {
    id: 'energy',
    question: 'エネルギーはどれくらいある？',
    leftLabel: '疲労',
    rightLabel: '活力',
  },
];

// 初期スライダー値
const INITIAL_MOOD_VALUES = {
  comfort: 50,
  intensity: 50,
  connection: 50,
  control: 50,
  energy: 50,
};

export const UI = ({ onSend, onStarClick }) => {
  // メニューの開閉状態
  const [menuOpen, setMenuOpen] = useState(false);
  // ユーザーメニューの開閉状態
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // 日記モーダルの開閉状態
  const [diaryOpen, setDiaryOpen] = useState(false);
  // スライダーの値（0-100）
  const [moodValues, setMoodValues] = useState(INITIAL_MOOD_VALUES);
  // 星の詳細確認モーダルの開閉状態
  const [starOpen, setStarOpen] = useState(false);
  // 選択された星のデータ
  const [selectedStarData, setSelectedStarData] = useState(null);
  // 送信時、重複送信を防ぐためのフラグ
  const [isSending, setIsSending] = useState(false);

  // テーマ変更関数
  const { setTheme } = useThemeStore();

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

  // 送信ハンドラー
  const handleSend = async () => {
    // 連打防止
    if (isSending) return;
    // 送信開始
    setIsSending(true);

    try {
      let analysisResult = null;
      // 1. Gemini APIを呼び出す (Supabase Edge Function)
      // スライダー値からフィードバックを生成
      try {
        const { data, error } = await supabase.functions.invoke('analyze-diary', {
          body: { moodValues }
        });
        if (error) {
          console.error("Gemini API Error:", error);
        } else {
          console.log("✅ Analysis Result:", data);
          if (data && data.success) {
            analysisResult = data;
          }
        }
      } catch (apiError) {
        console.error("API Call Failed:", apiError);
      }
      // 2. 結果と共にデータベースに保存する (APIが失敗しても日記は保存される)
      // onSendはApp.jsxで定義した関数（親はuseStarStoreのaddStarメソッド）で、引数は(moodValues, analysisResult)
      if (onSend) {
        await onSend(moodValues, analysisResult);
      }
      console.log("Mood Entry Saved!");

      // 3. フォームをリセットして閉じる
      setMoodValues(INITIAL_MOOD_VALUES);
      setDiaryOpen(false);

    } catch (error) {
      console.error("Critical Error in handleSend:", error);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSending(false);
    }
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
              className="w-full text-left py-3 text-white/90 hover:bg-white/10 transition-colors duration-200 font-sans tracking-widest text-xs"
              style={{ paddingLeft: '1rem', paddingRight: '1.25rem' }}
            >
              日記を書く
            </button>

            {/* テーマ変更セクション */}
            <div className="border-t border-white/10 my-1 mx-2"></div>
            <p className="text-white/50 text-[10px] uppercase tracking-widest px-5 py-2 font-sans">Theme</p>
            <div className="flex justify-around px-4 pb-4">
              {/* Purple Theme */}
              <button
                onClick={() => setTheme('purple')}
                className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform shadow-[0_0_10px_rgba(85,26,139,0.5)]"
                style={{ backgroundColor: '#551a8b' }}
                title="Purple"
              />
              {/* Blue Theme */}
              <button
                onClick={() => setTheme('blue')}
                className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,119,190,0.5)]"
                style={{ backgroundColor: '#0077be' }}
                title="Blue"
              />
              {/* Green Theme */}
              <button
                onClick={() => setTheme('green')}
                className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform shadow-[0_0_10px_rgba(46,139,87,0.5)]"
                style={{ backgroundColor: '#2e8b57' }}
                title="Green"
              />
            </div>
          </div>
        )}
      </div>

      {/* --- ユーザーメニュー (User Menu) - 左下 --- */}
      <div className="fixed bottom-6 left-6 z-[1000]">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shadow-purple-900/20 hover:bg-white/20 transition-all duration-300"
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
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-12 left-0 w-40 bg-[#1a1a3a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up origin-bottom-left">
            <button
              onClick={() => {
                setUserMenuOpen(false);
                // TODO: プロフィール機能
              }}
              className="w-full text-left py-3 text-white/90 hover:bg-white/10 transition-colors duration-200 font-sans tracking-widest text-xs"
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
          </div>
        )}
      </div>

      {/* --- 日記モーダル (Mood Diary Modal) --- */}
      {diaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景のバックドロップ (クリックで閉じる) */}
          <div
            className="absolute inset-0 bg-[#050510]/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setDiaryOpen(false)}
          ></div>

          {/* モーダルコンテンツ */}
          <div className="relative w-full max-w-sm mx-4 bg-gradient-to-b from-[#151530]/90 to-[#2a2a50]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-2xl shadow-blue-900/30 transform transition-all duration-300 scale-100 opacity-100 max-h-[85vh] overflow-y-auto">

            {/* ヘッダー: 日付と閉じるボタン */}
            <div className="relative text-center mb-6 flex items-center justify-center">
              <h2 className="text-white/90 font-sans text-lg tracking-[0.15em] font-light drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {getFormattedDate()}
              </h2>

              {/* 閉じる "X" ボタン */}
              <button
                onClick={() => setDiaryOpen(false)}
                className="absolute right-0 text-white/50 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* スライダー質問リスト */}
            <div className="space-y-6">
              {MOOD_QUESTIONS.map((q) => (
                <div key={q.id} className="space-y-2">
                  {/* 質問テキスト */}
                  <p className="text-white/90 text-sm font-sans tracking-wide text-center">
                    {q.question}
                  </p>

                  {/* スライダー */}
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

                  {/* ラベル */}
                  <div className="flex justify-between text-white/50 text-xs font-sans">
                    <span>{q.leftLabel}</span>
                    <span>{q.rightLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* フッター: 送信ボタン（矢印） */}
            <div className="flex justify-end items-center mt-8">
              <button
                onClick={handleSend}
                disabled={isSending}
                className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 disabled:opacity-50"
              >
                {isSending ? (
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 星の詳細確認モーダル (Star Detail Modal) --- */}
      <StarDetailModal
        isOpen={starOpen}
        onClose={() => {
          setStarOpen(false);
          setSelectedStarData(null);
        }}
        starData={selectedStarData}
      />
    </>
  );
};
