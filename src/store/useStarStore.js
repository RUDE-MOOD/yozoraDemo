import { create } from 'zustand';
import { starDataMaker } from '../utils/starDataMaker';
import { supabase } from '../supabaseClient';
import { Color } from 'three';

export const useStarStore = create((set, get) => ({
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
        const currentStars = get().stars;
        const newStar = starDataMaker({ moodValues, existingStars: currentStars });

        // analysis_data: moodValues + Gemini結果 + goodThings + constellation
        const analysisData = {
            moodValues,
            ...(analysisResult || {}),
            ...(goodThings && (goodThings.goodThing1 || goodThings.goodThing2 || goodThings.goodThing3)
                ? { goodThings }
                : {}),
            ...(newStar.constellation ? { constellation: newStar.constellation } : {})
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

    // --- Supabase Realtime: 他デバイスからの星追加をリアルタイム同期 ---
    subscribeToStars: () => {
        const channel = supabase
            .channel('stars-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 't_stars' },
                (payload) => {
                    const newRow = payload.new;
                    // 既にローカルに存在する場合はスキップ（自分が追加した星の重複防止）
                    const currentStars = useStarStore.getState().stars;
                    if (currentStars.some((s) => s.id === newRow.id)) return;

                    const starForShow = {
                        ...newRow,
                        color: new Color(newRow.color.r, newRow.color.g, newRow.color.b),
                        mood_values: newRow.analysis_data?.moodValues ?? null,
                    };

                    set((state) => ({
                        stars: [...state.stars, starForShow],
                    }));
                }
            )
            .subscribe();

        // クリーンアップ用にunsubscribe関数を返す
        return () => {
            supabase.removeChannel(channel);
        };
    },

    // デバッグ用: 1分間だけ星座を表示する
    debug_showConstellation: async (constellationId) => {
        const { CONSTELLATIONS } = await import('../data/constellationData.js');
        const target = CONSTELLATIONS.find(c => c.id === constellationId);
        if (!target) return;

        const hashCode = (s) => s.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const boxWidth = 60;
        const boxHeight = 60;
        const minX = -320 + boxWidth / 2 + 10;
        const maxX = 320 - boxWidth / 2 - 10;
        const minY = -160 + boxHeight / 2 + 10;
        const maxY = 160 - boxHeight / 2 - 10;

        const hash = Math.abs(hashCode(target.id));
        const prngX = (hash % 100) / 100;
        const prngY = ((hash * 13) % 100) / 100;
        const prngZ = ((hash * 17) % 100) / 100;

        const centerX = minX + prngX * (maxX - minX);
        const centerY = minY + prngY * (maxY - minY);
        const baseZ = -10 + prngZ * 15;

        const mockStars = [];
        for (let i = 0; i < target.starCount; i++) {
            const nodeNormalized = target.starPositions[i];
            const localX = (nodeNormalized.x - 0.5) * boxWidth;
            const localY = (0.5 - nodeNormalized.y) * boxHeight;
            const position = [
                centerX + localX,
                centerY + localY,
                baseZ
            ];

            mockStars.push({
                id: `debug-${target.id}-${i}-${Date.now()}`,
                position: position,
                color: new Color(1, 1, 1),
                scale: 1,
                random: Math.random(),
                created_at: new Date().toISOString(),
                display_date: new Date().toISOString(),
                analysis_data: {
                    constellation: {
                        id: target.id,
                        nodeIndex: i
                    }
                }
            });
        }

        set((state) => ({
            stars: [...state.stars, ...mockStars],
            focusTarget: [centerX, centerY, baseZ]
        }));

        setTimeout(() => {
            set((state) => ({
                stars: state.stars.filter(s => !s.id.startsWith(`debug-${target.id}`))
            }));
        }, 60000);
    },

    // ログアウト時に星をクリアする関数
    clearStars: () => set({ stars: [], focusTarget: null }),
}));