import { create } from 'zustand';
import { starDataMaker } from '../utils/starDataMaker';
import { supabase } from '../supabaseClient';
import { Color } from 'three';

export const useStarStore = create((set, get) => ({
    // ユーザーの星データ配列
    stars: [],

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

        // チュートリアルの星を除外し、rgbをColorインスタンスに還元し、mood_valuesをanalysis_dataから復元
        const starsWithColor = data
            .filter(star => !star.analysis_data?.isTutorial)
            .map(star => ({
                ...star,
                color: new Color(star.color.r, star.color.g, star.color.b),
                mood_values: star.analysis_data?.moodValues ?? star.mood_values ?? null,
            }));

        // イルカ座・兎座の古い座標を正しい位置に自動補正する（ハッシュ衝突による位置ずれを修正）
        const { CONSTELLATIONS } = await import('../data/constellationData.js');
        const delphinusData = CONSTELLATIONS.find(c => c.id === 'delphinus');
        const lepusData = CONSTELLATIONS.find(c => c.id === 'lepus');
        const boxWidth = 60;
        const boxHeight = 60;

        const starsWithFixedPositions = starsWithColor.map(star => {
            const cid = star.analysis_data?.constellation?.id;
            const nodeIndex = star.analysis_data?.constellation?.nodeIndex;

            // イルカ座: 古い座標（x < 0）を新しい位置に補正
            if (cid === 'delphinus' && star.position[0] < 0) {
                const nodeNormalized = delphinusData?.starPositions?.[nodeIndex];
                if (nodeNormalized) {
                    const centerX = 180, centerY = 50, baseZ = 0;
                    const localX = (nodeNormalized.x - 0.5) * boxWidth;
                    const localY = (0.5 - nodeNormalized.y) * boxHeight;
                    return { ...star, position: [centerX + localX, centerY + localY, baseZ] };
                }
            }

            // 兎座: 古い座標（x < 0）を新しい位置に補正
            if (cid === 'lepus' && star.position[0] < 0) {
                const nodeNormalized = lepusData?.starPositions?.[nodeIndex];
                if (nodeNormalized) {
                    const centerX = 220, centerY = -100, baseZ = 0;
                    const localX = (nodeNormalized.x - 0.5) * boxWidth;
                    const localY = (0.5 - nodeNormalized.y) * boxHeight;
                    return { ...star, position: [centerX + localX, centerY + localY, baseZ] };
                }
            }

            return star;
        });

        const delphinusStars = starsWithFixedPositions.filter(s => s.analysis_data?.constellation?.id === 'delphinus');
        console.log("FE fetched stars:", starsWithFixedPositions.length, delphinusStars.length, "are delphinus");
        if (delphinusStars.length > 0) {
            delphinusStars.forEach(s => {
                const p = s.position;
                console.log(`[DEBUG] Delphinus star ${s.id.slice(0, 8)} node${s.analysis_data?.constellation?.nodeIndex}: x=${p[0]?.toFixed(2)}, y=${p[1]?.toFixed(2)}, z=${p[2]?.toFixed(2)}`);
            });
        }

        set({ stars: starsWithFixedPositions });
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
            isJustCreated: true, // 新しく追加された星であることを示すフラグ
        };
        // 成功したら、画面を更新し、カメラのフォーカス対象を設定する
        set((state) => ({
            stars: [...state.stars, starForShow],
            focusTarget: newStar.position
        }));

        return newStar.id; // チュートリアル用に星IDを返す
    },

    // フォーカスをリセットする関数 (必要に応じて)
    resetFocus: () => set({ focusTarget: null }),

    // フォーカスを設定する関数（毎回新しい配列参照を生成してuseEffectを確実に発火させる）
    setFocusTarget: (target) => set({ focusTarget: [...target] }),

    // 指定IDの星をSupabase＋ローカルから一括削除する（チュートリアル用）
    removeStarsByIds: async (ids) => {
        if (!ids || ids.length === 0) return;
        try {
            const { error } = await supabase.from('t_stars').delete().in('id', ids);
            if (error) {
                console.error('チュートリアル星の削除エラー:', error);
            }
        } catch (err) {
            console.error('チュートリアル星の削除に失敗:', err);
        }
        // ローカルからも削除（DB削除が失敗しても画面上は消す）
        set((state) => ({
            stars: state.stars.filter((s) => !ids.includes(s.id)),
        }));
    },

    // --- Supabase Realtime: 他デバイスからの星追加をリアルタイム同期 ---
    subscribeToStars: () => {
        const channel = supabase
            .channel('stars-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 't_stars' },
                (payload) => {
                    const newRow = payload.new;

                    // チュートリアルの星はスキップ
                    if (newRow.analysis_data?.isTutorial) return;

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

        let centerX = minX + prngX * (maxX - minX);
        let centerY = minY + prngY * (maxY - minY);
        let baseZ = -10 + prngZ * 15;

        // イルカ座（delphinus）がウミヘビ座（hydra）と座標被り（ハッシュ衝突）するため、固定の別座標に手動設定
        if (target.id === "delphinus") {
            centerX = 180;
            centerY = 50;
            baseZ = 0;
        }

        // 兎座（lepus）も他の星座と近い位置にあるため、右下の空きエリアに移動
        if (target.id === "lepus") {
            centerX = 220;
            centerY = -100;
            baseZ = 0;
        }

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
                isJustCreated: true,
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