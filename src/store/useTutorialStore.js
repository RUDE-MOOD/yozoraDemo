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
        title: 'チュートリアル',
        message: 'まずはあなたの想いを星にして空へ放ちましょう。\n右下のロケットボタンを押してください。',
        highlightTarget: '#rocket-button',
        completionEvent: 'DIARY_OPENED',
    },
    {
        id: 2,
        title: 'チュートリアル',
        message: '5つの質問に答えましょう。\nスライダーを動かして、今の気持ちを表現してください。',
        highlightTarget: '#diary-sliders-only',
        completionEvent: 'ALL_SLIDERS_MOVED',
    },
    {
        id: 3,
        title: 'チュートリアル',
        message: 'タグを選んで、今日の気持ちを分類しましょう。',
        highlightTarget: '#diary-tags',
        completionEvent: 'TAG_SELECTED',
    },
    {
        id: 4,
        title: 'チュートリアル',
        message: '今日あった「いいこと」を3つ書いてみましょう。\n小さなことでも大丈夫です。',
        highlightTarget: '#diary-good-things',
        completionEvent: 'ALL_GOOD_THINGS_FILLED',
    },
    {
        id: 5,
        title: 'チュートリアル',
        message: '準備ができました！\n「打ち上げ」ボタンを押して、星を空に放ちましょう。',
        highlightTarget: '#diary-launch-btn',
        completionEvent: 'STAR_LAUNCHED',
    },
    {
        id: 6,
        title: 'チュートリアル',
        message: 'あなたの星が生まれました！\n星をタップして、詳細を確認してみましょう。',
        highlightTarget: null, // 3D空間の星なのでDOM要素ではない
        completionEvent: 'STAR_DETAIL_OPENED',
        noOverlay: true, // 星が見えるように
    },
    {
        id: 7,
        title: 'チュートリアル',
        message: '今日のあなたへのメッセージです。\n読み終わったら、右上の「×」ボタンを押して\n詳細を閉じてみましょう。',
        highlightTarget: null, // モーダルの上に配置したい
        completionEvent: 'STAR_DETAIL_VIEWED',
        noOverlay: true,
    },
    {
        id: 8,
        title: 'チュートリアル',
        message: '今までに見つけた星や飛ばした星は「ログ」\nから振り返ることができます。右上のメニュー（PC）\nまたは左下のメニュー（スマホ）から「ログ」\nを開いてみましょう。',
        highlightTarget: '#user-menu-btn',
        completionEvent: 'LOG_OPENED',
    },
    {
        id: 9,
        title: 'チュートリアル',
        message: 'カレンダーから今日の記録をタップすると、\nその星にフォーカスされます。\n試してみましょう！',
        highlightTarget: null, // LogViewsModal内の日付は動的
        completionEvent: 'LOG_STAR_FOCUSED',
        noOverlay: true,
    },
    {
        id: 10,
        title: 'チュートリアル',
        message: 'メニューから「マイセイザ」を\n開いてみましょう。',
        highlightTarget: '#user-menu-btn',
        completionEvent: 'CONSTELLATION_OPENED',
    },
    {
        id: 11,
        title: 'チュートリアル',
        message: '星座の詳細を確認してみましょう。\nどれか一つをタップしてみてください。',
        highlightTarget: null, // ConstellationModal内の要素
        completionEvent: 'CONSTELLATION_DETAIL_VIEWED',
        noOverlay: true,
    },
    {
        id: 12,
        title: 'チュートリアル',
        message: 'メニューから「テーマ」を\n開いてみましょう。',
        highlightTarget: '#user-menu-btn',
        completionEvent: 'THEME_OPENED',
    },
    {
        id: 13,
        title: 'チュートリアル',
        message: '好きなテーマを選んで、\n夜空の雰囲気を変えてみましょう。',
        highlightTarget: null, // ThemeSelectionModal内の要素
        completionEvent: 'THEME_SELECTED',
        noOverlay: true,
    },
    {
        id: 14,
        title: 'チュートリアル',
        message: '画面に浮かぶ「未来への手紙」を\n見つけてタップしてみましょう。\n未来の自分にメッセージを送れます。',
        highlightTarget: null, // 3D空間のFutureStar
        completionEvent: 'FUTURE_INPUT_OPENED',
        noOverlay: true,
    },
    {
        id: 15,
        title: 'チュートリアル',
        message: '未来の自分へメッセージを書いて、\n星を発射しましょう。',
        highlightTarget: null, // FutureMessageInputModal内
        completionEvent: 'FUTURE_MESSAGE_SENT',
        noOverlay: true,
    },
    {
        id: 16,
        title: 'チュートリアル',
        message: 'もう一度日記を書いてみましょう。\nロケットボタンを押してください。',
        highlightTarget: '#rocket-button',
        completionEvent: 'DIARY_OPENED_2',
    },
    {
        id: 17,
        title: 'チュートリアル',
        message: '今度はスライダーを全て左側（25以下）に\n動かしてみてください。\n特別なことが起こるかもしれません。',
        highlightTarget: '#diary-sliders-only',
        completionEvent: 'SLIDERS_LOW_AND_LAUNCHED',
    },
    {
        id: 18,
        title: 'チュートリアル',
        message: '流れ星が現れました！\n流れ星をタップして、\n過去の自分からのメッセージを受け取りましょう。',
        highlightTarget: null, // 3D空間のShootingStar
        completionEvent: 'SHOOTING_STAR_CLICKED',
        noOverlay: true,
    },
    {
        id: 19,
        title: 'チュートリアル',
        message: '過去の自分からのメッセージです。\n読み終わったら閉じましょう。',
        highlightTarget: null,
        completionEvent: 'FUTURE_MESSAGE_READ',
        noOverlay: true,
    },
    {
        id: 20,
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
        });
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
        get().triggerEvent('TAG_SELECTED');
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
    abortTutorial: () => {
        set({
            isActive: false,
            currentStep: 0,
            movedSliders: new Set(),
            filledGoodThings: 0,
            isSecondDiary: false,
        });
    },

    /**
     * 完了
     */
    completeTutorial: () => {
        set({
            isActive: false,
            currentStep: 0,
            movedSliders: new Set(),
            filledGoodThings: 0,
            isSecondDiary: false,
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
