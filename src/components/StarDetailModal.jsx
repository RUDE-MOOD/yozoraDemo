/**
 * 星の詳細確認モーダル (Star Detail Modal)
 * ユーザーが作成した星の詳細情報を表示するモーダルコンポーネント
 * レスポンシブデザイン対応（モバイル・デスクトップ両対応）
 */

export const StarDetailModal = ({ isOpen, onClose, starData }) => {
    // モーダルが開いていない、またはデータがない場合は何も表示しない
    if (!isOpen || !starData) return null;

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
                                <p className="text-white/95 text-base font-mono tracking-wide">{starData.date}</p>
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
