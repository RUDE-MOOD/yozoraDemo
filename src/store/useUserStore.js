import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ユーザー情報 + 設定を持つストア
// 設定値（showStarDate, showWelcomeText）は localStorage に永続化される
export const useUserStore = create(
    persist(
        (set) => ({
            user: null, // { id, email }
            session: null,
            showStarDate: true, // 星の下の日付を表示するかどうか
            showWelcomeText: true, // ログイン時の「Nostargia」ウェルカムテキストを表示するかどうか
            showRocketSkipButton: false, // 開発者用クイックスキップボタンを表示するかどうか

            setUser: (user) => set({ user }),
            setSession: (session) => set({ session }),
            toggleShowStarDate: () => set((state) => ({ showStarDate: !state.showStarDate })),
            toggleShowWelcomeText: () => set((state) => ({ showWelcomeText: !state.showWelcomeText })),
            setShowRocketSkipButton: (val) => set({ showRocketSkipButton: val }),

            // ログアウト用
            clearUser: () => set({ user: null, session: null }),
        }),
        {
            name: 'yozora-user-settings',
            storage: createJSONStorage(() => localStorage),
            // user と session は永続化しない（セッション管理は Supabase に任せる）
            partialize: (state) => ({
                showStarDate: state.showStarDate,
                showWelcomeText: state.showWelcomeText,
                showRocketSkipButton: state.showRocketSkipButton,
            }),
        }
    )
);
