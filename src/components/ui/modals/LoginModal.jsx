import { useState } from "react";
import loginIllustration from "../../../assets/newUserWelcome.png";

// メールアドレスの正規表現
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// パスワード: 8文字以上、英字と数字を含む
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

/**
 * ログインモーダル
 * セッションにUIDがない場合に全画面表示される。
 * 純黒背景（透明度なし）で、左に装飾画像、右にログインフォーム。
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

    const validate = () => {
        let valid = true;
        setEmailError("");
        setPasswordError("");
        setGeneralError("");

        // メールアドレス: 未入力チェック
        if (!email.trim()) {
            setEmailError("メールアドレスを入力してください");
            valid = false;
        } else if (!EMAIL_REGEX.test(email.trim())) {
            // メールアドレス: フォーマットチェック
            setEmailError("正しいメールアドレスの形式で入力してください");
            valid = false;
        }

        // パスワード: 未入力チェック
        if (!password) {
            setPasswordError("パスワードを入力してください");
            valid = false;
        } else if (!PASSWORD_REGEX.test(password)) {
            // パスワード: フォーマットチェック
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