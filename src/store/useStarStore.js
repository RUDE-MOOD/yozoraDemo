import { create } from 'zustand';
import { starDataMaker } from '../utils/starDataMaker';
import { supabase } from '../supabaseClient';
import { Color } from 'three';

export const useStarStore = create((set) => ({
    stars: [],

    // supabaseから星のデータを読み込む
    fetchStars: async () => {
        const { data, error } = await supabase.from('t_stars').select('*');

        if (error) {
            console.error('データベース読み込みエラー:', error);
            return;  // または throw error
        }

        // データがない場合は空配列
        if (!data) {
            set({ stars: [] });
            return;
        }

        // rgbをColorインスタンスに還元する
        const starsWithColor = data.map(star => ({
            ...star,
            color: new Color(star.color.r, star.color.g, star.color.b)
        }));

        set({ stars: starsWithColor });
    },

    // UIから星を追加する
    addStar: async (text) => {
        const newStar = starDataMaker({ text });
        // THREE.Colorインスタンスを{r,g,b}の普通オブジェクトに変換してから保存、同様にfetchStarsでもrgbをColorインスタンスに変換しないといけない
        const upstar = {
            ...newStar,
            color: { r: newStar.color.r, g: newStar.color.g, b: newStar.color.b }
        }

        // データベースに保存
        const { error } = await supabase.from('t_stars').insert(upstar);
        if (error) throw error

        // 成功したら、画面を更新する
        set((state) => ({ stars: [...state.stars, newStar] }));
    },



}));