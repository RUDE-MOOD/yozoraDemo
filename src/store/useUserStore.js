import { create } from 'zustand';

// ユーザー情報だけシンプルに持つストア
export const useUserStore = create((set) => ({
    user: null, // { id, email }
    session: null,
    showStarDate: true, // 星の下の日付を表示するかどうか

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    toggleShowStarDate: () => set((state) => ({ showStarDate: !state.showStarDate })),

    // ログアウト用
    clearUser: () => set({ user: null, session: null }),
}));
