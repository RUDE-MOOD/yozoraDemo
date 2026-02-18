import { useEffect, useState } from 'react'
import loginIllustration from '../assets/newUserWelcome.png'
import { GlitchCanvas } from './GlitchCanvas'

// ══════════════════════════════════════════════════════
//  RegisterSuccessScreen
//
//  タイムライン:
//    0s      → コンテンツ（テキスト＋画像）フェードイン
//    2.0s    → グリッチ開始＋ Yozora読み込み開始
//    2.3s    → コンテンツフェードアウト
//    2.7s    → コンテンツdiv削除
//    4.5s    → グリッチ完全消失 → onGlitchDone
// ══════════════════════════════════════════════════════

export function RegisterSuccessScreen({ onStartApp, onGlitchDone }) {
    const [contentVisible, setContentVisible] = useState(true)
    const [contentOpacity, setContentOpacity] = useState(0)
    const [glitchActive, setGlitchActive] = useState(false)

    const GLITCH_DURATION = 2.5

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
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
                    opacity: contentOpacity,
                    transition: 'opacity 0.4s ease',
                }}>
                    <div style={{
                        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        color: '#fff', fontSize: 28, fontWeight: 300,
                        letterSpacing: '0.15em', marginBottom: 24, zIndex: 3,
                        textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.2)',
                    }}>
                        登録できました！
                    </div>

                    <img src={loginIllustration} alt="" style={{
                        width: 300, height: 'auto', zIndex: 3,
                        filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.15))',
                    }} />

                    <div style={{
                        color: '#fff', fontSize: 22, fontWeight: 300,
                        letterSpacing: '0.12em', marginTop: 28, zIndex: 3,
                        textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.2)',
                    }}>
                        あなただけの空へようこそ！
                    </div>
                </div>
            )}

            {glitchActive && <GlitchCanvas duration={GLITCH_DURATION} />}
        </>
    )
}
