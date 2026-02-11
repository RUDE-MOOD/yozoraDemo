import { useState } from 'react';
import { useFutureMessageStore } from '../store/useFutureMessageStore';

export const FutureMessageInputModal = () => {
    const { isInputModalOpen, setInputModalOpen, saveFutureMessage, loading } = useFutureMessageStore();
    const [message, setMessage] = useState('');

    if (!isInputModalOpen) return null;

    const handleSubmit = async () => {
        if (!message.trim()) return;
        await saveFutureMessage(message);
        setMessage('');
        setInputModalOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#050510]/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setInputModalOpen(false)}
            ></div>

            {/* Modal Content */}
            <div
                className="relative w-full max-w-lg mx-6 bg-gradient-to-b from-[#151530]/95 to-[#2a2a50]/95 backdrop-blur-2xl border border-blue-400/30 rounded-3xl shadow-[0_0_50px_rgba(100,200,255,0.2)] p-8 transform transition-all duration-300 scale-100 opacity-100"
            >
                <h2 className="text-center text-white/95 font-sans text-xl tracking-[0.2em] font-light mb-8 drop-shadow-[0_0_10px_rgba(100,200,255,0.5)]">
                    未来の自分への手紙
                </h2>

                <div className="space-y-6">
                    <p className="text-blue-100/80 text-sm text-center leading-relaxed">
                        今の気持ちや、未来の自分に伝えたいことを書いてください。<br />
                        この星は、あなたが落ち込んでいる時に再び現れます。
                    </p>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="未来の自分へ..."
                        className="w-full h-40 px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white/90 placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50 transition-colors resize-none"
                    />

                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            onClick={() => setInputModalOpen(false)}
                            className="px-6 py-3 text-white/60 hover:text-white text-sm tracking-widest transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !message.trim()}
                            className="px-8 py-3 bg-blue-500/20 border border-blue-400/50 text-blue-100 rounded-full hover:bg-blue-500/40 hover:border-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,100,255,0.3)]"
                        >
                            {loading ? '送信中...' : '星に託す'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
