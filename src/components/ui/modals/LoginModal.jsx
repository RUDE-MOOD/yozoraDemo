import { useState, useEffect } from "react";
import loginIllustration from "../../../assets/newUserWelcome.png";

// メールアドレスの正規表現
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// パスワード: 8文字以上、英字と数字を含む
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

/**
 * ログインモーダル
 * PC: 左に装飾画像、右にログインフォーム。
 * モバイル: タブ切替UI + フォーム
 */
export function LoginModal({ onLogin, onRegister, onForgotPassword }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // フィールドごとのエラー
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    // 全体エラー（認証失敗など）
    const [generalError, setGeneralError] = useState("");

    // レスポンシブ判定
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const validate = () => {
        let valid = true;
        setEmailError("");
        setPasswordError("");
        setGeneralError("");

        if (!email.trim()) {
            setEmailError("メールアドレスを入力してください");
            valid = false;
        } else if (!EMAIL_REGEX.test(email.trim())) {
            setEmailError("正しいメールアドレスの形式で入力してください");
            valid = false;
        }

        if (!password) {
            setPasswordError("パスワードを入力してください");
            valid = false;
        } else if (!PASSWORD_REGEX.test(password)) {
            setPasswordError("8文字以上、英字と数字を含めてください");
            valid = false;
        }

        return valid;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setGeneralError("");
        try {
            await onLogin(email.trim(), password);
        } catch (err) {
            setGeneralError(err.message || "ログインに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    // エラーテキストのスタイル
    const fieldErrorStyle = {
        color: "#ff6b6b",
        fontSize: "12px",
        marginTop: "4px",
        marginBottom: "4px",
        paddingLeft: "16px",
    };

    // ──────────────────────────────────────────
    //  モバイル用レイアウト
    // ──────────────────────────────────────────
    if (isMobile) {
        return (
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    backgroundColor: "#1a1a1a",
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
                    overflowY: "auto",
                }}
            >
                {/* ── タブ切替 (新規登録 / ログイン) ── */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "28px 24px 24px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            borderRadius: "28px",
                            overflow: "hidden",
                            border: "1.5px solid rgba(255,255,255,0.3)",
                        }}
                    >
                        {/* 新規登録（非アクティブ → 白背景） */}
                        <button
                            type="button"
                            onClick={onRegister}
                            style={{
                                padding: "12px 28px",
                                fontSize: "15px",
                                fontWeight: "bold",
                                border: "none",
                                cursor: "pointer",
                                letterSpacing: "0.08em",
                                backgroundColor: "#ffffff",
                                color: "#000000",
                                borderRadius: "28px 0 0 28px",
                            }}
                        >
                            新規登録
                        </button>
                        {/* ログイン（アクティブ → 黒背景） */}
                        <button
                            type="button"
                            style={{
                                padding: "12px 28px",
                                fontSize: "15px",
                                fontWeight: "bold",
                                border: "none",
                                cursor: "pointer",
                                letterSpacing: "0.08em",
                                backgroundColor: "#1a1a1a",
                                color: "#ffffff",
                                borderRadius: "0 28px 28px 0",
                            }}
                        >
                            ログイン
                        </button>
                    </div>
                </div>

                {/* ── ログインフォーム ── */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        padding: "60px 32px 32px",
                        animation: "mobileAuthFadeIn 0.25s ease",
                    }}
                >
                    <form onSubmit={handleLogin}>
                        {/* メールアドレス */}
                        <label
                            style={{
                                display: "block",
                                color: "#ffffff",
                                fontSize: "13px",
                                marginBottom: "6px",
                                letterSpacing: "0.05em",
                            }}
                        >
                            メールアドレス
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError("");
                            }}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                border: emailError
                                    ? "2px solid #ff6b6b"
                                    : "2px solid transparent",
                                borderRadius: "24px",
                                fontSize: "14px",
                                color: "#1a1a1a",
                                outline: "none",
                                transition: "border-color 0.2s ease",
                            }}
                        />
                        {emailError && <div style={fieldErrorStyle}>{emailError}</div>}
                        <div style={{ marginBottom: emailError ? "12px" : "24px" }} />

                        {/* パスワード */}
                        <label
                            style={{
                                display: "block",
                                color: "#ffffff",
                                fontSize: "13px",
                                marginBottom: "6px",
                                letterSpacing: "0.05em",
                            }}
                        >
                            パスワード
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setPasswordError("");
                            }}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                border: passwordError
                                    ? "2px solid #ff6b6b"
                                    : "2px solid transparent",
                                borderRadius: "24px",
                                fontSize: "14px",
                                color: "#1a1a1a",
                                outline: "none",
                                transition: "border-color 0.2s ease",
                            }}
                        />
                        {passwordError && (
                            <div style={fieldErrorStyle}>{passwordError}</div>
                        )}

                        {/* パスワードを忘れた場合 */}
                        <div style={{ textAlign: "right", marginTop: "8px", marginBottom: "24px" }}>
                            <button
                                type="button"
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "rgba(100, 180, 255, 0.8)",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    padding: 0,
                                    letterSpacing: "0.03em",
                                }}
                                onClick={onForgotPassword}
                            >
                                パスワード忘れた場合
                            </button>
                        </div>

                        {/* 全体エラーメッセージ */}
                        {generalError && (
                            <div
                                style={{
                                    color: "#ff6b6b",
                                    fontSize: "13px",
                                    marginBottom: "16px",
                                    textAlign: "center",
                                    padding: "8px 12px",
                                    backgroundColor: "rgba(255, 107, 107, 0.1)",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255, 107, 107, 0.3)",
                                }}
                            >
                                {generalError}
                            </div>
                        )}

                        {/* ログインボタン */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: "100%",
                                padding: "12px 24px",
                                backgroundColor: "#ffffff",
                                color: "#000000",
                                border: "1.5px solid rgba(255,255,255,0.7)",
                                borderRadius: "24px",
                                fontSize: "14px",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                letterSpacing: "0.08em",
                                transition: "all 0.2s ease",
                                opacity: isLoading ? 0.6 : 1,
                            }}
                        >
                            {isLoading ? "..." : "ログイン"}
                        </button>
                    </form>
                </div>

                {/* フェードインアニメーション */}
                <style>{`
                    @keyframes mobileAuthFadeIn {
                        from { opacity: 0; transform: translateY(8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        );
    }

    // ──────────────────────────────────────────
    //  PC用レイアウト（既存のまま）
    // ──────────────────────────────────────────
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                backgroundColor: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    maxWidth: "960px",
                    padding: "40px",
                    gap: "0px",
                }}
            >
                {/* ── 左側: 装飾画像 ── */}
                <div
                    style={{
                        flex: "1 1 45%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                >
                    <img
                        src={loginIllustration}
                        alt="Yozora"
                        style={{
                            maxWidth: "360px",
                            width: "100%",
                            height: "auto",
                            objectFit: "contain",
                            filter: "drop-shadow(0 0 30px rgba(255, 255, 255, 0.08))",
                        }}
                    />
                </div>

                {/* ── 中央の区切り線 ── */}
                <div
                    style={{
                        width: "1px",
                        height: "320px",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        flexShrink: 0,
                        margin: "0 20px",
                    }}
                />

                {/* ── 右側: ログインフォーム ── */}
                <div
                    style={{
                        flex: "1 1 45%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        padding: "20px 30px",
                        maxWidth: "380px",
                    }}
                >
                    <form onSubmit={handleLogin}>
                        {/* メールアドレス */}
                        <label
                            style={{
                                display: "block",
                                color: "#ffffff",
                                fontSize: "14px",
                                marginBottom: "8px",
                                letterSpacing: "0.05em",
                            }}
                        >
                            メールアドレス
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError("");
                            }}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                border: emailError
                                    ? "2px solid #ff6b6b"
                                    : "2px solid transparent",
                                borderRadius: "24px",
                                fontSize: "14px",
                                color: "#1a1a1a",
                                outline: "none",
                                transition: "border-color 0.2s ease",
                            }}
                            placeholder=""
                        />
                        {emailError && <div style={fieldErrorStyle}>{emailError}</div>}
                        <div style={{ marginBottom: emailError ? "12px" : "24px" }} />

                        {/* パスワード */}
                        <label
                            style={{
                                display: "block",
                                color: "#ffffff",
                                fontSize: "14px",
                                marginBottom: "8px",
                                letterSpacing: "0.05em",
                            }}
                        >
                            パスワード
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setPasswordError("");
                            }}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                border: passwordError
                                    ? "2px solid #ff6b6b"
                                    : "2px solid transparent",
                                borderRadius: "24px",
                                fontSize: "14px",
                                color: "#1a1a1a",
                                outline: "none",
                                transition: "border-color 0.2s ease",
                            }}
                            placeholder=""
                        />
                        {passwordError && (
                            <div style={fieldErrorStyle}>{passwordError}</div>
                        )}
                        <div style={{ marginBottom: passwordError ? "0px" : "8px" }} />

                        {/* パスワードを忘れた場合 */}
                        <div style={{ textAlign: "right", marginBottom: "20px" }}>
                            <button
                                type="button"
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "rgba(255, 255, 255, 0.5)",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    padding: 0,
                                    letterSpacing: "0.03em",
                                }}
                                onClick={onForgotPassword}
                            >
                                パスワードを忘れた場合
                            </button>
                        </div>

                        {/* 全体エラーメッセージ（認証失敗など） */}
                        {generalError && (
                            <div
                                style={{
                                    color: "#ff6b6b",
                                    fontSize: "13px",
                                    marginBottom: "12px",
                                    textAlign: "center",
                                    padding: "8px 12px",
                                    backgroundColor: "rgba(255, 107, 107, 0.1)",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255, 107, 107, 0.3)",
                                }}
                            >
                                {generalError}
                            </div>
                        )}

                        {/* ボタン */}
                        <div
                            style={{
                                display: "flex",
                                gap: "16px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={onRegister}
                                style={{
                                    flex: 1,
                                    padding: "12px 24px",
                                    backgroundColor: "transparent",
                                    color: "#ffffff",
                                    border: "1.5px solid rgba(255, 255, 255, 0.7)",
                                    borderRadius: "24px",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    letterSpacing: "0.08em",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
                                    e.target.style.borderColor = "#ffffff";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "transparent";
                                    e.target.style.borderColor = "rgba(255,255,255,0.7)";
                                }}
                            >
                                新規登録
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    padding: "12px 24px",
                                    backgroundColor: "#ffffff",
                                    color: "#000000",
                                    border: "1.5px solid rgba(255, 255, 255, 0.7)",
                                    borderRadius: "24px",
                                    fontSize: "14px",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    letterSpacing: "0.08em",
                                    transition: "all 0.2s ease",
                                    opacity: isLoading ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isLoading) {
                                        e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
                                        e.target.style.borderColor = "#ffffff";
                                        e.target.style.color = "#ffffff";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "#ffffff";
                                    e.target.style.borderColor = "rgba(255,255,255,0.7)";
                                    e.target.style.color = "#000000";
                                }}
                            >
                                {isLoading ? "..." : "ログイン"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}