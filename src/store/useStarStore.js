import { create } from 'zustand';
import { starDataMaker } from '../utils/starDataMaker';
import { supabase } from '../supabaseClient';
import { Color } from 'three';

export const useStarStore = create((set) => ({
    // カメラがフォーカスすべきターゲット位置 (null または [x, y, z])
    focusTarget: null,

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
    // moodValues = { emotional, motivation, social, physical, fulfillment } (各0-100)
    // analysisResult = null は、エラー回避するための初期値
    // goodThings = { goodThing1, goodThing2, goodThing3 } (PC入力時のみ)
    addStar: async (moodValues, analysisResult = null, goodThings = null) => {
        const newStar = starDataMaker({ moodValues, goodThings });
        // THREE.Colorインスタンスを{r,g,b}の普通オブジェクトに変換してから保存
        const upstar = {
            ...newStar,
            color: { r: newStar.color.r, g: newStar.color.g, b: newStar.color.b },
            analysis_data: analysisResult
        }

        // データベースに保存
        const { error } = await supabase.from('t_stars').insert(upstar);
        if (error) throw error

        const starForShow = {
            ...newStar,
            analysis_data: analysisResult
        };
        // 成功したら、画面を更新し、カメラのフォーカス対象を設定する
        set((state) => ({
            stars: [...state.stars, starForShow],
            focusTarget: newStar.position
        }));
    },

    // フォーカスをリセットする関数 (必要に応じて)
    resetFocus: () => set({ focusTarget: null }),

}));