import { useEffect, useState, useCallback, useRef } from 'react';
import { useTutorialStore } from '../../store/useTutorialStore';

/**
 * チュートリアルオーバーレイ
 * 
 * ゲーム風のUI教学：
 * - 全画面の暗幕（rgba(0,0,0,0.7)）
 * - ハイライト対象を z-index で overlay の上に引き上げる
 * - tooltipで説明文を表示
 * - 中止ボタン
 * 
 * クリック問題の解決方法:
 * ハイライト対象の要素に直接 style を設定して z-index を overlay より上に引き上げる。
 * これにより、ユーザーはハイライトされた要素を直接クリックできる。
 */
export function TutorialOverlay() {
    const { isActive, currentStep, steps, abortTutorial, completeTutorial, movedSliders, filledGoodThings } = useTutorialStore();
    const [highlightRect, setHighlightRect] = useState(null);
    const rafRef = useRef(null);
    // 引き上げた要素のリスト（ターゲット + 親スタッキングコンテキスト）
    const elevatedEls = useRef([]);

    const rawStep = currentStep > 0 && currentStep <= steps.length ? steps[currentStep - 1] : null;

    // スマホ版のStep 4, 27ではキーボードによるレイアウト崩れを防ぐため
    // ハイライト枠と背景暗幕を無効化する（PC版は従来通り）
    const isMobile = window.innerWidth < 768;
    const step = rawStep ? { ...rawStep } : null;
    if (step && isMobile && [4, 27].includes(currentStep)) {
        step.highlightTarget = null;
        step.noOverlay = true;
    }

    // ハイライト対象の要素 + 親のスタッキングコンテキストを引き上げる
    useEffect(() => {
        // 前のステップで引き上げた要素をすべてリセット
        elevatedEls.current.forEach(({ el, origZIndex, origPosition }) => {
            if (origZIndex !== undefined) {
                el.style.zIndex = origZIndex;
            } else {
                el.style.removeProperty('z-index');
            }
            if (origPosition !== undefined) {
                el.style.position = origPosition;
            } else {
                el.style.removeProperty('position');
            }
        });
        elevatedEls.current = [];

        if (!isActive || !step?.highlightTarget) return;

        const els = document.querySelectorAll(step.highlightTarget);
        let el = null;
        for (const e of els) {
            if (e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0) {
                el = e;
                break;
            }
        }
        if (!el) return;

        // ターゲット要素自体を引き上げ
        elevatedEls.current.push({
            el,
            origZIndex: el.style.zIndex || undefined,
            origPosition: el.style.position || undefined,
        });
        el.style.zIndex = '10000';
        if (window.getComputedStyle(el).position === 'static') {
            el.style.position = 'relative';
        }

        // 親要素を走査して、z-index でスタッキングコンテキストを作っているものも引き上げる
        let current = el.parentElement;
        while (current && current !== document.body) {
            const computed = window.getComputedStyle(current);
            const zVal = computed.zIndex;
            // z-index が auto 以外 → スタッキングコンテキストを形成
            if (zVal !== 'auto') {
                elevatedEls.current.push({
                    el: current,
                    origZIndex: current.style.zIndex || undefined,
                    origPosition: current.style.position || undefined,
                });
                current.style.zIndex = '9999';
            }
            current = current.parentElement;
        }

        return () => {
            elevatedEls.current.forEach(({ el: e, origZIndex, origPosition }) => {
                if (origZIndex !== undefined) {
                    e.style.zIndex = origZIndex;
                } else {
                    e.style.removeProperty('z-index');
                }
                if (origPosition !== undefined) {
                    e.style.position = origPosition;
                } else {
                    e.style.removeProperty('position');
                }
            });
            elevatedEls.current = [];
        };
    }, [isActive, step]);

    // ハイライト対象の位置を追跡
    const updateHighlightPosition = useCallback(() => {
        if (!step?.highlightTarget) {
            setHighlightRect(null);
            return;
        }
        const els = document.querySelectorAll(step.highlightTarget);
        let el = null;
        for (const e of els) {
            if (e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0) {
                el = e;
                break;
            }
        }
        if (el) {
            const rect = el.getBoundingClientRect();
            const padding = 8;
            setHighlightRect({
                x: rect.x - padding,
                y: rect.y - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
            });
        } else {
            setHighlightRect(null);
        }
    }, [step]);

    useEffect(() => {
        if (!isActive || !step) return;

        const track = () => {
            updateHighlightPosition();
            rafRef.current = requestAnimationFrame(track);
        };
        track();

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isActive, step, updateHighlightPosition]);

    // Step 7 は StarDetailModal 内部で直接レンダリングするため、TutorialOverlay 自体は null を返す。
    if (!isActive || !step || currentStep === 7) return null;

    const isLastStep = currentStep === steps.length;

    // tooltip位置の計算（ハイライトがある場合はその近くに、ない場合は画面中央下部に）
    const getTooltipStyle = () => {
        if (!highlightRect) {
            // ハイライトなし → 画面の中央下に配置
            if (currentStep === 30) {
                return {
                    position: 'fixed',
                    bottom: '5%',
                    left: '0',
                    right: '0',
                    margin: '0 auto',
                    maxWidth: '90vw',
                    width: '420px',
                };
            }
            return {
                position: 'fixed',
                bottom: '15%',
                left: '0',
                right: '0',
                margin: '0 auto',
                maxWidth: '90vw',
                width: '420px',
            };
        }

        const viewportH = window.innerHeight;
        const viewportW = window.innerWidth;
        const tooltipH = 180; // 推定tooltip高さ
        const tooltipW = Math.min(420, viewportW * 0.9);
        const spaceBelow = viewportH - (highlightRect.y + highlightRect.height);
        const spaceAbove = highlightRect.y;

        let top, left;

        // 下に余裕があれば下に配置、なければ上
        if (spaceBelow > tooltipH + 20) {
            top = highlightRect.y + highlightRect.height + 16;
        } else if (spaceAbove > tooltipH + 20) {
            top = highlightRect.y - tooltipH - 16;
        } else {
            top = viewportH - tooltipH - 40;
        }

        // 中央寄せ
        left = highlightRect.x + highlightRect.width / 2 - tooltipW / 2;
        left = Math.max(16, Math.min(left, viewportW - tooltipW - 16));

        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            maxWidth: '90vw',
            width: `${tooltipW}px`,
        };
    };

    return (
        <>
            {/* 暗幕マスク — noOverlay のステップでは表示しない */}
            {!step.noOverlay && (
                highlightRect ? (
                    <div
                        className="tutorial-mask"
                        style={{
                            position: 'fixed',
                            zIndex: 9998,
                            background: 'transparent',
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                            borderRadius: '12px',
                            left: `${highlightRect.x}px`,
                            top: `${highlightRect.y}px`,
                            width: `${highlightRect.width}px`,
                            height: `${highlightRect.height}px`,
                            transition: 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease',
                            pointerEvents: 'none',
                        }}
                    />
                ) : (
                    <div
                        className="tutorial-mask"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            zIndex: 9998,
                            pointerEvents: 'none',
                        }}
                    />
                )
            )}

            {/* パルスアニメーション（ハイライト対象周り） */}
            {highlightRect && (
                <div
                    className="tutorial-highlight-pulse"
                    style={{
                        position: 'fixed',
                        left: `${highlightRect.x}px`,
                        top: `${highlightRect.y}px`,
                        width: `${highlightRect.width}px`,
                        height: `${highlightRect.height}px`,
                        zIndex: 10000,
                        pointerEvents: 'none',
                        borderRadius: '12px',
                    }}
                />
            )}

            {/* ═══ ツールチップ ═══ */}
            <div
                className="tutorial-tooltip"
                style={{
                    ...([4, 27].includes(currentStep) ? {
                        // Step 4, 27: 日記モーダルの底辺に固定（入力欄を遮らない）
                        position: 'fixed',
                        bottom: '8px',
                        left: '0',
                        right: '0',
                        margin: '0 auto',
                        maxWidth: '90vw',
                        width: '420px',
                    } : currentStep === 6 ? {
                        // Step 6: 星の正下方（画面中央やや下）に配置
                        position: 'fixed',
                        top: '72.5%',
                        left: '0',
                        right: '0',
                        margin: '0 auto',
                        maxWidth: '90vw',
                        width: '420px',
                    } : currentStep === 7 ? {
                        // Step 7: 星の詳細モーダルの上部に配置
                        position: 'fixed',
                        top: '12%',
                        left: '0',
                        right: '0',
                        margin: '0 auto',
                        maxWidth: '90vw',
                        width: '420px',
                    } : [8, 16, 20].includes(currentStep) ? {
                        // Step 8, 16, 20: ユーザーメニューを開くため、メニューを遮らないように画面中央やや下に配置
                        position: 'fixed',
                        top: '50%',
                        left: '0',
                        right: '0',
                        margin: '0 auto',
                        maxWidth: '90vw',
                        width: '420px',
                    } : [18, 23].includes(currentStep) ? {
                        // Step 18, 23: モーダルの選択肢や入力欄を遮らないように画面最下部に配置
                        position: 'fixed',
                        bottom: '2px',
                        left: '0',
                        right: '0',
                        margin: '0 auto',
                        maxWidth: '90vw',
                        width: '420px',
                    } : currentStep === 11 ? {
                        // Step 11: マイセイザ案内（画面下部に配置してメニューを遮らない）
                        position: 'fixed',
                        top: '72.5%',
                        left: '0',
                        right: '0',
                        margin: '0 auto',
                        maxWidth: '90vw',
                        width: '420px',
                    } : getTooltipStyle()),
                    zIndex: 10002,
                    padding: '16px 20px', // StarDetailModal の px-5 py-4 に合わせる
                }}
            >
                {/* ステップバッジ + タイトル */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="tutorial-step-badge">
                            {currentStep}
                        </span>
                        <span style={{
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: 'Kiwi Maru, sans-serif',
                            letterSpacing: '0.05em',
                        }}>
                            {step.title}
                        </span>
                    </div>

                    {/* 中止ボタン */}
                    {!isLastStep && (
                        <button
                            onClick={abortTutorial}
                            className="tutorial-abort-btn"
                        >
                            中止
                        </button>
                    )}
                </div>

                {/* メッセージ */}
                <p style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '13px',
                    lineHeight: '1.8',
                    fontFamily: 'Kiwi Maru, sans-serif',
                    whiteSpace: 'pre-line',
                    margin: 0,
                }}>
                    {step.message}
                </p>

                {/* Step 2: スライダーカウンター */}
                {currentStep === 2 && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px 14px',
                        background: 'rgba(0, 170, 255, 0.1)',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 170, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}>
                        <span style={{
                            color: movedSliders.size >= 5 ? '#4ade80' : 'rgba(0, 200, 255, 0.9)',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: 'Kiwi Maru, sans-serif',
                        }}>
                            {movedSliders.size >= 5 ? '✓ 全て完了！' : `${movedSliders.size} / 5 完了`}
                        </span>
                    </div>
                )}

                {/* Step 4, 27: 3 Good Things カウンター */}
                {[4, 27].includes(currentStep) && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px 14px',
                        background: 'rgba(0, 170, 255, 0.1)',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 170, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}>
                        <span style={{
                            color: filledGoodThings >= 3 ? '#4ade80' : 'rgba(0, 200, 255, 0.9)',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: 'Kiwi Maru, sans-serif',
                        }}>
                            {filledGoodThings >= 3 ? '✓ 全て完了！' : `${filledGoodThings} / 3 完了`}
                        </span>
                    </div>
                )}

                {/* 最終ステップ: 完了ボタン */}
                {isLastStep && (
                    <button
                        onClick={completeTutorial}
                        style={{
                            width: '100%',
                            marginTop: '16px',
                            padding: '12px',
                            background: 'rgba(0, 170, 255, 0.1)',
                            border: '1px solid rgba(0, 170, 255, 0.3)',
                            borderRadius: '12px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: 'Kiwi Maru, sans-serif',
                            cursor: 'pointer',
                            letterSpacing: '0.1em',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(0, 170, 255, 0.2)';
                            e.target.style.borderColor = 'rgba(0, 170, 255, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(0, 170, 255, 0.1)';
                            e.target.style.borderColor = 'rgba(0, 170, 255, 0.3)';
                        }}
                    >
                        空へ
                    </button>
                )}
            </div>
        </>
    );
}
