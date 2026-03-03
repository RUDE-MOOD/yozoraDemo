import { create } from 'zustand';
import { getDebugDayOffset, setDebugDayOffset } from '../utils/appTime';

/**
 * チュートリアルモード用のステップ定義
 * 
 * highlightTarget: ハイライトする要素のCSSセレクター or ID
 * completionEvent: 次のステップへ進むために必要なイベント名（UI.jsxで検知）
 */
const TUTORIAL_STEPS = [
    {
        id: 1,
        title: '日記をひらく',
        message: 'まずはあなたの想いを星にして空へ放ちましょう。\n右下のロケットボタンを押してください。',
        highlightTarget: '#rocket-button',
        completionEvent: 'DIARY_OPENED',
    },
    {
        id: 2,
        title: '今の気持ちを記録する',
        message: '5つの質問に答えましょう。\nスライダーを動かして、今の気持ちを表現してください。',
        highlightTarget: '#diary-sliders-only',
        completionEvent: 'ALL_SLIDERS_MOVED',
    },
    {
        id: 3,
        title: '気持ちを分類する',
        message: 'タグを選んで、今日の気持ちを分類しましょう。',
        highlightTarget: '#diary-tags',
        completionEvent: 'TAG_SELECTED',
    },
    {
        id: 4,
        title: '今日の「いいこと」',
        message: '今日あった「いいこと」を3つ書いてみましょう。\n小さなことでも大丈夫です。',
        highlightTarget: '#diary-good-things',
        completionEvent: 'ALL_GOOD_THINGS_FILLED',
    },
    {
        id: 5,
        title: '星を打ち上げる',
        message: '準備ができました！\n「打ち上げ」ボタンを押して、星を空に放ちましょう。',
        highlightTarget: '#diary-launch-btn',
        completionEvent: 'STAR_LAUNCHED',
    },
    {
        id: 6,
        title: '打ち上げた星をタップする',
        message: 'あなたの星が生まれました！\n星をタップして、詳細を確認してみましょう。',
        highlightTarget: null, // 3D空間の星なのでDOM要素ではない
        completionEvent: 'STAR_DETAIL_OPENED',
        noOverlay: true, // 星が見えるように
    },
    {
        id: 7,
        title: '星の詳細を見る',
        message: '星の詳細を確認してみましょう。\n読み終わったら、右上の「×」ボタンを押して\n詳細を閉じてみましょう。',
        highlightTarget: null, // モーダルの上に配置したい
        completionEvent: 'STAR_DETAIL_VIEWED',
        noOverlay: true,
    },
    {
        id: 8,
        title: 'メニューを開く',
        message: '今までに見つけた星や飛ばした星は\n「ログ」から振り返ることができます。\nまずは、メニューを開いてみましょう。',
        highlightTarget: '#user-menu-btn',
        completionEvent: 'MENU_OPENED',
    },
    {
        id: 9,
        title: 'ログを開く',
        message: 'メニューから「ログ」を選んで、\n今までの記録を見てみましょう。',
        highlightTarget: '#menu-log',
        completionEvent: 'LOG_OPENED',
    },
    {
        id: 10,
        title: '過去の記録を振り返る',
        message: 'カレンダーから今日の記録をタップすると、\nその星にフォーカスされます。\n試してみましょう！',
        highlightTarget: null, // LogViewsModal内の日付は動的
        completionEvent: 'LOG_STAR_FOCUSED',
        noOverlay: true,
    },
    {
        id: 11,
        title: 'メニューを開く',
        message: 'いつでも星をタップして確認できますが、\n先に次の機能を紹介します。\nメニューを開いてみましょう。',
        highlightTarget: '#user-menu-btn',
        completionEvent: 'MENU_OPENED',
    },
    {
        id: 12,
        title: 'マイセイザを開く',
        message: 'メニューから「マイセイザ」を選んで、\n自分だけの星座を見てみましょう。',
        highlightTarget: '#menu-constellation',
        completionEvent: 'CONSTELLATION_OPENED',
    },
    {
        id: 13,
        title: '星座の詳細を見る',
        message: '星座の詳細を確認してみましょう。\nどれか一つをタップしてみてください。',
        highlightTarget: null, // ConstellationModal内の要素
        completionEvent: 'CONSTELLATION_DETAIL_VIEWED',
        noOverlay: true,
    },
    {
        id: 14,
        title: '一覧に戻る',
        message: '詳細を閉じて、\n星座の一覧に戻りましょう。',
        highlightTarget: '.constellation-back-btn',
        completionEvent: 'CONSTELLATION_BACK',
        noOverlay: true,
    },
    {
        id: 15,
        title: 'マイセイザを閉じる',
        message: '右上の「×」ボタンを押して、\nマイセイザを閉じましょう。',
        highlightTarget: '.constellation-close-btn',
        completionEvent: 'CONSTELLATION_CLOSED',
        noOverlay: true,
    },
    {
        id: 16,
        title: 'メニューを開く',
        message: 'メニューを開いて、\n「テーマ」を選んでみましょう。',
        highlightTarget: '#user-menu-btn',
        completionEvent: 'MENU_OPENED',
    },
    {
        id: 17,
        title: 'テーマをひらく',
        message: '好きなテーマを選んで、\n夜空の雰囲気を変えてみましょう。',
        highlightTarget: '#menu-theme',
        completionEvent: 'THEME_OPENED',
    },
    {
        id: 18,
        title: 'テーマを選ぶ',
        message: 'テーマを選んでみましょう。\n夜空の見た目が変わります。',
        highlightTarget: null, // ThemeSelectionModal内の要素
        completionEvent: 'THEME_SELECTED',
        noOverlay: true,
    },
    {
        id: 19,
        title: 'テーマ変更を閉じる',
        message: '右上の「×」ボタンを押して、\nテーマ変更を閉じましょう。',
        highlightTarget: '.theme-close-btn',
        completionEvent: 'THEME_CLOSED',
        noOverlay: true,
    },
    {
        id: 20,
        title: 'メニューを開く',
        message: '右上のメニューを開いてください。',
        highlightTarget: '#user-menu-btn',
        completionEvent: 'FUTURE_MENU_OPENED',
    },
    {
        id: 21,
        title: '未来への手紙を開く',
        message: '「未来への手紙」をタップしてください。',
        highlightTarget: '#menu-future-letter',
        completionEvent: 'FUTURE_MENU_CLICKED',
    },
    {
        id: 22,
        title: '未来の星をタップする',
        message: '画面に浮かぶ星をタップしてみましょう。\n未来の自分にメッセージを送れます。',
        highlightTarget: null, // 3D空間のFutureStar
        completionEvent: 'FUTURE_INPUT_OPENED',
        noOverlay: true,
    },
    {
        id: 23,
        title: '未来へメッセージを送る',
        message: '未来の自分へメッセージを書いて、\n星を発射しましょう。',
        highlightTarget: null, // FutureMessageInputModal内
        completionEvent: 'FUTURE_MESSAGE_SENT',
        noOverlay: true,
    },
    {
        id: 24,
        title: 'もう一度日記をひらく',
        message: 'もう一度日記を書いてみましょう。\nロケットボタンを押してください。',
        highlightTarget: '#rocket-button',
        completionEvent: 'DIARY_OPENED_2',
    },
    {
        id: 25,
        title: '気持ちを記録する',
        message: '今度は全てのスライダーを一番左（0）に\n動かしてみてください。',
        highlightTarget: '#diary-sliders-only',
        completionEvent: 'ALL_SLIDERS_ZERO',
    },
    {
        id: 26,
        title: '気持ちを分類する',
        message: '今度もタグを選んで、気持ちを分類しましょう。',
        highlightTarget: '#diary-tags',
        completionEvent: 'SECOND_TAG_SELECTED',
    },
    {
        id: 27,
        title: '今日の「いいこと」',
        message: '今度も今日あった「いいこと」を３つ\n書いてみましょう。',
        highlightTarget: '#diary-good-things',
        completionEvent: 'SECOND_ALL_GOOD_THINGS_FILLED',
    },
    {
        id: 28,
        title: '星を打ち上げる',
        message: '準備ができました！\n「打ち上げ」ボタンを押してみましょう。\n特別なことが起こるかもしれません。',
        highlightTarget: '#diary-launch-btn',
        completionEvent: 'SLIDERS_LOW_AND_LAUNCHED',
    },
    {
        id: 29,
        title: '流れ星をタップする',
        message: '流れ星が現れました！\n流れ星をタップして、\n過去の自分からのメッセージを受け取りましょう。',
        highlightTarget: null, // 3D空間のShootingStar
        completionEvent: 'SHOOTING_STAR_CLICKED',
        noOverlay: true,
    },
    {
        id: 30,
        title: '過去からのメッセージ',
        message: '過去の自分からのメッセージです。\n読み終わったら閉じましょう。',
        highlightTarget: null,
        completionEvent: 'FUTURE_MESSAGE_READ',
        noOverlay: true,
    },
    {
        id: 31,
        title: 'チュートリアル完了！',
        message: 'すべてのチュートリアルが完了しました。\n夜空の世界を自由にお楽しみください。',
        highlightTarget: null,
        completionEvent: 'TUTORIAL_COMPLETED',
    }
];

export const useTutorialStore = create((set, get) => ({
    // --- 状態 ---
    isActive: false,
    currentStep: 0, // 1-based、0 = 未開始
    steps: TUTORIAL_STEPS,

    // スライダーのトラッキング（Step 2用: どのスライダーが動かされたか）
    movedSliders: new Set(),

    // Good Things のトラッキング（Step 4用: 入力済みの数）
    filledGoodThings: 0,

    // 2回目の日記フラグ (Step 15-16用)
    isSecondDiary: false,

    // チュートリアル中に作成された星のIDリスト（完了/中止時に削除する）
    tutorialStarIds: [],

    // --- アクション ---

    /**
     * チュートリアルを開始する
     * 冷却中の場合は自動的に日付をスキップする
     */
    startTutorial: (isCooldownFn, stars) => {
        // 冷却中なら日付をスキップ
        let offset = getDebugDayOffset();
        let attempts = 0;
        while (isCooldownFn(stars) && attempts < 30) {
            offset += 1;
            setDebugDayOffset(offset);
            attempts++;
        }

        set({
            isActive: true,
            currentStep: 1,
            movedSliders: new Set(),
            filledGoodThings: 0,
            isSecondDiary: false,
            tutorialStarIds: [],
        });
    },

    /**
     * チュートリアル中に作成された星のIDを記録する
     */
    registerTutorialStar: (starId) => {
        if (!starId) return;
        set((state) => ({
            tutorialStarIds: [...state.tutorialStarIds, starId],
        }));
        // ブラウザ強制終了時の兜底としてlocalStorageにも保存
        try {
            const existing = JSON.parse(localStorage.getItem('pending_tutorial_cleanup') || '[]');
            existing.push(starId);
            localStorage.setItem('pending_tutorial_cleanup', JSON.stringify(existing));
        } catch (e) { /* ignore */ }
    },

    /**
     * 次のステップに進む
     */
    nextStep: () => {
        const { currentStep, steps } = get();
        if (currentStep >= steps.length) {
            // 最後のステップ → 完了
            get().completeTutorial();
            return;
        }
        set({ currentStep: currentStep + 1 });
    },

    /**
     * 特定のイベントが発生した時に呼ばれる
     * 現在のステップのcompletionEventと一致すれば次に進む
     */
    triggerEvent: (eventName) => {
        const { isActive, currentStep, steps } = get();
        if (!isActive || currentStep === 0) return;

        const step = steps[currentStep - 1];
        if (step && step.completionEvent === eventName) {
            get().nextStep();
        }
    },

    /**
     * スライダーが動かされたことを記録（Step 2用）
     */
    recordSliderMove: (sliderIndex) => {
        const { isActive } = get();
        if (!isActive) return;
        const currentSliders = get().movedSliders;
        const newSet = new Set(currentSliders);
        newSet.add(sliderIndex);
        set({ movedSliders: newSet });

        if (newSet.size >= 5) {
            get().triggerEvent('ALL_SLIDERS_MOVED');
        }
    },

    // タグを選択した時に呼ばれる
    markTagSelected: () => {
        const { isActive, currentStep } = get();
        if (!isActive || currentStep === 0) return;
        if (currentStep === 3) {
            get().triggerEvent('TAG_SELECTED');
        } else if (currentStep === 26) {
            get().triggerEvent('SECOND_TAG_SELECTED');
        }
    },

    /**
     * 2回目の日記のために日付を+1する（Step 15用）
     */
    skipForSecondDiary: () => {
        const offset = getDebugDayOffset();
        setDebugDayOffset(offset + 1);
        set({ isSecondDiary: true, movedSliders: new Set() });
    },

    /**
     * 中止
     */
    abortTutorial: async () => {
        const { tutorialStarIds } = get();
        // 教程星を削除
        if (tutorialStarIds.length > 0) {
            const { removeStarsByIds } = await import('./useStarStore').then(m => m.useStarStore.getState());
            await removeStarsByIds(tutorialStarIds);
        }
        // localStorage のクリーンアップ記録を削除
        try { localStorage.removeItem('pending_tutorial_cleanup'); } catch (e) { /* ignore */ }
        set({
            isActive: false,
            currentStep: 0,
            movedSliders: new Set(),
            filledGoodThings: 0,
            isSecondDiary: false,
            tutorialStarIds: [],
        });
    },

    /**
     * 完了
     */
    completeTutorial: async () => {
        const { tutorialStarIds } = get();
        // 教程星を削除
        if (tutorialStarIds.length > 0) {
            const { removeStarsByIds } = await import('./useStarStore').then(m => m.useStarStore.getState());
            await removeStarsByIds(tutorialStarIds);
        }
        // localStorage のクリーンアップ記録を削除
        try { localStorage.removeItem('pending_tutorial_cleanup'); } catch (e) { /* ignore */ }

        // チュートリアル完了時に時間を現在時刻にリセット
        setDebugDayOffset(0);

        set({
            isActive: false,
            currentStep: 0,
            movedSliders: new Set(),
            filledGoodThings: 0,
            isSecondDiary: false,
            tutorialStarIds: [],
        });
    },

    /**
     * 現在のステップ定義を取得
     */
    getCurrentStep: () => {
        const { currentStep, steps } = get();
        if (currentStep === 0 || currentStep > steps.length) return null;
        return steps[currentStep - 1];
    },
}));
