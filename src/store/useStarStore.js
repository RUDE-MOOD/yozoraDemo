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

        // rgbをColorインスタンスに還元し、mood_valuesをanalysis_dataから復元
        const starsWithColor = data.map(star => ({
            ...star,
            color: new Color(star.color.r, star.color.g, star.color.b),
            mood_values: star.analysis_data?.moodValues ?? star.mood_values ?? null,
        }));

        set({ stars: starsWithColor });
    },

    // UIから星を追加する
    // moodValues = { emotional, motivation, social, physical, fulfillment } (各0-100)
    // analysisResult = null は、エラー回避するための初期値
    // goodThings = { goodThing1, goodThing2, goodThing3 } （3つのいいこと）
    addStar: async (moodValues, analysisResult = null, goodThings = null) => {
        const newStar = starDataMaker({ moodValues });

        // analysis_data: moodValues + Gemini結果 + goodThings（t_starsにmood_valuesカラムがないためここに格納）
        const analysisData = {
            moodValues,
            ...(analysisResult || {}),
            ...(goodThings && (goodThings.goodThing1 || goodThings.goodThing2 || goodThings.goodThing3)
                ? { goodThings }
                : {}),
        };

        // t_starsの実際のカラムのみ挿入（id, position, color, scale, random, created_at, display_date, analysis_data）
        const upstar = {
            id: newStar.id,
            position: newStar.position,
            color: { r: newStar.color.r, g: newStar.color.g, b: newStar.color.b },
            scale: newStar.scale,
            random: newStar.random,
            created_at: newStar.created_at,
            display_date: newStar.display_date,
            analysis_data: analysisData,
        };

        // データベースに保存
        const { error } = await supabase.from('t_stars').insert(upstar);
        if (error) throw error

        const starForShow = {
            ...newStar,
            analysis_data: analysisData,
        };
        // 成功したら、画面を更新し、カメラのフォーカス対象を設定する
        set((state) => ({
            stars: [...state.stars, starForShow],
            focusTarget: newStar.position
        }));
    },

    // フォーカスをリセットする関数 (必要に応じて)
    resetFocus: () => set({ focusTarget: null }),

    // フォーカスを設定する関数（毎回新しい配列参照を生成してuseEffectを確実に発火させる）
    setFocusTarget: (target) => set({ focusTarget: [...target] }),

}));