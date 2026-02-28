import { useFutureMessageStore } from "../../../store/useFutureMessageStore";
import { useTutorialStore } from "../../../store/useTutorialStore";

export const FutureMessageDisplayModal = () => {
  const {
    isDisplayModalOpen,
    setDisplayModalOpen,
    currentMessage,
    startShootingStarExit,
    markMessageAsRead,
  } = useFutureMessageStore();
  const tutorial = useTutorialStore();

  if (!isDisplayModalOpen || !currentMessage) return null;

  const handleClose = async () => {
    // 1. Mark as read
    if (currentMessage.id) {
      await markMessageAsRead(currentMessage.id);
    }

    // 2. Close Modal
    setDisplayModalOpen(false);

    // 3. Trigger Shooting Star Exit Animation
    startShootingStarExit();

    // 4. チュートリアル: 未来メッセージを受け取った
    if (tutorial.isActive) {
      tutorial.triggerEvent('FUTURE_MESSAGE_READ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#050510]/80 backdrop-blur-sm transition-opacity duration-300"
      // onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div
        className="relative w-full max-w-lg mx-6 bg-gradient-to-b from-[#2a1530]/95 to-[#1a1a3a]/95 backdrop-blur-2xl border border-pink-400/30 rounded-3xl shadow-[0_0_50px_rgba(255,100,200,0.3)] p-8 transform transition-all duration-300 scale-100 opacity-100 animate-fade-in-up"
        style={{
          margin: "50px",
          padding: "20px",
          fontFamily: "Kiwi Maru",
          letterSpacing: "0rem",
        }}
      >
        <h2
          className="text-center text-white/95 font-sans text-xl tracking-[0.2em] font-light mb-8 drop-shadow-[0_0_10px_rgba(255,200,200,0.5)]"
          style={{
            fontSize: "16px",
            margin: "10px",
            fontFamily: "Kiwi Maru",
            letterSpacing: "0rem",
          }}
        >
          何億光年を渡ってあなたの光が届きました
        </h2>

        <div className="mb-6 flex justify-center">
          <span className="text-pink-200/50 text-xs tracking-widest pb-1">
            {currentMessage.display_date || "Unknown Date"}
          </span>
        </div>

        <div className="space-y-6">
          <p
            className="text-white/90 text-lg text-center leading-loose font-serif italic"
            style={{ fontSize: "18px", margin: "10px" }}
          >
            "{currentMessage.message}"
          </p>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleClose}
              className="px-10 py-3 bg-pink-500/20 border border-pink-400/50 text-pink-100 rounded-full hover:bg-pink-500/40 hover:border-pink-300 transition-all duration-300 shadow-[0_0_15px_rgba(255,100,200,0.3)] tracking-widest"
              style={{ padding: "5px 30px", margin: "10px" }}
            >
              受け取る
            </button>
          </div>
          <div className="flex justify-center mt-8">
            <p
              className="text-white/90 text-lg text-center leading-loose font-serif italic"
              style={{
                fontSize: "12px",
                margin: "10px",
                opacity: "50%",
                fontFamily: "Kiwi Maru",
                letterSpacing: "0rem",
              }}
            >
              この画面を閉じると二度とこのメッセージを見ることができません
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
