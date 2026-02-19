import { useThemeStore } from "../../../store/useThemeStore";

export const ThemeSelectionModal = ({ isOpen, onClose }) => {
  const { currentThemeName, setTheme, skyboxType, setSkyboxType } =
    useThemeStore();

  if (!isOpen) return null;

  const themes = [
    { id: "purple", name: "Purple", img: "/thumbnails/theme-purple.png" },
    { id: "blue", name: "Blue", img: "/thumbnails/theme-blue.png" },
    { id: "green", name: "Green", img: "/thumbnails/theme-green.png" },
    { id: "space", name: "Space", img: "/thumbnails/theme-space.png" },
    { id: "orange", name: "Orange", img: "/thumbnails/theme-orange.png" },
  ];

  const skyboxes = [
    { id: "classic", name: "クラシック" },
    { id: "mixed", name: "ミックス" },
    { id: "upgrade", name: "ネビュラ" },
  ];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#050510]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg mx-4 bg-[#1a1a3a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 opacity-100 flex flex-col">
        {/* Header */}
        <div className="relative flex items-center justify-center py-4 border-b border-white/10">
          <h2
            className="text-white/90 font-sans text-lg tracking-widest font-heavy"
            style={{ margin: "5px" }}
          >
            テーマ変更
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 text-white/40 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body - Theme Thumbnails */}
        <div className="px-8 pt-6 pb-2">
          <p
            className="text-white/50 text-xs tracking-widest text-center mb-4"
            style={{ margin: "10px" }}
          >
            背景色
          </p>
          <div
            className={`grid grid-cols-3 gap-x-2 gap-y-4 transition-opacity duration-300 place-items-center ${skyboxType === "upgrade" ? "opacity-40 pointer-events-none" : ""}`}
          >
            {themes.map((theme) => (
              <div
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className="flex flex-col items-center gap-3 cursor-pointer group"
              >
                {/* Thumbnail Container */}
                <div
                  className={`relative w-28 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${currentThemeName === theme.id ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "border-white/20 group-hover:border-white/60"}`}
                >
                  <img
                    src={theme.img}
                    alt={theme.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Radio Button */}
                <div className="relative w-5 h-5 rounded-full border border-white/40 flex items-center justify-center">
                  {currentThemeName === theme.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skybox Selection */}
        <div className="px-8 pt-4 pb-6">
          <p
            className="text-white/50 text-xs tracking-widest text-center mb-4"
            style={{ margin: "30px 0 10px 0" }}
          >
            背景タイプ
          </p>
          <div
            className="flex justify-center gap-x-10"
            style={{ marginBottom: "20px" }}
          >
            {skyboxes.map((skybox) => (
              <div
                key={skybox.id}
                onClick={() => setSkyboxType(skybox.id)}
                className="flex flex-col items-center gap-3 cursor-pointer group"
              >
                {/* CSS-based preview card */}
                <div
                  className={`relative w-28 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${skyboxType === skybox.id ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "border-white/20 group-hover:border-white/60"}`}
                >
                  <div
                    className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                    style={
                      skybox.id === "classic"
                        ? {
                            background:
                              "linear-gradient(180deg, #000000 0%, #1a0b2e 40%, #4b0082 70%, #8900f2 100%)",
                          }
                        : skybox.id === "mixed"
                          ? {
                              background:
                                "linear-gradient(180deg, #000000 0%, #1a0b2e 30%, #4b0082 50%, #7b68ee 80%, #8900f2 100%)",
                            }
                          : {
                              background:
                                "radial-gradient(ellipse at 30% 50%, #7b68ee 0%, #4b0082 30%, #1a0a2e 60%, #0a0a1a 100%)",
                            }
                    }
                  />
                </div>

                {/* Label */}
                <span className="text-white/60 text-xs tracking-wider">
                  {skybox.name}
                </span>

                {/* Radio Button */}
                <div className="relative w-5 h-5 rounded-full border border-white/40 flex items-center justify-center">
                  {skyboxType === skybox.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="p-4 border-t border-white/10 bg-black/20">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-xl transition-all duration-200 tracking-widest text-sm"
          >
            閉じる
          </button>
        </div> */}
      </div>
    </div>
  );
};
