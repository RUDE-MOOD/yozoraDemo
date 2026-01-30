import { create } from 'zustand';
import { starDataMaker } from '../utils/starDataMaker';
export const useStarStore = create((set) => ({
    stars: [],

    // supabaseから星のデータを読み込む
    loadStars: (starsData) => {
        set({ stars: starsData });
    },

    // UIから星を追加する
    addStar: (text) => {
        const newStar = starDataMaker({ text });
        set((state) => ({ stars: [...state.stars, newStar] }));
    },



}));