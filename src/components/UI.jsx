import { useState, useEffect } from 'react';
import { StarDetailModal } from './StarDetailModal';
import { supabase } from '../supabaseClient';
import { useThemeStore } from '../store/useThemeStore';

export const UI = ({ onSend, onStarClick }) => {
  // メニューの開閉状態
  const [menuOpen, setMenuOpen] = useState(false);
  // ユーザーメニューの開閉状態
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // 日記モーダルの開閉状態
  const [diaryOpen, setDiaryOpen] = useState(false);
  // 日記の入力テキスト
  const [diaryText, setDiaryText] = useState('');
  // 星の詳細確認モーダルの開閉状態
  const [starOpen, setStarOpen] = useState(false);
  // 選択された星のデータ
  const [selectedStarData, setSelectedStarData] = useState(null);
  // 送信時、重複送信を防ぐためのフラグ
  const [isSending, setIsSending] = useState(false);

  // テーマ変更関数
  const { setTheme } = useThemeStore();

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
    // 空文字列チェック
    if (diaryText.trim() === '') return;
    // 送信開始
    setIsSending(true);

    try {
      let analysisResult = null;
      // 1. Gemini APIを呼び出す (Supabase Edge Function)
      // 注意: 開発環境では時々タイムアウトすることがあるので、その場合はnullのまま進む
      try {
        // エッジファンクションを応用して、body内に日記のテキストを送信する
        const { data, error } = await supabase.functions.invoke('analyze-diary', {
          body: { diaryText }
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
      // onSendはApp.jsxで定義した関数（親はuseStarStoreのaddStarメソッド）で、引数は(text, analysisResult)
      if (onSend) {
        await onSend(diaryText, analysisResult);
      }
      console.log("Diary Entry Saved!");

      // 3. フォームをリセットして閉じる
      setDiaryText('');
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
