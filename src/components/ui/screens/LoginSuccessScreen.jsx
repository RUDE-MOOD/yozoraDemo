import { useEffect, useState } from 'react'
import loginIllustration from '../../../assets/newUserWelcome.png'
import { GlitchCanvas } from '../../canvas/effects/GlitchCanvas'

// ══════════════════════════════════════════════════════
//  LoginSuccessScreen
//
//  タイムライン:
//    0s      → コンテンツ（画像＋チェックマーク＋テキスト）フェードイン
//    2.0s    → グリッチ開始＋ Yozora読み込み開始
//    2.3s    → コンテンツフェードアウト
//    2.7s    → コンテンツdiv削除
//    4.5s    → グリッチ完全消失 → onGlitchDone
// ══════════════════════════════════════════════════════

export function LoginSuccessScreen({ onStartApp, onGlitchDone }) {
    const [contentVisible, setContentVisible] = useState(true)
    const [contentOpacity, setContentOpacity] = useState(0)
    const [glitchActive, setGlitchActive] = useState(false)

    const GLITCH_DURATION = 2.5

    // レスポンシブ判定
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    useEffect(() => {
        const t1 = setTimeout(() => setContentOpacity(1), 50)
        const t2 = setTimeout(() => {
            setGlitchActive(true)
            if (onStartApp) onStartApp()
        }, 2000)
        const t3 = setTimeout(() => setContentOpacity(0), 2300)
        const t4 = setTimeout(() => setContentVisible(false), 2700)
        const t5 = setTimeout(() => {
            if (onGlitchDone) onGlitchDone()
        }, 2000 + GLITCH_DURATION * 1000)

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            {contentVisible && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    backgroundColor: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
                    opacity: contentOpacity,
                    transition: 'opacity 0.4s ease',
                    ...(isMobile ? { flexDirection: 'column', padding: 20 } : {}),
                }}>
                    {/* ── モバイル用レイアウト ── */}
                    {isMobile ? (
                        <>
                            <div style={{
                                position: 'absolute', width: '80vw', maxWidth: 600, height: '80vw', maxHeight: 600, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)',
                                pointerEvents: 'none',
                            }} />

                            <div style={{
                                color: '#fff', fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 300,
                                letterSpacing: '0.15em', marginBottom: 24, zIndex: 3,
                                textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.2)',
                                textAlign: 'center',
                            }}>
                                ログイン成功！
                            </div>

                            <img src={loginIllustration} alt="" style={{
                                width: 'clamp(200px, 60vw, 300px)', height: 'auto', zIndex: 3,
                                filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.15))',
                            }} />

                            <div style={{
                                color: '#fff', fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 300,
                                letterSpacing: '0.12em', marginTop: 28, zIndex: 3,
                                textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.2)',
                                textAlign: 'center',
                            }}>
                                あなただけの空へようこそ！
                            </div>
                        </>
                    ) : (
                        /* ── PC用レイアウト（既存のまま） ── */
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '100%', maxWidth: 960, padding: 40,
                        }}>
                            {/* 左側: 装飾画像 */}
                            <div style={{
                                flex: '1 1 45%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', padding: 20,
                            }}>
                                <img src={loginIllustration} alt="Yozora" style={{
                                    maxWidth: 360, width: '100%', height: 'auto',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.08))',
                                }} />
                            </div>

                            {/* 中央の区切り線 */}
                            <div style={{
                                width: 1, height: 320,
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                flexShrink: 0, margin: '0 20px',
                            }} />

                            {/* 右側: 成功メッセージ */}
                            <div style={{
                                flex: '1 1 45%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                padding: '20px 30px', maxWidth: 380,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    {/* チェックマーク */}
                                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ flexShrink: 0 }}>
                                        <path
                                            d="M10 28L22 42L46 14"
                                            stroke="rgba(255,255,255,0.85)"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            fill="none"
                                        />
                                    </svg>

                                    <div style={{
                                        color: '#fff', fontSize: 28, fontWeight: 300,
                                        letterSpacing: '0.08em', lineHeight: 1.5,
                                    }}>
                                        ログイン<br />成功！
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {glitchActive && <GlitchCanvas duration={GLITCH_DURATION} />}
        </>
    )
}
