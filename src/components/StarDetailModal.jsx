/*
  [星の詳細モーダル表示フロー - ユーザーが星をクリックしてから詳細が表示されるまで]

  ＝＝＝ 概要 ＝＝＝
  このコンポーネントは、ユーザーが3D空間上の星をクリックした際に、
  その星の詳細情報（生成時刻、座標、大きさ、色、日記テキスト）を表示するモーダルです。
  複数のコンポーネントを経由したデータフローにより実現されています。

  ＝＝＝ データフロー（全体像） ＝＝＝
  
  1. [ユーザーアクション] 
     ユーザーが3D空間上の星（UserStarコンポーネント）をクリック
     ↓
  2. [UserStar.jsx - handleClick関数]
     クリックイベントが発火し、onStarClick(starData)を呼び出す
     ↓
  3. [UserAddedStars.jsx]
     各UserStarに渡されたonStarClickをそのまま親へ伝達
     ↓
  4. [Experience.jsx]
     UserAddedStarsから受け取ったonStarClickをさらに親へ伝達
     ↓
  5. [App.jsx - starClickHandler]
     Experienceから受け取ったonStarClickをUIコンポーネントへ渡す
     ↓
  6. [UI.jsx - showStarDetails関数]
     starDataを受け取り、以下の2つのステートを更新:
     - setSelectedStarData(starData) → モーダルに表示するデータをセット
     - setStarOpen(true) → モーダルを開く
     ↓
  7. [StarDetailModal.jsx - このコンポーネント]
     isOpen={true}とstarData={...}を受け取り、モーダルを表示

  ＝＝＝ 詳細な実装フロー ＝＝＝

  【ステップ1: 初期化（アプリ起動時）】
  
  App.jsx:
    - starClickHandlerステートを初期化（useState(() => null)）
    - UIコンポーネントにhandleSetStarClickHandlerを渡す
  
  UI.jsx:
    - useEffectでマウント時に実行
    - onStarClick(showStarDetails)を呼び出し、showStarDetails関数を親に渡す
  
  App.jsx:
    - handleSetStarClickHandlerが呼ばれる
    - setStarClickHandler(() => showStarDetails)で関数を保存
    - この関数がExperience → UserAddedStars → UserStarへと伝達される

  【ステップ2: 星のクリック（ユーザーアクション）】
  
  UserStar.jsx:
    ```javascript
    const handleClick = (e) => {
      e.stopPropagation(); // イベントの伝播を止める
      
      // デバッグログ
      console.log('=== Star clicked! ===');
      console.log('onStarClick:', onStarClick);
      console.log('starData:', starData);
      
      // モーダルを開く
      if (onStarClick && starData) {
        console.log('Calling onStarClick with starData');
        onStarClick(starData); // ← ここで親に星のデータを渡す
      }
    };
    ```
    
    starDataの中身:
    {
      id: 1706345678901,           // タイムスタンプベースのユニークID
      position: [125.45, -67.32, -8.91], // 3D座標 [X, Y, Z]
      color: { r: 0.65, g: 0.54, b: 0.98 }, // RGB色情報（0.0～1.0）
      scale: 4.23,                 // 星の大きさ（2.0～6.0）
      random: 0.742,               // 瞬きアニメーション用のランダム値
      date: '26/1/27 16:02',       // 生成日時（YY/MM/DD HH:mm形式）
      text: '今日はいい天気だった' // ユーザーが入力した日記テキスト
    }

  【ステップ3: データの伝達（UserStar → UI）】
  
  UserAddedStars.jsx:
    - UserStarから受け取ったonStarClick呼び出しをそのまま親へ伝達
    - 特に処理は行わず、トンネリング（props drilling）の役割
  
  Experience.jsx:
    - 同様にonStarClickをそのまま親へ伝達
  
  App.jsx:
    - starClickHandlerに保存されているshowStarDetails関数が実行される
    - この関数はUI.jsxで定義されたもの

  【ステップ4: モーダルの表示（UI.jsx）】
  
  UI.jsx - showStarDetails関数:
    ```javascript
    const showStarDetails = (starData) => {
      console.log('showStarDetails called with:', starData);
      setSelectedStarData(starData); // モーダルに表示するデータをセット
      setStarOpen(true);             // モーダルを開く
    };
    ```
    
    ステート更新:
    - selectedStarData: null → { id: ..., position: [...], ... }
    - starOpen: false → true

  【ステップ5: モーダルのレンダリング（StarDetailModal.jsx）】
  
  このコンポーネント（StarDetailModal）:
    ```javascript
    <StarDetailModal
      isOpen={starOpen}           // true
      onClose={() => {            // モーダルを閉じる関数
        setStarOpen(false);
        setSelectedStarData(null);
      }}
      starData={selectedStarData} // 星の詳細データ
    />
    ```
    
    表示処理:
    1. isOpenとstarDataをチェック（両方trueの場合のみ表示）
    2. starDataから各情報を取り出して表示:
       - date → 生成時刻セクション
       - position[0,1,2] → X/Y/Z座標セクション
       - scale → 大きさセクション（プログレスバー付き）
       - color → 色セクション（HEX変換 + カラープレビュー）
       - text → 日記テキストセクション（最大高さ制限 + スクロール可能）

  ＝＝＝ 技術的なポイント ＝＝＝

  1. **関数を状態として保存**
     App.jsxでuseState(() => null)を使い、関数を状態として保存。
     setStarClickHandler(() => handler)の形式で更新。

  2. **Props Drilling（プロップスドリリング）**
     onStarClickを複数のコンポーネント階層を経由して伝達。
     UserStar → UserAddedStars → Experience → App → UI → StarDetailModal

  3. **イベント伝播の制御**
     e.stopPropagation()で、星のクリックイベントが背景に伝わらないようにする。

  4. **条件付きレンダリング**
     if (!isOpen || !starData) return null;
     モーダルが閉じている、またはデータがない場合は何も表示しない。

  5. **データ変換**
     - colorToHex: RGB(0.0～1.0) → HEX形式(#RRGGBB)
     - formatCoordinate: 数値 → 小数点2桁の文字列

  ＝＝＝ デザイン仕様 ＝＝＝

  - **レスポンシブ**: max-w-md（最大幅448px）、モバイル・デスクトップ両対応
  - **グラスモーフィズム**: 半透明背景 + backdrop-blur-2xl
  - **グラデーション**: from-[#151530]/90 to-[#2a2a50]/90（紫→青）
  - **アイコン**: 各セクションに色分けされたアイコン（🕐📍📏🎨📝）
  - **アニメーション**: ホバーエフェクト、スムーズな開閉（300ms）
*/

/**
 * 星の詳細確認モーダル (Star Detail Modal)
 * ユーザーが作成した星の詳細情報を表示するモーダルコンポーネント
 * レスポンシブデザイン対応（モバイル・デスクトップ両対応）
 */

export const StarDetailModal = ({ isOpen, onClose, starData }) => {
    // モーダルが開いていない、またはデータがない場合は何も表示しない
    if (!isOpen || !starData) return null;

    // データベースから感情と褒め言葉を取得する
    const analysis = starData.analysis_data || {};
    const hasAnalysis = analysis.emotion && analysis.feedback; // 戻り値はtrue/false

    // 色をRGBからHEX形式に変換する関数
    const colorToHex = (color) => {
        if (!color) return '#FFFFFF';
        const r = Math.round(color.r * 255);
        const g = Math.round(color.g * 255);
        const b = Math.round(color.b * 255);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    // 座標を小数点2桁で表示する関数
    const formatCoordinate = (value) => {
        return typeof value === 'number' ? value.toFixed(2) : '0.00';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* バックドロップ（背景） - クリックで閉じる */}
            <div
                className="absolute inset-0 bg-[#050510]/70 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* モーダルコンテンツ */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-[#151530]/90 to-[#2a2a50]/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-purple-900/40 transform transition-all duration-300 scale-100 opacity-100 overflow-hidden">

                {/* ヘッダー部分 */}
                <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                    <div className="flex items-center justify-between">
                        {/* タイトル */}
                        <h2 className="text-white/95 font-sans text-xl tracking-[0.15em] font-light flex items-center gap-3">
                            <svg className="w-6 h-6 text-yellow-300/80" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            星の詳細
                        </h2>

                        {/* 閉じるボタン */}
                        <button
                            onClick={onClose}
                            className="text-white/40 hover:text-white/90 transition-colors duration-200 hover:rotate-90 transform transition-transform"
                            aria-label="閉じる"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* コンテンツ部分 */}
                <div className="px-6 py-6 space-y-5">

                    {/* 生成時刻 */}
                    <div className="group">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-200">
                                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white/50 text-xs tracking-wider mb-1 font-sans">生成時刻</p>
                                <p className="text-white/95 text-base font-mono tracking-wide">{starData.display_date}</p>
                            </div>
                        </div>
                    </div>

                    {/* 座標 */}
                    <div className="group">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors duration-200">
                                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white/50 text-xs tracking-wider mb-2 font-sans">座標</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                                        <p className="text-white/40 text-[10px] tracking-widest mb-0.5">X</p>
                                        <p className="text-white/90 text-sm font-mono">{formatCoordinate(starData.position[0])}</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                                        <p className="text-white/40 text-[10px] tracking-widest mb-0.5">Y</p>
                                        <p className="text-white/90 text-sm font-mono">{formatCoordinate(starData.position[1])}</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                                        <p className="text-white/40 text-[10px] tracking-widest mb-0.5">Z</p>
                                        <p className="text-white/90 text-sm font-mono">{formatCoordinate(starData.position[2])}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 大きさ */}
                    <div className="group">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors duration-200">
                                <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white/50 text-xs tracking-wider mb-1 font-sans">大きさ</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-white/95 text-base font-mono">{formatCoordinate(starData.scale)}</p>
                                    {/* 視覚的なサイズインジケーター */}
                                    <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min((starData.scale / 6) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 色 */}
                    <div className="group">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors duration-200">
                                <svg className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white/50 text-xs tracking-wider mb-2 font-sans">色</p>
                                <div className="flex items-center gap-3">
                                    {/* カラープレビュー */}
                                    <div
                                        className="w-16 h-16 rounded-xl border-2 border-white/30 shadow-lg transition-transform duration-200 hover:scale-110"
                                        style={{
                                            backgroundColor: colorToHex(starData.color),
                                            boxShadow: `0 0 20px ${colorToHex(starData.color)}80`
                                        }}
                                    />
                                    {/* HEXコード */}
                                    <div className="flex-1">
                                        <div className="bg-black/30 rounded-lg px-4 py-3 border border-white/10">
                                            <p className="text-white/40 text-[10px] tracking-widest mb-1">HEX</p>
                                            <p className="text-white/95 text-sm font-mono tracking-wider">{colorToHex(starData.color)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* --- AI分析結果 (あれば表示) --- */}
                    {hasAnalysis && (
                        <>
                            {/* 感情 */}
                            <div className="group">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors duration-200">
                                        <svg className="w-5 h-5 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/50 text-xs tracking-wider mb-1 font-sans">感情</p>
                                        <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                            <p className="text-orange-200 text-sm font-medium tracking-wide">
                                                {analysis.emotion}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 褒め言葉 */}
                            <div className="group">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors duration-200">
                                        <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/50 text-xs tracking-wider mb-2 font-sans">星からの手紙</p>
                                        <div className="bg-indigo-900/20 rounded-lg px-4 py-3 border border-indigo-500/20 relative">
                                            {/* 小さな装飾 */}
                                            <div className="absolute -top-1 left-6 w-2 h-2 bg-indigo-500/20 rotate-45 transform border-l border-t border-indigo-500/20"></div>
                                            <p className="text-indigo-100/90 text-sm leading-relaxed italic">
                                                "{analysis.feedback}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ムード値（気持ちの記録） */}
                    {starData.mood_values && (
                        <div className="group">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center justify-center group-hover:bg-green-500/30 transition-colors duration-200">
                                    <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/50 text-xs tracking-wider mb-3 font-sans">気持ちの記録</p>
                                    <div className="space-y-3">
                                        {/* 情緒的安定性 */}
                                        {starData.mood_values.emotional !== undefined && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/40">情緒的安定性</span>
                                                    <span className="text-white/60 font-mono">{starData.mood_values.emotional}%</span>
                                                </div>
                                                <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${starData.mood_values.emotional}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-white/30">
                                                    <span>つらい・どんより</span>
                                                    <span>心地いい・穏やか</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* 動因の充足 */}
                                        {starData.mood_values.motivation !== undefined && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/40">動因の充足</span>
                                                    <span className="text-white/60 font-mono">{starData.mood_values.motivation}%</span>
                                                </div>
                                                <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-gray-400 to-orange-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${starData.mood_values.motivation}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-white/30">
                                                    <span>無気力・不完全燃焼</span>
                                                    <span>やりきった・満足</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* 社会的適応 */}
                                        {starData.mood_values.social !== undefined && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/40">社会的適応</span>
                                                    <span className="text-white/60 font-mono">{starData.mood_values.social}%</span>
                                                </div>
                                                <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${starData.mood_values.social}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-white/30">
                                                    <span>孤独・物足りない</span>
                                                    <span>充足感・満タン</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* 生体的メカニズム */}
                                        {starData.mood_values.physical !== undefined && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/40">生体的メカニズム</span>
                                                    <span className="text-white/60 font-mono">{starData.mood_values.physical}%</span>
                                                </div>
                                                <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-400 to-cyan-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${starData.mood_values.physical}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-white/30">
                                                    <span>ずっしり重たい</span>
                                                    <span>すっきり軽やか</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* 刺激の受容 */}
                                        {starData.mood_values.fulfillment !== undefined && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/40">刺激の受容</span>
                                                    <span className="text-white/60 font-mono">{starData.mood_values.fulfillment}%</span>
                                                </div>
                                                <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-slate-400 to-yellow-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${starData.mood_values.fulfillment}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-white/30">
                                                    <span>退屈・マンネリ</span>
                                                    <span>新鮮・充実していた</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* 旧形式との後方互換性 */}
                                        {starData.mood_values.comfort !== undefined && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/40">心地よさ</span>
                                                    <span className="text-white/60 font-mono">{starData.mood_values.comfort}%</span>
                                                </div>
                                                <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${starData.mood_values.comfort}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 旧日記テキスト（後方互換性のため） */}
                    {starData.text && !starData.mood_values && (
                        <div className="group">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center justify-center group-hover:bg-green-500/30 transition-colors duration-200">
                                    <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/50 text-xs tracking-wider mb-2 font-sans">日記</p>
                                    <div className="bg-black/30 rounded-lg px-4 py-3 border border-white/10 max-h-32 overflow-y-auto">
                                        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap break-words">
                                            {starData.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* フッター */}
                <div className="px-6 py-4 border-t border-white/10 bg-black/20">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-400 hover:to-purple-400 text-white rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-[1.02] tracking-widest text-sm font-medium border border-white/20"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
