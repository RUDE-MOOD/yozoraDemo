import { useState } from 'react'
import loginIllustration from '../../../assets/newUserWelcome.png'

// メールアドレスの正規表現
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
// パスワード: 8文字以上、英字と数字を含む
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/

/**
 * パスワード再設定モーダル
 * Step 1: メールアドレス入力
 * Step 2: 認証コード入力
 * Step 3: 新しいパスワード入力
 */
export function ForgotPasswordModal({ onBackToLogin, onSubmitEmail, onSubmitCode, onSubmitNewPassword }) {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [generalError, setGeneralError] = useState('')

    // Form States
    const [email, setEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Form Errors
    const [emailError, setEmailError] = useState('')
    const [codeError, setCodeError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [confirmPasswordError, setConfirmPasswordError] = useState('')

    // --- Step 1 Handlers ---
    const handleStep1Submit = async (e) => {
        e.preventDefault()
        setEmailError('')
        setGeneralError('')

        if (!email.trim()) {
            setEmailError('メールアドレスを入力してください')
            return
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            setEmailError('正しいメールアドレスの形式で入力してください')
            return
        }

        setIsLoading(true)
        try {
            await onSubmitEmail(email.trim())
            setStep(2)
        } catch (err) {
            setGeneralError(err.message || 'メールアドレスの確認に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    // --- Step 2 Handlers ---
    const handleStep2Submit = async (e) => {
        e.preventDefault()
        setCodeError('')
        setGeneralError('')

        if (!verificationCode.trim()) {
            setCodeError('認証コードを入力してください')
            return
        }

        setIsLoading(true)
        try {
            await onSubmitCode(email.trim(), verificationCode.trim())
            setStep(3)
        } catch (err) {
            setGeneralError(err.message || '認証コードが正しくありません')
        } finally {
            setIsLoading(false)
        }
    }

    // --- Step 3 Handlers ---
    const handleStep3Submit = async (e) => {
        e.preventDefault()
        setPasswordError('')
        setConfirmPasswordError('')
        setGeneralError('')

        let valid = true
        if (!newPassword) {
            setPasswordError('パスワードを入力してください')
            valid = false
        } else if (!PASSWORD_REGEX.test(newPassword)) {
            setPasswordError('8文字以上、英字と数字を含めてください')
            valid = false
        }

        if (!confirmPassword) {
            setConfirmPasswordError('確認用パスワードを入力してください')
            valid = false
        } else if (newPassword !== confirmPassword) {
            setConfirmPasswordError('パスワードが一致しません')
            valid = false
        }

        if (!valid) return

        setIsLoading(true)
        try {
            await onSubmitNewPassword(email.trim(), verificationCode.trim(), newPassword)
            // Success - could auto login or return to login
            onBackToLogin()
        } catch (err) {
            setGeneralError(err.message || 'パスワードの再設定に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    // 共通スタイル
    const labelStyle = {
        display: 'block',
        color: '#ffffff',
        fontSize: '14px',
        marginBottom: '8px',
        letterSpacing: '0.05em',
    }
    const inputStyle = (hasError) => ({
        width: '100%',
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: hasError ? '2px solid #ff6b6b' : '2px solid transparent',
        borderRadius: '24px',
        fontSize: '14px',
        color: '#1a1a1a',
        outline: 'none',
        transition: 'border-color 0.2s ease',
    })
    const fieldErrorStyle = {
        color: '#ff6b6b',
        fontSize: '12px',
        marginTop: '4px',
        paddingLeft: '16px',
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '960px',
                    padding: '40px',
                    gap: '0px',
                }}
            >
                {/* ── 左側: 装飾画像 ── */}
                <div
                    style={{
                        flex: '1 1 45%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <img
                        src={loginIllustration}
                        alt="Yozora"
                        style={{
                            maxWidth: '360px',
                            width: '100%',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.08))',
                        }}
                    />
                </div>

                {/* ── 中央の区切り線 ── */}
                <div
                    style={{
                        width: '1px',
                        height: '320px',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        flexShrink: 0,
                        margin: '0 20px',
                    }}
                />

                {/* ── 右側: フォームエリア ── */}
                <div
                    style={{
                        flex: '1 1 45%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '20px 30px',
                        maxWidth: '380px',
                        minHeight: '380px', // 高さが変わらないようにある程度確保
                    }}
                >
                    {/* タイトルと説明 */}
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 'normal',
                            margin: '0 0 12px 0',
                            letterSpacing: '0.05em'
                        }}>
                            {step === 1 && 'パスワードの再設定'}
                            {step === 2 && '認証コードの入力'}
                            {step === 3 && '新しいパスワードの設定'}
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            margin: 0
                        }}>
                            {step === 1 && 'アカウントに登録されているメールアドレスを入力してください。認証コードを送信します。'}
                            {step === 2 && `送信された認証コードを入力してください。\n(${email})`}
                            {step === 3 && '新しいパスワードを入力してください。'}
                        </p>
                    </div>

                    {/* Step 1: メール入力 */}
                    {step === 1 && (
                        <form onSubmit={handleStep1Submit}>
                            <label style={labelStyle}>メールアドレス</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                                style={inputStyle(emailError)}
                                placeholder=""
                            />
                            {emailError && <div style={fieldErrorStyle}>{emailError}</div>}
                            <div style={{ marginBottom: '24px' }} />

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    type="button"
                                    onClick={onBackToLogin}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: 'transparent',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        border: '1.5px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '24px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        backgroundColor: 'transparent',
                                        color: '#ffffff',
                                        border: '1.5px solid rgba(255, 255, 255, 0.7)',
                                        borderRadius: '24px',
                                        fontSize: '14px',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        opacity: isLoading ? 0.6 : 1,
                                    }}
                                >
                                    {isLoading ? '送信中...' : 'コードを送信'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: コード入力 */}
                    {step === 2 && (
                        <form onSubmit={handleStep2Submit}>
                            <label style={labelStyle}>認証コード</label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => { setVerificationCode(e.target.value); setCodeError('') }}
                                style={inputStyle(codeError)}
                                placeholder="例: 123456"
                            />
                            {codeError && <div style={fieldErrorStyle}>{codeError}</div>}
                            <div style={{ marginBottom: '24px' }} />

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: 'transparent',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        border: '1.5px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '24px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    戻る
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        backgroundColor: 'transparent',
                                        color: '#ffffff',
                                        border: '1.5px solid rgba(255, 255, 255, 0.7)',
                                        borderRadius: '24px',
                                        fontSize: '14px',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        opacity: isLoading ? 0.6 : 1,
                                    }}
                                >
                                    {isLoading ? '確認中...' : '次へ'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: 新パスワード入力 */}
                    {step === 3 && (
                        <form onSubmit={handleStep3Submit}>
                            <label style={labelStyle}>新しいパスワード</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setPasswordError('') }}
                                style={inputStyle(passwordError)}
                            />
                            {passwordError && <div style={fieldErrorStyle}>{passwordError}</div>}
                            <div style={{ marginBottom: '16px' }} />

                            <label style={labelStyle}>新しいパスワード（確認）</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError('') }}
                                style={inputStyle(confirmPasswordError)}
                            />
                            {confirmPasswordError && <div style={fieldErrorStyle}>{confirmPasswordError}</div>}
                            <div style={{ marginBottom: '24px' }} />

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        backgroundColor: 'transparent',
                                        color: '#ffffff',
                                        border: '1.5px solid rgba(255, 255, 255, 0.7)',
                                        borderRadius: '24px',
                                        fontSize: '14px',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        opacity: isLoading ? 0.6 : 1,
                                    }}
                                >
                                    {isLoading ? '設定中...' : 'パスワードを変更'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* 全体エラー表示 */}
                    {generalError && (
                        <div
                            style={{
                                marginTop: '20px',
                                color: '#ff6b6b',
                                fontSize: '13px',
                                textAlign: 'center',
                                padding: '8px 12px',
                                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 107, 107, 0.3)',
                            }}
                        >
                            {generalError}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
