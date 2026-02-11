import { create } from 'zustand';
import { supabase } from '../supabaseClient';

// 「未来の自分への星」は、1つしかない

// ２日に１回、未来の自分へのメッセージを書くことができる星を生成するロジック：
// 1. t_future_messagesテーブルから最新のメッセージのcreated_atを取得
// 2. 現在の日時との差分を計算
// 3. 差分が2日以上であれば星を表示し、それ以外は非表示にする
// 4. メッセージが一件も存在しない場合も星を表示する

// 果たして２日に１回か、テスト方法：
//             if (diffInDays >= 2) {
//                 set({ isFutureStarVisible: true });
//             } else {
//                 set({ isFutureStarVisible: false });
//             }
// diffInDays >= 2をdiffInDays >= 0.001にすれば1分おきに星が表示される


export const useFutureMessageStore = create((set, get) => ({
    futureMessages: [],
    isFutureStarVisible: false,
    isShootingStarVisible: false,
    loading: false,

    // ステップ1: “未来の自分への星”を表示すべきか確認（頻度：2日に1回）
    checkFutureStarAvailability: async () => {
        try {
            // ユーザーが作成した最新のメッセージを取得
            const { data, error } = await supabase
                .from('t_future_messages')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (!data || data.length === 0) {
                // メッセージがまだないため、星を表示可能にする
                set({ isFutureStarVisible: true });
                return;
            }

            const lastCreated = new Date(data[0].created_at);
            const now = new Date();
            const diffInMs = now - lastCreated;
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

            console.log(`[FutureStar] 最後の手紙: ${lastCreated.toLocaleString()}, 経過: ${diffInDays.toFixed(4)} 日 (しきい値: 0.001)`);

            // ！！！2日以上経過している場合、星を表示 ※DEV: 0.001 = 約1.4分、本番は2に戻す
            if (diffInDays >= 0.001) {
                set({ isFutureStarVisible: true });
            } else {
                set({ isFutureStarVisible: false });
            }

        } catch (error) {
            console.error('Error checking future star availability:', error);
        }
    },

    // ステップ2: メッセージを保存して星を非表示にする
    saveFutureMessage: async (message) => {
        set({ loading: true });
        try {
            const now = new Date();
            // 表示用フォーマット (YY/MM/DD HH:mm) - t_starsと同様
            const display_date = `${now.getFullYear().toString().slice(-2)}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const { error } = await supabase
                .from('t_future_messages')
                .insert([{
                    message,
                    display_date
                }]);

            if (error) throw error;

            // 保存後、直ちに星を非表示にする
            set({ isFutureStarVisible: false, loading: false });

            // 必要であれば再チェックロジックを入れるが、現在はここで非表示確定
        } catch (error) {
            console.error('Error saving future message:', error);
            set({ loading: false });
        }
    },

    // ステップ3: 気分をチェックし、条件を満たせば流れ星をトリガーする
    triggerShootingStarCheck: async (moodValues) => {
        // 条件1: 全ての気分スライダーが"ネガティブ"（例: 50未満）であること
        // 必要に応じて閾値を調整
        const isDepressed = Object.values(moodValues).every(val => val < 50);

        if (!isDepressed) {
            set({ isShootingStarVisible: false });
            return;
        }

        // 条件2: 未読の未来へのメッセージが存在する
        await get().fetchUnreadMessages();
        const unreadMsg = get().futureMessages;

        if (unreadMsg.length > 0) {
            set({ isShootingStarVisible: true });
        }
    },

    // 未読メッセージを取得
    fetchUnreadMessages: async () => {
        try {
            const { data, error } = await supabase
                .from('t_future_messages')
                .select('*')
                .eq('is_read', false)
                .order('created_at', { ascending: true }); // 古い順に取得

            if (error) throw error;

            set({ futureMessages: data || [] });
        } catch (error) {
            console.error('Error fetching unread messages:', error);
        }
    },

    // メッセージを既読にする（閲覧後）
    markMessageAsRead: async (id) => {
        try {
            const { error } = await supabase
                .from('t_future_messages')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            // ローカルステートから削除
            set((state) => ({
                futureMessages: state.futureMessages.filter(msg => msg.id !== id),
                // メッセージがなくなったら流れ星を隠す制御が必要ならここに追加
                // isShootingStarVisible: state.futureMessages.length > 1 
            }));

        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    },

    // リセット/非表示関数
    hideShootingStar: () => set({ isShootingStarVisible: false }),

    // 入力モーダルのUI状態
    isInputModalOpen: false,
    setInputModalOpen: (isOpen) => set({ isInputModalOpen: isOpen }),

    // 表示モーダルと取得フローのUI状態
    isDisplayModalOpen: false,
    currentMessage: null,
    isShootingStarLeaving: false,

    setDisplayModalOpen: (isOpen) => set({ isDisplayModalOpen: isOpen }),

    // 表示するメッセージを設定してモーダルを開く
    openMessageDisplay: (message) => set({
        currentMessage: message,
        isDisplayModalOpen: true
    }),

    // 退場アニメーションを開始
    startShootingStarExit: () => set({ isShootingStarLeaving: true }),

    // 流れ星のロジックを完全にリセット
    resetShootingStar: () => set({
        isShootingStarVisible: false,
        isShootingStarLeaving: false,
        currentMessage: null
    }),

    // --- デバッグ用アクション ---
    debug_setFutureStarVisible: (visible) => set({ isFutureStarVisible: visible }),
    debug_setShootingStarVisible: (visible) => set({ isShootingStarVisible: visible }),

    // テスト用のダミーメッセージ取得をモック
    debug_loadMockMessage: () => set({
        currentMessage: {
            id: 'mock-id',
            message: "未来の君へ。\n\n辛いこともあるかもしれないけど、\n君なら絶対に乗り越えられる。\n\n明けない夜はないよ。",
            display_date: "2025/12/31 23:59",
            is_read: false
        },
        futureMessages: [{
            id: 'mock-id',
            message: "未来の君へ。\n\n辛いこともあるかもしれないけど、\n君なら絶対に乗り越えられる。\n\n明けない夜はないよ。",
            display_date: "2025/12/31 23:59",
            is_read: false
        }]
    })
}));
