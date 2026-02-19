import { create } from 'zustand';

// ユーザー情報だけシンプルに持つストア
export const useUserStore = create((set) => ({
    user: null, // { id, email }
    session: null,

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),

    // ログアウト用
    clearUser: () => set({ user: null, session: null }),
}));
